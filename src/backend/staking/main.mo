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
import Map "mo:map/Map";
actor class DoxaStaking() = this {
	// Token interfaces
	private let USDx : Icrc.Self = actor ("irorr-5aaaa-aaaak-qddsq-cai"); // USDx token canister
	private let USDxIndex : actor {
		get_account_transactions : shared query {
			max_results : Nat;
			start : ?Nat;
			account : {
				owner : Principal;
				subaccount : ?Blob;
			};
		} -> async {
			#Ok : {
				transactions : [{
					id : Nat;
					transaction : {
						burn : ?{
							amount : Nat;
						};
						transfer : ?{
							amount : Nat;
							to : {
								owner : Principal;
								subaccount : ?Blob;
							};
						};
					};
				}];
			};
			#Err : Text;
		};
	} = actor ("modmy-byaaa-aaaag-qndgq-cai");

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
	};

	let { nhash; phash } = Map;

	// Storage
	private stable let stakes = Map.new<Types.StakeId, Types.Stake>();
	private stable let userStakes = Map.new<Principal, [Types.StakeId]>();
	private stable let earlyStakers = Map.new<Principal, Float>(); // Maps early stakers to their multiplier
	// private let stakeMetrics = Map.new<Principal, StakeMatric>();
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
		let timeRemaining = if (bootstrapStartTime == 0 or not isBootstrapPhase) {
			0;
		} else {
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
	public shared ({ caller }) func getBootstrapMultiplier() : async Result.Result<Float, Text> {
		// Check if caller exists in earlyStakers map
		switch (Map.get(earlyStakers, phash, caller)) {
			case (?multiplier) { return #ok(multiplier) };
			case (null) { return #ok(1.0) }; // Default multiplier if not an early staker
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
	public shared ({ caller }) func calculateUserWeeklyStakeWeight(stakeId : Types.StakeId) : async Result.Result<Float, Text> {
		// Verify stake belongs to caller
		switch (Map.get(userStakes, phash, caller)) {
			case (null) return #err("Aapka koi stake nahi hai");
			case (?userStakeIds) {
				let userStakeIdsBuffer = Buffer.fromArray<Nat>(userStakeIds);
				if (not Buffer.contains<Nat>(userStakeIdsBuffer, stakeId, Nat.equal)) {
					return #err("Ye stake ID aapka nahi hai");
				};
			};
		};

		// Get stake details from stakes map
		let stake = switch (Map.get(stakes, nhash, stakeId)) {
			case (null) return #err("Stake ID galat hai");
			case (?s) {
				if (s.staker != caller) return #err("Ye stake access karne ka adhikar nahi hai");
				s;
			};
		};

		if (pool.totalStaked == 0) {
			return #err("Total staked amount zero nahi ho sakta");
		};

		let proportion : Float = Float.fromInt(stake.amount) / Float.fromInt(pool.totalStaked);
		let lockDuration = (stake.lockEndTime - stake.stakeTime) / 1_000_000_000; // Convert nanoseconds to seconds
		let userLockupWeight = if (Int.abs(lockDuration) >= LOCKUP_360_DAYS_IN_NANOS) {
			#ok(4);
		} else if (Int.abs(lockDuration) >= LOCKUP_270_DAYS_IN_NANOS) {
			#ok(3);
		} else if (Int.abs(lockDuration) >= LOCKUP_180_DAYS_IN_NANOS) {
			#ok(2);
		} else {
			#ok(1) // Default for 90 days
		};

		switch (userLockupWeight) {
			case (#err(e)) return #err(e);
			case (#ok(weight)) {
				let bootstrapMultiplier = switch (Map.get(earlyStakers, phash, caller)) {
					case (?multiplier) {
						if (Time.now() <= bootstrapStartTime + BOOTSTRAP_MULTIPLIER_DURATION_IN_NANOS) {
							multiplier;
						} else {
							1.0;
						};
					};
					case (null) { 1.0 };
				};

				return #ok(proportion * Float.fromInt(weight) * bootstrapMultiplier);
			};
		};
	};

	/*
    The calculateUserWeeklyReward function is responsible for:
    1. Calculating user's weekly reward based on:
        - Total available rewards
        - User's weighted stake vs total weighted stakes
    3. Printing debug info about calculations
    4. Returning final reward amount
    */
	public type StakeMatric = {
		stakeId : Types.StakeId;
		lockDuration : Int;
		lockupWeight : Int;
		bootstrapMultiplier : Float;
		proportion : Float;
		userWeight : Float;
		totalWeight : Float;
		totalFeeCollected : Nat;
		finalReward : Float;
		apy : Float;
	};

	private stable var stakeMetrics : [(Text, StakeMatric)] = [];
	// Using composite key of Principal and StakeId to uniquely identify metrics
	public query ({ caller }) func getStakeMetrics(stakeId : Types.StakeId) : async [(Text, StakeMatric)] {
		return Array.filter<(Text, StakeMatric)>(stakeMetrics, func(metric) { metric.1.stakeId == stakeId and metric.0 == Principal.toText(caller) });
	};
	public query ({ caller }) func iterateAllStakes() : async [(Text, StakeMatric)] {
		return Array.filter<(Text, StakeMatric)>(stakeMetrics, func(metric) { metric.0 == Principal.toText(caller) });
	};

	public shared func calculateUserStakeMatric(stakeId : Types.StakeId, caller : Principal) : async Result.Result<StakeMatric, Text> {
		// Pehle check karo ki user ke paas ye stake ID hai ya nahi
		let userStakeIds = switch (Map.get(userStakes, phash, caller)) {
			case (null) return #err("No stakes found for user");
			case (?ids) ids;
		};

		// Check if stakeId exists in user's stakes
		let validStakeId = Array.find<Types.StakeId>(userStakeIds, func(id) { id == stakeId });
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

		if (pool.totalStaked == 0) {
			return #err("Total staked amount zero nahi ho sakta");
		};

		let lockDuration = stake.lockEndTime - stake.stakeTime;

		let lockupWeight = if (Int.abs(lockDuration) >= LOCKUP_360_DAYS_IN_NANOS) {
			4;
		} else if (Int.abs(lockDuration) >= LOCKUP_270_DAYS_IN_NANOS) {
			3;
		} else if (Int.abs(lockDuration) >= LOCKUP_180_DAYS_IN_NANOS) {
			2;
		} else {
			1; // Default for 90 days
		};

		let bootstrapMultiplier = switch (Map.get(earlyStakers, phash, caller)) {
			case (?multiplier) {
				if (Time.now() <= bootstrapStartTime + BOOTSTRAP_MULTIPLIER_DURATION_IN_NANOS) {
					multiplier;
				} else {
					1.0;
				};
			};
			case (null) { 1.0 };
		};
		let proportion : Float = Float.fromInt(stake.amount) / Float.fromInt(if (pool.totalStaked < MIN_TOTAL_STAKE) { MIN_TOTAL_STAKE } else { pool.totalStaked });

		let userWeight = proportion * Float.fromInt(lockupWeight) * bootstrapMultiplier;

		// Calculate total lockupWeight by iterating over all stakes
		let totalWeight = await getTotalWeight();

		// Get total fee collected and calculate 30% as total rewards
		let totalFeeCollected = await getTotalFeeCollected();
		let totalRewards = (Float.fromInt(totalFeeCollected) / 1_000_000.0) * (30.0 / 100.0); // Pehle decimal adjustment, phir 30% calculation

		var rewardShare = totalRewards * (userWeight / totalWeight);

		let finalReward = rewardShare;
		if (finalReward == 0) {
			return #err("Reward amount zero hai. Kripya apna stake amount badhaye ya lockup duration badhaye");
		};

		// Calculate APY
		// APY = ((1 + Weekly Reward)^52 - 1) × 100%
		let apy = (Float.pow(1.0 + finalReward, 52.0) - 1.0) * 100.0;

		let stakeMetric = {
			stakeId;
			lockDuration;
			lockupWeight;
			bootstrapMultiplier;
			proportion;
			userWeight;
			totalWeight;
			totalFeeCollected;
			finalReward;
			apy;
		};

		// Create composite key using principal and stakeId
		let compositeKey = Principal.toText(caller) # "_" # Nat.toText(stakeId);

		// Store stake metric in array
		stakeMetrics := Array.append(stakeMetrics, [(compositeKey, stakeMetric)]);

		return #ok(stakeMetric);
	};

	private func getTotalWeight() : async Float {
		var totalWeight : Float = 0.0;

		// Iterate through all users and their stakes
		for ((user, stakeIds) in Map.entries(userStakes)) {
			for (stakeId in stakeIds.vals()) {
				switch (Map.get(stakes, nhash, stakeId)) {
					case (?stake) {
						let lockDuration = (stake.lockEndTime - stake.stakeTime) / 1_000_000_000;
						let weight = if (Int.abs(lockDuration) >= LOCKUP_360_DAYS_IN_NANOS) {
							4;
						} else if (Int.abs(lockDuration) >= LOCKUP_270_DAYS_IN_NANOS) {
							3;
						} else if (Int.abs(lockDuration) >= LOCKUP_180_DAYS_IN_NANOS) {
							2;
						} else {
							1;
						};

						let proportion = Float.fromInt(stake.amount) / Float.fromInt(pool.totalStaked);
						let bootstrapMultiplier = switch (Map.get(earlyStakers, phash, user)) {
							case (?multiplier) {
								if (Time.now() <= bootstrapStartTime + BOOTSTRAP_MULTIPLIER_DURATION_IN_NANOS) {
									multiplier;
								} else {
									1.0;
								};
							};
							case (null) { 1.0 };
						};

						totalWeight += proportion * Float.fromInt(weight) * bootstrapMultiplier;
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
		switch (validationResult) {
			case (#err(error)) { return #err(error) };
			case (#ok()) {};
		};

		// Get transaction details
		let getTransactionsResponse = await USDx.get_transactions({ start = blockIndex; length = 1 });
		let { transactions } = getTransactionsResponse;
		let transaction = transactions[0];

		let transfer = switch (transaction.transfer) {
			case (?value) { value };
			case (null) {
				return #err("Transaction must be a transfer");
			};
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
				1.5;
			} else if (earlyStakerCount < 10) {
				1.3;
			} else {
				1.1;
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
				let rewardsInt64 = Float.toInt64(finalRewards);
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
		let totalFee = await getTotalFeeCollectedAmount();
		{
			pool with
			rewardTokenFee = Float.fromInt(totalFee) / 1_000_000
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
	private stable var totalFeeCollected : Nat = 0;
	private stable var lastProcessedTxId : Nat = 0;

	public query func getTotalFeeCollectedAmount() : async Nat {
		totalFeeCollected;
	};

	public query func getLastProcessedTxId() : async Nat {
		lastProcessedTxId;
	};

	// Get total fee collected from fee collector transactions
	public func getTotalFeeCollected() : async Nat {
		let feeCollectorId = Principal.fromText("ieja4-4iaaa-aaaak-qddra-cai");
		let currentBalance = await getFeeCollectorBalance();

		// Get transactions from USDx index
		let result = await USDxIndex.get_account_transactions({
			max_results = 100;
			start = ?lastProcessedTxId;
			account = {
				owner = feeCollectorId;
				subaccount = null;
			};
		});

		var totalAmount : Nat = 0;
		switch (result) {
			case (#Ok(data)) {
				// Process new transactions
				for (tx in data.transactions.vals()) {
					switch (tx.transaction.burn) {
						case (?burn) {
							// Add burn amount to total
							totalAmount += burn.amount;
						};
						case (null) {};
					};
					switch (tx.transaction.transfer) {
						case (?transfer) {
							// Add transfer amount to total if fee collector is recipient
							if (transfer.to.owner == feeCollectorId) {
								totalAmount += transfer.amount;
							};
						};
						case (null) {};
					};
					lastProcessedTxId := tx.id;
				};

				// Total fee collected should be current balance plus total amount
				totalFeeCollected := currentBalance + totalAmount;
				return totalFeeCollected;
			};
			case (#Err(_)) {
				// On error, at least return current balance
				totalFeeCollected := currentBalance;
				return totalFeeCollected;
			};
		};
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
	func validateStakingBlock(blockIndex : Nat, caller : Principal) : async Result.Result<(), Text> {
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

		#ok();
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
