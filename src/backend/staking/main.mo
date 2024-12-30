import Principal "mo:base/Principal";
import Time "mo:base/Time";
import Nat "mo:base/Nat";
import Nat64 "mo:base/Nat64";
import Result "mo:base/Result";
import Int "mo:base/Int";
import Buffer "mo:base/Buffer";
import Timer "mo:base/Timer";
import Debug "mo:base/Debug";
import Float "mo:base/Float";
import Error "mo:base/Error";
import Array "mo:base/Array";
import Text "mo:base/Text";
import Int64 "mo:base/Int64";
import Types "types";
import Icrc "../service/icrc-interface"; // ICRC token interface
import IcrcIndex "../service/icrc-index-interface";
import Map "mo:map/Map";
actor class DoxaStaking() = this {
	// Token interfaces
	private let USDx : Icrc.Self = actor ("irorr-5aaaa-aaaak-qddsq-cai"); // USDx token canister
	private let USDxIndex : IcrcIndex.Self = actor ("modmy-byaaa-aaaag-qndgq-cai");

	// Lock duration and bootstrap constants in nanoseconds
	private let MIN_LOCK_DURATION_IN_NANOS : Nat = 2_592_000_000_000_000; // 30 days minimum
	private let MAX_LOCK_DURATION_IN_NANOS : Nat = 31_536_000_000_000_000; // 365 days maximum
	private let ONE_YEAR_IN_NANOS : Nat = 31_536_000_000_000_000; // For APR calculation
	private let BOOTSTRAP_MULTIPLIER_DURATION_IN_NANOS : Nat = 7_776_000_000_000_000; // 90 days for multiplier validity

	// Bootstrap phase requirements
	private let MIN_STAKERS : Nat = 20;
	private let MIN_TOTAL_STAKE : Nat = 100_000_000_000; // 100,000 tokens with 6 decimals
	private let BOOTSTRAP_PERIOD_IN_NANOS : Nat = 2_592_000_000_000_000; // 30 days in nanoseconds
	private let MAX_STAKE_PER_ADDRESS : Nat = MIN_TOTAL_STAKE / 5; // 20% of minimum total stake

	// Pool configuration
	private stable var pool : Types.StakingPool = {
		name = "Doxa Dynamic Staking";
		startTime = Time.now();
		endTime = Time.now() + ONE_YEAR_IN_NANOS;
		totalStaked = 0;
		rewardTokenFee = 50_000; // 0.05 tokens with 6 decimals
		stakingSymbol = "USDx";
		stakingToken = "doxa-dollar";
		rewardSymbol = "USDx";
		rewardToken = "doxa-dollar";
		minimumStake = 10_000_000; // 10 tokens with 6 decimals
		lockDuration = MIN_LOCK_DURATION_IN_NANOS;
		minTotalStake = MIN_TOTAL_STAKE; // 100,000 tokens with 6 decimals
	};

	let { nhash; phash } = Map;

	// Storage
	private stable let stakes = Map.new<Types.StakeId, Types.Stake>();
	private stable let userStakes = Map.new<Principal, [Types.StakeId]>();
	private stable let earlyStakers = Map.new<Principal, Nat>(); // Maps early stakers to their multiplier (multiplier * 1_000_000)
	private stable var bootstrapStartTime : Time.Time = 0;
	private stable var isBootstrapPhase : Bool = true;

	// Type aliases
	private type BlockIndex = Nat;

	// Transaction tracking
	private stable let stakeBlockIndices = Map.new<Principal, [BlockIndex]>();
	private stable let unStakeBlockIndices = Map.new<Principal, [BlockIndex]>();
	private stable let harvestBlockIndices = Map.new<Principal, [BlockIndex]>();
	private stable let processedStakeTransactions = Map.new<Nat, Principal>();

	// Counters and timers
	private stable var nextStakeId : Nat = 0;
	private stable var _tranIdx : Nat = 0;
	private stable var _harvestIdx : Nat = 0;
	private let MIN_REWARD_INTERVAL_IN_NANOS : Nat = 3600_000_000_000; // 1 hour in nanoseconds
	private stable var feeCollectedFetchTimer = 0;

	type Tokens = {
		#USDx;
	};

	//////////////////////////////////////////////////////////////////////////////////////////////
	///////////////////////////////  bootstrap ///////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////////////////////////////

	private func updateBootstrapPhase() : () {
		let currentTime = Time.now();

		// If bootstrap hasn't started yet, start it
		if (bootstrapStartTime == 0) {
			bootstrapStartTime := currentTime;
		};

		// Check if bootstrap period is over
		if (currentTime > bootstrapStartTime + BOOTSTRAP_PERIOD_IN_NANOS) {
			isBootstrapPhase := false;
		};
	};

	public query func getBootstrapStatus() : async {
		isBootstrapPhase : Bool;
		timeRemaining : Int;
	} {
		let currentTime = Time.now();
		let timeRemaining = if (bootstrapStartTime == 0) {
			// Bootstrap hasn't started yet, show full duration
			BOOTSTRAP_PERIOD_IN_NANOS;
		} else if (not isBootstrapPhase) {
			// Bootstrap phase is over
			0;
		} else {
			// Bootstrap is ongoing, calculate remaining time
			bootstrapStartTime + BOOTSTRAP_PERIOD_IN_NANOS - currentTime;
		};

		{
			isBootstrapPhase = isBootstrapPhase;
			timeRemaining = timeRemaining;
		};
	};

	//////////////////////////////////////////////////////////////////////////////////////////////
	///////////////////////////////  reward  /////////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////////////////////////////

	// Lockup period constants in nanoseconds
	let _LOCKUP_90_DAYS_IN_NANOS : Nat = 7_776_000_000_000_000; // 90 days
	let LOCKUP_180_DAYS_IN_NANOS : Nat = 15_552_000_000_000_000; // 180 days
	let LOCKUP_270_DAYS_IN_NANOS : Nat = 23_328_000_000_000_000; // 270 days
	let LOCKUP_360_DAYS_IN_NANOS : Nat = 31_104_000_000_000_000; // 360 days

	// Get bootstrap multiplier based on staker position
	public shared ({ caller }) func getBootstrapMultiplier() : async Result.Result<Nat, Text> {
		// Check if caller exists in earlyStakers map
		switch (Map.get(earlyStakers, phash, caller)) {
			case (?multiplier) { return #ok(multiplier) };
			case (null) { return #ok(1_000_000) }; // Default multiplier if not an early staker
		};
	};

	/*
    The calculateUserWeeklyStakeWeight function is responsible for:
    1. Calculating user's stake weight based on:
        - Ratio of user's stake amount vs total staked amount
        - Lock duration weight multiplier (1x to 4x)
        - Early staker bonus multiplier (1x to 1.5x)
    2. Printing debug info about the calculation
    3. Returning the final weighted stake value
    */
	public shared func calculateUserStakeMatric(stakeId : Types.StakeId, caller : Principal) : async Result.Result<Types.StakeMatric, Text> {
		// Verify stake belongs to caller
		let userStakeIds = switch (Map.get(userStakes, phash, caller)) {
			case (null) return #err("No stakes found for user");
			case (?ids) ids;
		};

		Debug.print("userStakeIds: " # debug_show (userStakeIds));

		// Check if stakeId exists in user's stakes
		let validStakeId = Array.find<Types.StakeId>(userStakeIds, func(id) { id == stakeId });
		Debug.print("validStakeId: " # debug_show (validStakeId));

		if (validStakeId == null) {
			return #err("This stake ID does not belong to caller");
		};

		// Get stake details from stakes map
		let stake = switch (Map.get(stakes, nhash, stakeId)) {
			case (null) return #err("Stake not found");
			case (?s) {
				if (s.staker != caller) return #err("Not authorized to access this stake");
				s;
			};
		};

		Debug.print("stake: " # debug_show (stake));

		if (pool.totalStaked == 0) {
			return #err("Total staked amount zero nahi ho sakta");
		};

		let lockDuration = stake.lockEndTime - stake.stakeTime;
		Debug.print("lockDuration: " # debug_show (lockDuration));

		let lockupWeight = calculateDynamicWeight(Int.abs(lockDuration));

		Debug.print("lockupWeight: " # debug_show (lockupWeight));

		let bootstrapMultiplier = switch (Map.get(earlyStakers, phash, caller)) {
			case (?multiplier) {
				if (Time.now() <= bootstrapStartTime + BOOTSTRAP_MULTIPLIER_DURATION_IN_NANOS) {
					multiplier;
				} else {
					1_000_000;
				};
			};
			case (null) { 1_000_000 };
		};

		Debug.print("bootstrapMultiplier: " # debug_show (bootstrapMultiplier));

		let totalStake = if (pool.totalStaked < MIN_TOTAL_STAKE) {
			MIN_TOTAL_STAKE;
		} else {
			pool.totalStaked;
		};

		Debug.print("totalStake: " # debug_show (totalStake));

		// 100_000000
		// let proportion = (stake.amount / totalStake) * 1_000_000; // 1,000
		let proportion = (stake.amount * 1_000_000) / totalStake;
		Debug.print("proportion: " # debug_show (proportion));

		let userWeight = (proportion * lockupWeight * bootstrapMultiplier) / (1_000_000 * 1_000_000); //6,000
		Debug.print("userWeight: " # debug_show (userWeight));

		// Calculate total lockupWeight by iterating over all stakes
		let totalWeight = await getTotalWeight(); //20,000
		Debug.print("totalWeight: " # debug_show (totalWeight));

		// Get total fee collected and calculate 70% as total rewards
		// total reward 1_400,000 for total fee is  2_000_000
		Debug.print("totalFeeCollectedFromLastRewardDistribution: " # debug_show (totalFeeCollectedFromLastRewardDistribution));
		let totalRewards : Nat = (totalFeeCollectedFromLastRewardDistribution * 7) / 10; // Fixed 70% calculation
		Debug.print("totalRewards: " # debug_show (totalRewards));

		var rewardShare = (totalRewards * userWeight) / totalWeight;
		Debug.print("rewardShare: " # debug_show (rewardShare));

		// Calculate weekly return rate by dividing reward share by staked amount
		// let weeklyReturnRate = (rewardShare / stake.amount) * 100 * 1_000_000; // weeklyReturnRate 4,20,000 % = 0.42 %
		let weeklyReturnRate = (rewardShare * 100 * 1_000_000) / stake.amount;
		Debug.print("weeklyReturnRate: " # debug_show (weeklyReturnRate));

		let finalReward = rewardShare;
		Debug.print("finalReward: " # debug_show (finalReward));

		if (finalReward == 0) {
			return #err("Reward amount is zero. Please increase your stake amount or lockup duration");
		};

		// Calculate APY using weekly return rate
		// Formula: APY = ((1 + weekly_return_rate)^52 - 1) * 100%
		// This compounds the weekly returns over 52 weeks to get annual percentage yield
		let apy = weeklyReturnRate * 52; // 2,18,40,000
		Debug.print("apy: " # debug_show (apy));

		let stakeMetric = {
			stakeId;
			lockDuration;
			lockupWeight;
			bootstrapMultiplier;
			proportion;
			userWeight;
			totalWeight;
			totalFeeCollected = totalFeeCollectedFromLastRewardDistribution;
			finalReward;
			apy;
		};

		// Create composite key using principal and stakeId
		let compositeKey = Principal.toText(caller) # "_" # Nat.toText(stakeId);

		return #ok(stakeMetric);
	};

	// Helper function to calculate precise dynamic weight
	private func calculateDynamicWeight(lockDuration : Int) : Nat {
		let durationInDays = Int.abs(lockDuration) / (24 * 60 * 60 * 1_000_000_000); // Convert nanos to days

		// Constants
		let MIN_DAYS : Nat = 30; // Minimum lock duration (30 days)
		let MAX_DAYS : Nat = 360; // Maximum lock duration (360 days)
		let BASE_WEIGHT : Nat = 1_000_000; // Base multiplier (1x)
		let MAX_WEIGHT : Nat = 4_000_000; // Maximum multiplier (4x)

		if (durationInDays < MIN_DAYS) {
			return BASE_WEIGHT; // Minimum weight for less than 30 days
		};

		if (durationInDays >= MAX_DAYS) {
			return MAX_WEIGHT; // Maximum weight for 360+ days
		};

		// Calculate weight linearly for each day between min and max
		// Formula: BASE_WEIGHT + (days - MIN_DAYS) * (MAX_WEIGHT - BASE_WEIGHT) / (MAX_DAYS - MIN_DAYS)
		let additionalDays = Int.abs(durationInDays - MIN_DAYS);
		let weightRange = Int.abs(MAX_WEIGHT - BASE_WEIGHT);
		let daysRange = Int.abs(MAX_DAYS - MIN_DAYS);

		let additionalWeight = (additionalDays * weightRange) / daysRange;
		BASE_WEIGHT + additionalWeight;
	};

	// Query function to preview weights for different durations
	public query func previewWeightForDuration(durationInDays : Nat) : async Nat {
		let durationInNanos = durationInDays * 24 * 60 * 60 * 1_000_000_000;
		calculateDynamicWeight(durationInNanos);
	};

	// Query function to get weight table (useful for UI)
	public query func getWeightTable() : async [(Nat, Nat)] {
		let days = [30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330, 360];
		Array.map<Nat, (Nat, Nat)>(
			days,
			func(day : Nat) : (Nat, Nat) {
				let durationInNanos = day * 24 * 60 * 60 * 1_000_000_000;
				(day, calculateDynamicWeight(durationInNanos));
			}
		);
	};

	// public query func usersStake() : async [(Principal, [Types.StakeId])] {
	//     Map.toArray(userStakes);
	// };

	// public query func stakes121() : async [(Types.StakeId, Types.Stake)] {
	//     Map.toArray(stakes);
	// };

	public func getTotalWeight() : async Nat {
		var totalWeight : Nat = 0;

		// Iterate through all users and their stakes
		for ((user, stakeIds) in Map.entries(userStakes)) {
			for (stakeId in stakeIds.vals()) {
				Debug.print(debug_show ("############# for stakeId ############", stakeId));

				switch (Map.get(stakes, nhash, stakeId)) {
					case (?stake) {
						let lockDuration = (stake.lockEndTime - stake.stakeTime);
						let weight = if (Int.abs(lockDuration) >= LOCKUP_360_DAYS_IN_NANOS) {
							4_000_000;
						} else if (Int.abs(lockDuration) >= LOCKUP_270_DAYS_IN_NANOS) {
							3_000_000;
						} else if (Int.abs(lockDuration) >= LOCKUP_180_DAYS_IN_NANOS) {
							2_000_000;
						} else {
							1_000_000;
						};

						let totalStake = if (pool.totalStaked < MIN_TOTAL_STAKE) {
							MIN_TOTAL_STAKE;
						} else {
							pool.totalStaked;
						};

						Debug.print(debug_show ("stake.amount", stake.amount));

						Debug.print(debug_show ("totalStake", totalStake));

						let proportion = (stake.amount * 1_000_000) / totalStake; // 1,000
						let bootstrapMultiplier = switch (Map.get(earlyStakers, phash, user)) {
							case (?multiplier) {
								if (Time.now() <= bootstrapStartTime + BOOTSTRAP_MULTIPLIER_DURATION_IN_NANOS) {
									multiplier;
								} else {
									1_000_000;
								};
							};
							case (null) { 1_000_000 };
						};

						Debug.print(debug_show ("proportion", proportion));
						Debug.print(debug_show ("weight", weight));
						Debug.print(debug_show ("bootstrapMultiplier", bootstrapMultiplier));

						Debug.print(debug_show ((proportion * weight * bootstrapMultiplier) / (1_000_000 * 1_000_000), "$$$$$ calculating propotion #### for stakeId ", stakeId));

						totalWeight += (proportion * weight * bootstrapMultiplier) / (1_000_000 * 1_000_000); //6,000
					};
					case (null) {};
				};
			};
		};
		return totalWeight;
	};
	//////////////////////////////////////////////////////////////////////////////////////////////
	////////////////////////////////////// api  //////////////////////////////////////////////////
	//////////////////////////////////////////////////////////////////////////////////////////////

	/*
    The notifyStake function is responsible for:
    1. Processing new stakes:
        - Validating lock duration
        - Verifying transactions
        - Creating new stake records
        - Updating pool metrics
    2. Handling duplicate transactions
    3. Updating user's stake list
    4. also handle early 20 sataker
    5. During bootstrap, user only stake once

    */
	public shared ({ caller }) func notifyStake(blockIndex : Nat, lockDuration : Nat) : async Result.Result<(), Text> {
		// Update bootstrap phase status first
		updateBootstrapPhase();
		// Validate lock duration
		if (lockDuration < MIN_LOCK_DURATION_IN_NANOS) {
			return #err("Lock duration must be at least 30 days");
		};
		if (lockDuration > MAX_LOCK_DURATION_IN_NANOS) {
			return #err("Lock duration cannot exceed 365 days");
		};

		// Check if transaction already processed
		switch (Map.get(processedStakeTransactions, nhash, blockIndex)) {
			case (?existingCaller) {
				return #err("Transaction already processed for caller: " # Principal.toText(existingCaller));
			};
			case (null) {};
		};

		// Validate staking block
		let validationResult = await validateStakingBlock(blockIndex, caller);
		let transfer = switch (validationResult) {
			case (#err(error)) { return #err(error) };
			case (#ok(transfer)) { transfer };
		};

		// Check if bootstrap period is active
		let currentTime = Time.now();
		if (isBootstrapPhase) {
			// Check if max stakers limit reached
			if (Map.size(userStakes) >= MIN_STAKERS) {
				return #err("Bootstrap period max stakers limit reached");
			};

			// During bootstrap, strictly check if user has already staked
			switch (Map.get(userStakes, phash, caller)) {
				case (?existingStakes) {
					return #err("During bootstrap period you can only have 1 active stake. Please wait for bootstrap period to end for additional stakes");
				};
				case (null) {};
			};

			// Check max stake per address during bootstrap
			if (transfer.amount > MAX_STAKE_PER_ADDRESS) {
				return #err("Exceeds maximum stake allowed per address during bootstrap period");
			};
		};

		// Create new stake with unique ID
		let stakeId = nextStakeId;
		nextStakeId += 1;

		// Create initial stake record
		let stake : Types.Stake = {
			id = stakeId;
			staker = transfer.from.owner;
			amount = transfer.amount;
			stakeTime = Time.now();
			lockEndTime = Time.now() + lockDuration;
			lastHarvestTime = 0;
		};

		Map.set(stakes, nhash, stakeId, stake);
		// Update user's stake list
		switch (Map.get(userStakes, phash, caller)) {
			case (?existingStakes) {
				Map.set(userStakes, phash, caller, Array.append(existingStakes, [stakeId]));
			};
			case (null) {
				Map.set(userStakes, phash, caller, [stakeId]);
			};
		};

		// Update pool totalStaked
		let newTotalStaked = pool.totalStaked + transfer.amount;

		pool := { pool with totalStaked = newTotalStaked };

		// Store transaction block index for later query
		switch (Map.get(stakeBlockIndices, phash, transfer.from.owner)) {
			case (?existingIndices) {
				Map.set(stakeBlockIndices, phash, transfer.from.owner, Array.append(existingIndices, [blockIndex]));
			};
			case (null) {
				Map.set(stakeBlockIndices, phash, transfer.from.owner, [blockIndex]);
			};
		};

		Map.set(processedStakeTransactions, nhash, blockIndex, transfer.from.owner);

		// Add early staker multiplier if less than 20 stakers
		let earlyStakerCount = Map.size(earlyStakers);
		if (earlyStakerCount < 20) {
			let multiplier = if (earlyStakerCount < 5) {
				1_500_000;
			} else if (earlyStakerCount < 10) {
				1_300_000;
			} else {
				1_100_000;
			};
			Map.set(earlyStakers, phash, caller, multiplier);
		};

		#ok();
	};

	/*
    The unstake function is responsible for:
    1. Processing all eligible stakes for a user:
        - Checking lock period
        - Calculating final rewards
        - Transferring tokens + rewards
    2. Updating pool metrics:
        - Adjusting total staked amount
        - Removing stakes
    3. Updating user's stake list
    4. stroing transaction in unstake
    */
	public shared ({ caller }) func unstake(stakeId : Types.StakeId) : async Result.Result<(), Text> {
		// Get user's stake IDs
		let userStakeIds = switch (Map.get(userStakes, phash, caller)) {
			case (null) return #err("No stakes found for user");
			case (?ids) ids;
		};

		// Check if stakeId exists in user's stakes
		let validStakeId = Array.find<Types.StakeId>(userStakeIds, func(id) { id == stakeId });
		if (validStakeId == null) {
			return #err("This stake ID does not belong to caller");
		};

		// Get stake details
		let stake = switch (Map.get(stakes, nhash, stakeId)) {
			case (null) return #err("Stake not found");
			case (?s) {
				if (s.staker != caller) return #err("Not authorized to access this stake");
				s;
			};
		};

		// Check lock period
		if (Time.now() < stake.lockEndTime) {
			return #err("Stake is still locked");
		};

		// Calculate final rewards before unstaking
		let stakeMetricsResult = await calculateUserStakeMatric(stakeId, caller);
		switch (stakeMetricsResult) {
			case (#err(e)) return #err(e);
			case (#ok(metrics)) {
				let finalRewards = metrics.finalReward;
				let rewardsFloat = Float.fromInt(finalRewards);
				let rewardsInt64 = Float.toInt64(rewardsFloat);
				let rewardsNat64 = Int64.toNat64(rewardsInt64);

				// Record transaction first
				let unstakeTx : Types.Transaction = {
					from = Principal.fromActor(this);
					to = caller;
					amount = stake.amount + Nat64.toNat(rewardsNat64);
					method = "Unstake";
					time = Time.now();
				};

				// Transfer staked tokens + rewards back using unstakeTx details
				let transferResult = await USDx.icrc1_transfer({
					to = { owner = unstakeTx.to; subaccount = null };
					amount = unstakeTx.amount;
					fee = null;
					memo = null;
					from_subaccount = null;
					created_at_time = ?Nat64.fromNat(Int.abs(unstakeTx.time));
				});

				switch (transferResult) {
					case (#Err(_e)) return #err("Transfer failed");
					case (#Ok(_)) {
						// Update pool total staked
						pool := {
							pool with totalStaked = pool.totalStaked - stake.amount
						};

						// Remove stake
						Map.delete(stakes, nhash, stakeId);

						_tranIdx += 1;

						// Store block index for unstake transaction
						let currentBlockIndices = switch (Map.get(unStakeBlockIndices, phash, caller)) {
							case (?indices) indices;
							case (null) [];
						};
						Map.set(unStakeBlockIndices, phash, caller, Array.append(currentBlockIndices, [_tranIdx]));

						// Update user stakes array to remove unstaked position
						let remainingStakes = Array.filter(
							userStakeIds,
							func(id : Types.StakeId) : Bool { id != stakeId }
						);
						Map.set(userStakes, phash, caller, remainingStakes);

						#ok();
					};
				};
			};
		};
	};

	///////////////////////////////////////////////////////////////////////////////////////////////////////
	/////////////////////////////////////  getter Functions ////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////////////////////////////

	// Public getter function for all pool data
	public func getPoolData() : async Types.StakingPool {
		{
			pool with
			rewardTokenFee = totalFeeCollectedFromLastRewardDistribution
		};
	};

	// Get user stake details
	public shared query ({ caller }) func getUserStakeDetails() : async [Types.Stake] {
		// Fetch all stakes for the caller
		let userStakeIds = switch (Map.get(userStakes, phash, caller)) {
			case (?ids) { ids };
			case (null) { [] }; // Return empty array if no stakes found
		};

		// Get stake details for each stake ID
		let buffer = Buffer.Buffer<Types.Stake>(Array.size(userStakeIds));
		for (stakeId in userStakeIds.vals()) {
			switch (Map.get(stakes, nhash, stakeId)) {
				case (?stake) {
					// Add valid stake to buffer
					buffer.add(stake);
				};
				case (null) {
					// Ignore invalid stake ID
				};
			};
		};

		// Convert buffer to array and return
		Buffer.toArray(buffer);
	};

	// Get all transactions for a user
	public shared ({ caller }) func getUserTransactions() : async [Types.Transaction] {
		let buffer = Buffer.Buffer<Types.Transaction>(0);

		// Stake transactions ko fetch karo
		for ((blockIndex, principal) in Map.entries(processedStakeTransactions)) {
			if (principal == caller) {
				try {
					switch (await getTransactionFromBlockIndex(blockIndex)) {
						case (#ok(tx)) {
							buffer.add({
								from = tx.from;
								to = tx.to;
								amount = tx.amount;
								method = "Stake";
								time = tx.time;
							});
						};
						case (#err(_)) {};
					};
				} catch (e) {
					Debug.print("Error fetching stake transaction: " # Error.message(e));
				};
			};
		};

		// Harvest transactions ko fetch karo
		for ((principal, blockIndices) in Map.entries(harvestBlockIndices)) {
			if (principal == caller) {
				for (blockIndex in blockIndices.vals()) {
					try {
						switch (await getTransactionFromBlockIndex(blockIndex)) {
							case (#ok(tx)) {
								buffer.add({
									from = tx.from;
									to = tx.to;
									amount = tx.amount;
									method = "Harvest";
									time = tx.time;
								});
							};
							case (#err(_)) {};
						};
					} catch (e) {
						Debug.print("Error fetching harvest transaction: " # Error.message(e));
					};
				};
			};
		};

		Buffer.toArray(buffer);
	};

	///////////////////////////////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////// total fee   /////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////////////////////////////

	// Fee collector balance
	public func getFeeCollectorBalance() : async Nat {
		let feeCollectorId = Principal.fromText("ieja4-4iaaa-aaaak-qddra-cai");
		let balance = await USDx.icrc1_balance_of({
			owner = feeCollectorId;
			subaccount = null;
		});
		return balance;
	};

	// Store total fee collected till now
	private stable var totalFeeCollectedSofar : Nat = 0;
	private stable var totalFeeCollectedFromLastRewardDistribution : Nat = 0;
	private stable var totalBurnAmount : Nat = 0;
	private stable var totalSendAmount : Nat = 0;
	private stable var totalReceiveAmount : Nat = 0;
	private stable var totalMintAmount : Nat = 0;

	private stable var lastProcessedTxId : Nat = 0;

	func fetchTotalFeeCollectedSofar() : async () {
		let feeCollectorAccount : Icrc.Account = {
			owner = Principal.fromText("ieja4-4iaaa-aaaak-qddra-cai");
			subaccount = null;
		};

		// var amountToAdd = 0;
		// var amountToSub = 0;

		var start : ?IcrcIndex.BlockIndex = null;

		var updateLastProcessedTxId : Nat = 0;
		var isAlreadyUpdateLastProcessedTxId = false;

		var currentBalance = 0;

		label fetchTxAgain loop {

			let args : IcrcIndex.GetAccountTransactionsArgs = {
				start;
				max_results = 100;
				account = feeCollectorAccount;
			};

			let getTransactionsResult = await USDxIndex.get_account_transactions(args);

			let { balance; oldest_tx_id; transactions } = switch (getTransactionsResult) {
				case (#Ok(value)) { value };
				case (#Err(_)) { return () };
			};

			currentBalance := balance;

			let oldTxId = switch (oldest_tx_id) {
				case (?value) { value };
				case (null) { break fetchTxAgain };
			};

			let size = transactions.size();

			if (size == 0) {
				break fetchTxAgain;
			} else {
				if (not isAlreadyUpdateLastProcessedTxId) {
					updateLastProcessedTxId := transactions[0].id;
				};
				isAlreadyUpdateLastProcessedTxId := true;
			};

			for ({ id; transaction } in transactions.vals()) {

				if (lastProcessedTxId == id) {

					break fetchTxAgain;
				};

				// Burning action is when maintaining peg (fee burned here)
				switch (transaction.burn) {
					case (?tx) {
						totalBurnAmount += tx.amount;
					};
					case (null) {};
				};

				switch (transaction.transfer) {
					case (?tx) {

						// When withdrawing Stake reward as fee
						if ((tx.from == feeCollectorAccount) and (tx.to != feeCollectorAccount) /*Makesure its not SELF transfer*/) {
							totalSendAmount += tx.amount;

						} else if ((tx.to == feeCollectorAccount) and (tx.from != feeCollectorAccount) /*Makesure its not SELF transfer*/) {
							totalReceiveAmount += tx.amount;
						};
					};
					case (null) {};
				};

				switch (transaction.mint) {
					case (?tx) {
						totalMintAmount += tx.amount;
					};
					case (null) {};
				};

			};

			let currentLastTxId = transactions[size - 1].id;

			if (currentLastTxId == oldTxId) {
				break fetchTxAgain;
			} else {
				start := ?currentLastTxId;
			}

		};

		lastProcessedTxId := updateLastProcessedTxId;

		totalFeeCollectedSofar := currentBalance + totalBurnAmount + totalSendAmount - totalReceiveAmount - totalMintAmount;
		totalFeeCollectedFromLastRewardDistribution := totalFeeCollectedSofar - totalSendAmount - totalBurnAmount;
		return ();

	};

	feeCollectedFetchTimer := do {
		let ONE_HOUR_NAN_SEC = 60_000_000_000;
		let nextFetch = ONE_HOUR_NAN_SEC - (Time.now() % ONE_HOUR_NAN_SEC);

		Timer.setTimer<system>(
			#nanoseconds(Int.abs nextFetch),
			func() : async () {
				feeCollectedFetchTimer := Timer.recurringTimer<system>(#nanoseconds ONE_HOUR_NAN_SEC, fetchTotalFeeCollectedSofar);
				await fetchTotalFeeCollectedSofar();
			}
		);
	};

	public query func getTotalFeeCollectedSofar() : async Nat {
		totalFeeCollectedSofar;
	};

	public query func getTotalFeeCollectedFromLastRewardDistribution() : async Nat {
		totalFeeCollectedFromLastRewardDistribution;
	};

	public query func getLastProcessedTxId() : async Nat {
		lastProcessedTxId;
	};

	public func initFetchTotalFeeCollected() : async () {
		await fetchTotalFeeCollectedSofar();
	};

	///////////////////////////////////////////////////////////////////////////////////////////////////////
	/////////////////////////////////////    timer   /////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////////////////////////////

	// Add timer related variables
	// private stable var lastRewardUpdateTime : Int = 0;
	// private let WEEK_IN_NANOSECONDS : Nat = 7 * 24 * 60 * 60 * 1_000_000_000;
	// private var rewardUpdateTimer : Timer.TimerId = 0;

	// // Weekly reward update function
	// private func updateWeeklyRewards() : async () {
	//     try {
	//         let currentTime = Time.now();

	//         // Check if a week has passed
	//         if (currentTime - lastRewardUpdateTime >= WEEK_IN_NANOSECONDS) {
	//             // Get total fees collected
	//             let totalFees = await getTotalFeeCollected();

	//             // Calculate weekly rewards (30% of fees)
	//             let totalWeeklyRewards = (totalFees * 30) / 100;

	//             // Update pool rewards
	//             pool := {
	//                 pool with
	//                 totalRewardPerSecond = totalWeeklyRewards / (7 * 24 * 60 * 60); // Convert to per second
	//             };

	//             // Update last reward time
	//             lastRewardUpdateTime := currentTime;

	//             Debug.print("Weekly rewards updated successfully");
	//         };
	//     } catch (e) {
	//         Debug.print("Error updating weekly rewards: " # Error.message(e));
	//     };
	// };

	// rewardUpdateTimer := Timer.recurringTimer<system>(
	//     #nanoseconds(WEEK_IN_NANOSECONDS),
	//     updateWeeklyRewards
	// );

	///////////////////////////////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////// helper for notifystaking ////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////////////////////////////

	/* This function validates a staking transaction
    * Example call: validateStakingBlock(123, "xyz-principal-id")
    *
    * It performs these checks:
    * 1. Validates block index exists
    *    Example: If blockIndex=500 but total transactions is 400, returns error
    *
    * 2. Confirms transaction is a transfer type
    *    Example: If transaction is burn/mint instead of transfer, returns error
    *
    * 3. Verifies transfer was sent to staking account
    *    Example: If transferred to any other account, returns error
    *
    * 4. Checks transfer was made by caller
    *    Example: If Alice made transfer but Bob is notifying, returns error
    *    Exception: Works if Bob is approved spender for Alice
    *
    * 5. Validates transfer amount meets minimum stake
    *    Example: If minimum stake is 100 USDx but only 50 USDx staked, returns error
    */
	func validateStakingBlock(blockIndex : Nat, caller : Principal) : async Result.Result<Icrc.Transfer, Text> {
		// Get transaction details
		let getTransactionsResponse = await USDx.get_transactions({ start = blockIndex; length = 1 });
		let { transactions; log_length } = getTransactionsResponse;

		if (blockIndex >= log_length) {
			return #err("Invalid block index (" # Nat.toText(blockIndex) # ") log_length is " # Nat.toText(log_length));
		};

		let transaction = transactions[0];

		// Check Transaction kind is transfer
		let transfer = switch (transaction.transfer) {
			case (?value) { value };
			case (null) {
				return #err("Notification transaction must be of type transfer not " # transaction.kind);
			};
		};

		// Check transfer.to is staking account
		let stakingAccount = await getStakingAccount(#USDx);

		// Compare accounts properly
		if (
			stakingAccount.owner != transfer.to.owner or
			stakingAccount.subaccount != transfer.to.subaccount
		) {
			return #err(
				"Destination account (" # Principal.toText(transfer.to.owner) #
				", subaccount: " # debug_show (transfer.to.subaccount) #
				") in the transaction is not the staking account (" #
				Principal.toText(stakingAccount.owner) #
				", subaccount: " # debug_show (stakingAccount.subaccount) # ")"
			);
		};

		// Check transfer.from.owner is caller
		// if notEqual check caller is spender
		if (caller != transfer.from.owner) {
			switch (transfer.spender) {
				case (?spender) {
					if (caller != spender.owner) {
						return #err(
							"Notifier (" # Principal.toText(caller) #
							") is neither spender (" # Principal.toText(spender.owner) #
							") nor originator(" # Principal.toText(transfer.from.owner) # ")"
						);
					};
				};
				case (null) {
					return #err(
						"Notifier principal (" # Principal.toText(caller) #
						") and transaction originator principal (" #
						Principal.toText(transfer.from.owner) # ") are not the same"
					);
				};
			};
		};

		// Check amount is above minimum stake
		if (transfer.amount < pool.minimumStake) {
			return #err("Transaction amount is less than minimum stake amount");
		};

		#ok(transfer);
	};

	public func getStakingAccount(token : Tokens) : async Icrc.Account {
		switch (token) {
			case (#USDx) {
				{
					owner = Principal.fromActor(this);
					subaccount = null;
				};
			};
		};
	};

	// Helper function to get transaction from block index
	public func getTransactionFromBlockIndex(blockIndex : Nat) : async Result.Result<Types.Transaction, Text> {
		try {
			let getTransactionsResponse = await USDx.get_transactions({
				start = blockIndex;
				length = 1;
			});
			let { transactions } = getTransactionsResponse;

			if (transactions.size() == 0) {
				return #err("Koi transaction nahi mila is block index pe");
			};

			let transaction = transactions[0];

			switch (transaction.transfer) {
				case (?transfer) {
					#ok({
						amount = transfer.amount;
						from = transfer.from.owner;
						to = transfer.to.owner;
						method = "transfer";
						time = Nat64.toNat(transaction.timestamp);
					});
				};
				case null {
					#err("Ye transfer transaction nahi hai");
				};
			};
		} catch (e) {
			#err("Transaction fetch karne me error aaya: " # Error.message(e));
		};
	};

};
