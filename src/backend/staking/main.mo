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
import Blob "mo:base/Blob";
import Types "types";
import Icrc "../service/icrc-interface"; // ICRC token interface
import IcrcIndex "../service/icrc-index-interface";
import Map "mo:map/Map";
import Hash "mo:base/Hash";
import Set "mo:map/Set";
import Env "../service/env";
import Vector "mo:vector";

actor class DoxaStaking() = this {
	// Token interfaces
	private let DUSD : Icrc.Self = actor (Env.dusd_ledger); // DUSD token canister
	private let DUSDIndex : IcrcIndex.Self = actor (Env.dusd_index);

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
	private stable var pool = {
		poolName = "Doxa Dynamic Staking";
		poolStartTime = Time.now();
		poolEndTime = Time.now() + ONE_YEAR_IN_NANOS;
		totalTokensStaked = 0;
		totalFeeCollected = 0; //  tokens with 6 decimals
		minimumTotalStake = MIN_TOTAL_STAKE; // 100,000 tokens with 6 decimals
		stakingTokenSymbol : Text = "DUSD";
		stakingTokenName : Text = "Doxa USD";
		rewardTokenSymbol = "DUSD";
		rewardTokenCanisterId = "irorr-5aaaa-aaaak-qddsq-cai";
		minimumStakeAmount = 10_000_000; // 10 tokens with 6 decimals
		stakeLockDuration = MIN_LOCK_DURATION_IN_NANOS;
	};

	system func postupgrade() {
		pool := {
			pool with
			stakingTokenSymbol = "DUSD";
			stakingTokenName = "Doxa USD";
			rewardTokenSymbol = "DUSD";
			rewardTokenCanisterId = "irorr-5aaaa-aaaak-qddsq-cai";
		};
	};

	let { nhash; phash } = Map;

	// Storage
	private stable let stakes = Map.new<Types.StakeId, Types.Stake>();
	private stable let userStakes = Map.new<Principal, [Types.StakeId]>();
	private stable let earlyStakers = Map.new<Principal, Nat>(); // Maps early stakers to their multiplier (multiplier * 1_000_000)
	private stable let dusdForPegBlockIndices = Vector.new<Nat>(); // this is used to track the block indices of the dusd for peg transactions

	private stable var bootstrapStartTime : Time.Time = 0;
	private stable var isBootstrapPhase : Bool = true;

	// Type aliases
	private type BlockIndex = Nat;

	// Transaction tracking
	private stable let stakeBlockIndices = Map.new<Principal, [BlockIndex]>();
	private stable let unStakeBlockIndices = Map.new<Principal, [BlockIndex]>();
	private stable let processedStakeTransactions = Map.new<Nat, Principal>();

	// Counters and timers
	private stable var nextStakeId : Nat = 0;
	private stable var _tranIdx : Nat = 0;
	private stable var _harvestIdx : Nat = 0;
	private stable var periodicFeeUpdater = 0;
	private var rewardUpdateTimer : Timer.TimerId = 0; // Timer to trigger weekly reward updates

	type Tokens = {
		#DUSD;
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
	// public shared ({ caller }) func getBootstrapMultiplier() : async Result.Result<Nat, Text> {
	//     // Check if caller exists in earlyStakers map
	//     switch (Map.get(earlyStakers, phash, caller)) {
	//         case (?multiplier) { return #ok(multiplier) };
	//         case (null) { return #ok(1_000_000) }; // Default multiplier if not an early staker
	//     };
	// };

	/*
    The calculateUserWeeklyStakeWeight function is responsible for:
    1. Calculating user's stake weight based on:
        - Ratio of user's stake amount vs total staked amount
        - Lock duration weight multiplier (1x to 4x)
        - Early staker bonus multiplier (1x to 1.5x)
    2. Printing debug info about the calculation
    3. Returning the final weighted stake value
    */
	public shared query func calculateUserStakeMatric(stakeId : Types.StakeId, caller : Principal) : async Result.Result<Types.StakeMetrics, Text> {
		// Verify stake belongs to caller
		let userStakeIds = switch (Map.get(userStakes, phash, caller)) {
			case (null) return #err("[method: calculateUserStakeMatric] [args: " #debug_show (caller) # "] No stakes found for user");
			case (?ids) ids;
		};

		// Check if stakeId exists in user's stakes
		let validStakeId = Array.find<Types.StakeId>(userStakeIds, func(id) { id == stakeId });

		if (validStakeId == null) {
			return #err("[method: calculateUserStakeMatric] [args: " #debug_show (validStakeId) # "] This stake ID does not belong to caller");
		};

		// Get stake details from stakes map
		let stake = switch (Map.get(stakes, nhash, stakeId)) {
			case (null) return #err("[method: calculateUserStakeMatric] [args: " #debug_show (stakeId) # "] Stake not found");
			case (?s) {
				if (s.staker != caller) return #err("[method: calculateUserStakeMatric] Not authorized to access this stake");
				s;
			};
		};

		if (pool.totalTokensStaked == 0) {
			return #err("[method: calculateUserStakeMatric] [args: " #debug_show (pool.totalTokensStaked) # "] Total staked amount zero nahi ho sakta");
		};

		let stakeLockPeriod = stake.lockEndTime - stake.stakeTime;

		let lockPeriodWeight = calculateDynamicWeight(Int.abs(stakeLockPeriod));

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

		let totalStake = if (pool.totalTokensStaked < MIN_TOTAL_STAKE) {
			MIN_TOTAL_STAKE;
		} else {
			pool.totalTokensStaked;
		};

		// let proportion = (stake.amount / totalStake) * 1_000_000;
		let totalAmount = stake.amount + stake.stakedReward;
		let stakeContributionRatio = (totalAmount * 1_000_000) / totalStake;

		let userStakeWeight = (stakeContributionRatio * lockPeriodWeight * bootstrapMultiplier) / (1_000_000 * 1_000_000);

		// Calculate total lockupWeight by iterating over all stakes
		let totalStakeWeight = getTotalWeight();

		// Get total fee collected and calculate 70% as total rewards

		let totalRewards : Nat = (totalFeeCollectedFromLastRewardDistribution * 7) / 10; // Fixed 70% calculation

		var rewardShare = (totalRewards * userStakeWeight) / totalStakeWeight;

		// Calculate weekly return rate by dividing reward share by staked amount
		// let weeklyReturnRate = (rewardShare / stake.amount) * 100 * 1_000_000; // weeklyReturnRate 4,20,000 % = 0.42 %
		let weeklyReturnRate = (rewardShare * 100 * 1_000_000) / stake.amount;

		let userFinalReward = rewardShare;

		if (userFinalReward == 0) {
			return #err("[method: calculateUserStakeMatric] [args: " #debug_show (userFinalReward) # "] Reward amount is zero. Please increase your stake amount or lockup duration");
		};

		// Calculate APY using weekly return rate
		// Formula: APY = ((1 + weekly_return_rate)^52 - 1) * 100%
		// This compounds the weekly returns over 52 weeks to get annual percentage yield
		let apy = weeklyReturnRate * 52; // 2,18,40,000

		let stakeMetric = {
			stakeId;
			stakeLockPeriod;
			lockPeriodWeight;
			bootstrapMultiplier;
			stakeContributionRatio;
			userStakeWeight;
			totalStakeWeight;
			totalFeeCollected = totalFeeCollectedFromLastRewardDistribution;
			userFinalReward;
			apy;
		};

		// Create composite key using principal and stakeId
		let compositeKey = Principal.toText(caller) # "_" # Nat.toText(stakeId);

		return #ok(stakeMetric);
	};

	public func getTotalStakersWeight() : async Nat {
		getTotalWeight();
	};

	func getTotalWeight() : Nat {
		var totalWeight : Nat = 0;

		// Iterate through all users and their stakes
		for ((user, stakeIds) in Map.entries(userStakes)) {
			for (stakeId in stakeIds.vals()) {

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

						let totalStake = if (pool.totalTokensStaked < MIN_TOTAL_STAKE) {
							MIN_TOTAL_STAKE;
						} else {
							pool.totalTokensStaked;
						};

						// Add stakedReward to amount before calculating proportion
						let totalAmount = stake.amount + stake.stakedReward;
						let proportion = (totalAmount * 1_000_000) / totalStake; // 1,000
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

						totalWeight += (proportion * weight * bootstrapMultiplier) / (1_000_000 * 1_000_000); //6,000
					};
					case (null) {};
				};
			};
		};
		return totalWeight;
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

	//////////////////////////////////////////////////////////////////////////////////////////////
	///////////////////////// reward storage and distribution system /////////////////////////////
	//////////////////////////////////////////////////////////////////////////////////////////////

	// Add type for reward approval
	public type RewardApprovalArg = {
		memo : ?Blob;
		created_at_time : ?Nat64;
		amount : Nat;
		expires_at : ?Nat64;
	};

	public type RewardApprovalErr = {
		#NotAuthorised;
		#LedgerApprovalError : Icrc.ApproveError;
	};

	// Add CKUSDC pool interface
	private let CKUSDCPool : actor {
		weekly_reward_approval : shared RewardApprovalArg -> async Result.Result<Nat, RewardApprovalErr>;
	} = actor (Env.ckusdc_pool);

	// Transaction tracking
	private stable let harvestBlockIndices = Map.new<Principal, [BlockIndex]>();
	private stable let compoundBlockIndices = Map.new<Principal, [BlockIndex]>();

	// Timer and distribution tracking
	private stable var lastRewardDistributionTime : Int = 0;

	// Constants
	private let WEEK_IN_NANOSECONDS : Nat = 10 * 60 * 1_000_000_000;
	private let REWARD_SUBACCOUNT : ?Blob = ?Blob.fromArray([
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		1
	]);

	// Add map for auto-compound preferences
	private stable let autoCompoundPreferences = Set.new<Types.StakeId>();

	// Modified update weekly rewards function
	private func updateWeeklyRewards() : async () {
		let currentTime = Time.now();

		// Check if a week has passed since last distribution
		if (currentTime - lastRewardDistributionTime >= WEEK_IN_NANOSECONDS) {
			// Fetch latest fee collection data
			await fetchTotalFeeCollectedSofar();

			// If there are fees to distribute
			if (totalFeeCollectedFromLastRewardDistribution > 0) {
				// Distribute rewards
				let distributionResult = await distributeWeeklyRewards(totalFeeCollectedFromLastRewardDistribution);

				switch (distributionResult) {
					case (#ok(_)) {
						// Reset fee collection for next week
						totalFeeCollectedFromLastRewardDistribution := 0;

						// Update last distribution time
						lastRewardDistributionTime := currentTime;

					};
					case (#err(e)) {

						Debug.print(
							"[method: updateWeeklyRewards] [args: " #debug_show (totalFeeCollectedFromLastRewardDistribution) # "] "
							# "Weekly reward distribution failed: " # e
						);
					};
				};
			} else {
				Debug.print("[method: updateWeeklyRewards] [args: " #debug_show (totalFeeCollectedFromLastRewardDistribution) # "] " # "No fees collected for distribution this week");
			};
		};
	};

	// Add action type
	public type AutoCompoundAction = {
		#Enable;
		#Cancel;
	};

	public shared ({ caller }) func toggleAutoCompound(stakeId : Types.StakeId, action : AutoCompoundAction) : async Result.Result<Bool, Text> {
		// Verify stake belongs to caller
		switch (Map.get(stakes, nhash, stakeId)) {
			case (null) return #err("Stake not found");
			case (?stake) {
				if (stake.staker != caller) {
					return #err("Stake ID does not belong to caller");
				};

				let hasAutoCompound = Set.has<Nat>(
					autoCompoundPreferences, // Set itself
					nhash,
					stakeId
				);

				switch (action) {
					case (#Enable) {
						if (hasAutoCompound) {
							return #err("Auto-compound is already enabled for this stake");
						};
						// Enable auto-compound
						Set.add(autoCompoundPreferences, nhash, stakeId);
						#ok(true);
					};

					case (#Cancel) {
						if (not hasAutoCompound) {
							return #err("Auto-compound is not enabled for this stake");
						};
						// Cancel auto-compound
						switch (Map.get(stakes, nhash, stakeId)) {
							case (?currentStake) {
								// Update stake record - move stakedReward to regular reward
								let updatedStake = {
									currentStake with
									pendingRewards = currentStake.pendingRewards + currentStake.stakedReward;
									stakedReward = 0; // Reset staked reward
								};
								Map.set(stakes, nhash, stakeId, updatedStake);
							};
							case (null) {};
						};

						Set.delete(autoCompoundPreferences, nhash, stakeId);
						#ok(false);
					};
				};
			};
		};
	};

	// Modified weekly reward distribution
	private func distributeWeeklyRewards(totalReward : Nat) : async Result.Result<Text, Text> {
		Debug.print("Starting weekly reward distribution with total reward: " # debug_show (totalReward));

		// Calculate rewards for all stakes
		let rewardCalculations = await computeRewardsForAllUsers();

		// 1. Approve weekly reward amount
		let approveResult = await approveWeeklyReward(totalReward);
		switch (approveResult) {
			case (#err(e)) return #err("[method: distributeWeeklyRewards] [args: " #debug_show (totalReward) # "] Failed to approve rewards: " # e);
			case (#ok(_)) {};
		};

		// 2. Transfer main reward amount
		let mainTransferResult = await transferMainReward(totalReward);
		switch (mainTransferResult) {
			case (#err(e)) return #err("[method: distributeWeeklyRewards] [args: " #debug_show (totalReward) # "] Failed to transfer main rewards: " # e);
			case (#ok(_)) {};
		};

		// 3. Transfer remaining reward amount
		let remainingTransferResult = await transferRemainingReward(totalReward);
		switch (remainingTransferResult) {
			case (#err(e)) return #err("[method: distributeWeeklyRewards] [args: " #debug_show (totalReward) # "] Failed to transfer remaining rewards: " # e);
			case (#ok(_)) {
				// Only distribute rewards if all transfers were successful
				await distributeRewardsToStakes(rewardCalculations);
				#ok("Weekly rewards distributed successfully");
			};
		};
	};

	// Store calculated rewards for all stakes
	private stable var lastCalculatedAllUserRewards : [(Types.StakeId, Nat)] = [];

	// Add helper function to check lockup status
	private func hasLockupEnded(stake : Types.Stake) : Bool {
		let currentTime = Time.now();
		return currentTime >= stake.lockEndTime;
	};

	// Helper function to calculate rewards
	private func computeRewardsForAllUsers() : async [(Types.StakeId, Nat)] {
		let rewardCalculations = Buffer.Buffer<(Types.StakeId, Nat)>(0);

		for ((principal, stakeIds) in Map.entries(userStakes)) {
			for (stakeId in stakeIds.vals()) {
				switch (Map.get(stakes, nhash, stakeId)) {
					case (?stake) {
						if (not hasLockupEnded(stake)) {
							let metrics = await calculateUserStakeMatric(stakeId, principal);
							switch (metrics) {
								case (#ok(m)) {
									rewardCalculations.add((stakeId, m.userFinalReward));
								};
								case (#err(e)) {
									Debug.print(
										"[method: computeRewardsForAllUsers] [args: " #debug_show (stakeId, principal) # "] "
										# "Error calculating metrics for stake " # debug_show (stakeId) # ": [error: " # e # "]"
									);
								};
							};
						};
					};
					case (null) {};
				};
			};
		};

		lastCalculatedAllUserRewards := Buffer.toArray(rewardCalculations);
		lastCalculatedAllUserRewards;
	};

	// New helper function to distribute calculated rewards
	func distributeRewardsToStakes(calculations : [(Types.StakeId, Nat)]) : async () {
		for ((stakeId, rewardAmount) in calculations.vals()) {
			switch (Map.get(stakes, nhash, stakeId)) {
				case (?stake) {
					let hasAutoCompound = Set.has<Nat>(
						autoCompoundPreferences,
						nhash,
						stakeId
					);

					if (hasAutoCompound) {
						// Update stake with auto-compound
						let updatedStake = {
							stake with
							stakedReward = stake.stakedReward + rewardAmount
						};
						Map.set(stakes, nhash, stakeId, updatedStake);
					} else {
						// Update stake with normal reward
						let updatedStake = {
							stake with
							pendingRewards = stake.pendingRewards + rewardAmount
						};
						Map.set(stakes, nhash, stakeId, updatedStake);
					};
				};
				case (null) {};
			};
		};
	};

	// Transfer rewards from CKUSD pool to reward account
	// Get approval from CKUSDC pool
	func approveWeeklyReward(totalReward : Nat) : async Result.Result<Text, Text> {

		let distributionAmount = totalReward;

		let approvalArg : RewardApprovalArg = {
			memo = null;
			created_at_time = ?Nat64.fromNat(Int.abs(Time.now()));
			amount = distributionAmount;
			expires_at = ?Nat64.fromNat(Int.abs(Time.now()) + 300_000_000_000);
		};

		let approvalResult = await CKUSDCPool.weekly_reward_approval(approvalArg);

		switch (approvalResult) {
			case (#err(error)) {
				return #err(
					"[method: approveWeeklyReward] [args: " #debug_show (approvalArg) #
					"] CKUSDCPool Approval failed: " # debug_show (error)
				);
			};
			case (#ok(_)) {
				// Check current allowance
				let allowanceResult = await DUSD.icrc2_allowance({
					account = {
						owner = Principal.fromText("ieja4-4iaaa-aaaak-qddra-cai");
						subaccount = null;
					};
					spender = {
						owner = Principal.fromActor(this);
						subaccount = null;
					};
				});

				if (allowanceResult.allowance < distributionAmount) {
					return #err(
						"[method: approveWeeklyReward] [args: " #debug_show (allowanceResult.allowance, distributionAmount)
						# "] Insufficient allowance"
					);
				};

				// Check expiry
				switch (allowanceResult.expires_at) {
					case (?expiry) {
						let currentTime = Nat64.fromNat(Int.abs(Time.now()));
						if (currentTime > expiry) {
							return #err(
								"[method: approveWeeklyReward] [args: " #debug_show (currentTime, expiry)
								# "] Allowance expired"
							);
						};
					};
					case (null) {};
				};
				return #ok("Approval successful");
			};
		};
		#err("[method: approveWeeklyReward] Unexpected end of function");
	};

	// Transfer main reward amount
	func transferMainReward(totalReward : Nat) : async Result.Result<Text, Text> {
		let fee : Nat = 20000; // Standard ICRC token fee

		let distributionAmount = totalReward - fee;

		// Check allowance before transfer
		let allowanceResult = await DUSD.icrc2_allowance({
			account = {
				owner = Principal.fromText("ieja4-4iaaa-aaaak-qddra-cai");
				subaccount = null;
			};
			spender = {
				owner = Principal.fromActor(this);
				subaccount = null;
			};
		});

		// Change to this
		// if (allowanceResult.allowance < distributionAmount) {
		//     return #err("Insufficient allowance for transfer. Current allowance: " # debug_show (allowanceResult.allowance));
		// };
		let transferFromArgs = {
			spender_subaccount = null;
			from = {
				owner = Principal.fromText("ieja4-4iaaa-aaaak-qddra-cai");
				subaccount = null;
			};
			to = {
				owner = Principal.fromActor(this);
				subaccount = REWARD_SUBACCOUNT;
			};
			amount = distributionAmount;
			fee = null;
			memo = null;
			created_at_time = ?Nat64.fromNat(Int.abs(Time.now()));
		};

		let transferResult = await DUSD.icrc2_transfer_from(transferFromArgs);

		switch (transferResult) {
			case (#Ok(blockIndex)) {
				Debug.print("Main transfer successful with block index: " # debug_show (blockIndex));
				return #ok("Main transfer successful");
			};
			case (#Err(transferError)) {
				return #err(
					"[method: transferMainReward] [args: " #debug_show (transferFromArgs) #
					"] [error: " # debug_show (transferError) # "]"
				);
			};
		};
	};

	// Transfer 30% remaining amount
	func transferRemainingReward(totalReward : Nat) : async Result.Result<Text, Text> {

		let remainingAmount = Int.abs(((totalReward - 10000 - 10000) * 30) / 100); // Pehle fees subtract karte hain, phir 30% calculate karte hain

		// Verify balance before transfer
		let currentBalance = await DUSD.icrc1_balance_of({
			owner = Principal.fromActor(this);
			subaccount = REWARD_SUBACCOUNT;
		});

		if (currentBalance < remainingAmount) {
			return #err(
				"[method: transferRemainingReward] [args: " #debug_show (currentBalance, remainingAmount) #
				"] Insufficient balance for remaining transfer"
			);
		};
		let transferArgs = {
			from_subaccount = REWARD_SUBACCOUNT;
			to = {
				owner = Principal.fromText("iwpxf-qyaaa-aaaak-qddsa-cai");
				subaccount = null;
			};
			amount = remainingAmount;
			fee = null;
			memo = null;
			created_at_time = ?Nat64.fromNat(Int.abs(Time.now()));
		};
		// issue: who pay fees?
		let remainingTransferResult = await DUSD.icrc1_transfer(transferArgs);

		switch (remainingTransferResult) {
			case (#Ok(blockIndex)) {
				Debug.print("Remaining transfer successful with block index: " # debug_show (blockIndex));
				return #ok("Remaining transfer successful");
			};
			case (#Err(err)) {
				return #err(
					"[method: transferRemainingReward] [args: " #debug_show (transferArgs) #
					"] [error: " # debug_show (err) # "]"
				);
			};
		};
	};

	// Handle auto-compound rewards
	//  func calculateAndTransferAutoCompounds() : async () {
	//     var totalAutoCompoundAmount = 0;

	//     // Get total auto-compound amount from already updated stakes
	//     for ((principal, stakeIds) in Map.entries(userStakes)) {
	//         for (stakeId in stakeIds.vals()) {
	//             switch (Map.get(stakes, nhash, stakeId)) {
	//                 case (?stake) {
	//                     let hasAutoCompound = Set.has<Nat>(
	//                         autoCompoundPreferences,
	//                         nhash,
	//                         stakeId
	//                     );

	//                     if (hasAutoCompound and stake.stakedReward > 0) {
	//                         totalAutoCompoundAmount += stake.stakedReward;
	//                         Debug.print("Auto-compound amount for stake " # debug_show (stakeId) # ": " # debug_show (stake.stakedReward));
	//                     };
	//                 };
	//                 case (null) {};
	//             };
	//         };
	//     };

	//     // Transfer total auto-compound amount
	//     if (totalAutoCompoundAmount > 0) {
	//         let transferResult = await DUSD.icrc1_transfer({
	//             from_subaccount = REWARD_SUBACCOUNT;
	//             to = {
	//                 owner = Principal.fromActor(this);
	//                 subaccount = null;
	//             };
	//             amount = totalAutoCompoundAmount;
	//             fee = null;
	//             memo = null;
	//             created_at_time = ?Nat64.fromNat(Int.abs(Time.now()));
	//         });

	//         switch (transferResult) {
	//             case (#Ok(blockIndex)) {
	//                 Debug.print("Auto-compound transfer successful with block index: " # debug_show (blockIndex));
	//             };
	//             case (#Err(err)) {
	//                 Debug.print("Auto-compound transfer failed: " # debug_show (err));
	//             };
	//         };
	//     };
	// };

	// Add manual harvest function
	public shared ({ caller }) func harvestReward(stakeId : Types.StakeId) : async Result.Result<(), Text> {
		// Verify stake belongs to caller in userStakes map
		let userStakeIds = switch (Map.get(userStakes, phash, caller)) {
			case (null) return #err("No stakes found for user");
			case (?ids) ids;
		};

		// Check if stakeId exists in user's stakes
		let validStakeId = Array.find<Types.StakeId>(userStakeIds, func(id) { id == stakeId });
		if (validStakeId == null) {
			return #err("This stake ID does not belong to caller");
		};

		switch (Map.get(stakes, nhash, stakeId)) {
			case (null) return #err("Stake not found");
			case (?stake) {
				if (stake.staker != caller) return #err("Not authorized");
				if (stake.pendingRewards == 0) return #err("No rewards to harvest");

				let lastHarvestTime = Time.now();

				// issue: who pay fees?
				let transferResult = await DUSD.icrc1_transfer({
					from_subaccount = REWARD_SUBACCOUNT;
					to = { owner = caller; subaccount = null };
					amount = stake.pendingRewards;
					fee = null;
					memo = null;
					created_at_time = ?Nat64.fromNat(Int.abs(lastHarvestTime));
				});

				switch (transferResult) {
					case (#Ok(blockIndex)) {
						// Reset reward in stake
						let updatedStake = { stake with pendingRewards = 0; lastHarvestTime };
						Map.set(stakes, nhash, stakeId, updatedStake);

						// Record harvest transaction
						let currentIndices = switch (Map.get(harvestBlockIndices, phash, caller)) {
							case (?indices) indices;
							case (null) [];
						};
						Map.set(harvestBlockIndices, phash, caller, Array.append(currentIndices, [blockIndex]));
						#ok();
					};
					case (#Err(error)) #err("Transfer failed: " # debug_show (error));
				};
			};
		};
	};

	// Add manual compound function
	public shared ({ caller }) func manuallyCompoundRewards(stakeId : Types.StakeId) : async Result.Result<(), Text> {
		switch (Map.get(stakes, nhash, stakeId)) {
			case (null) return #err("Stake not found");
			case (?stake) {
				if (stake.staker != caller) return #err("Not authorized");
				if (stake.pendingRewards == 0) return #err("No rewards to compound");
				// issue: who pay fees?
				let transferResult = await DUSD.icrc1_transfer({
					from_subaccount = REWARD_SUBACCOUNT;
					to = {
						owner = Principal.fromActor(this);
						subaccount = null;
					};
					amount = stake.pendingRewards;
					fee = null;
					memo = null;
					created_at_time = ?Nat64.fromNat(Int.abs(Time.now()));
				});

				switch (transferResult) {
					case (#Ok(blockIndex)) {
						// Update stakedReward and reset pendingRewards
						let updatedStake = {
							stake with
							stakedReward = stake.stakedReward + stake.pendingRewards;
							pendingRewards = 0;
						};
						Map.set(stakes, nhash, stakeId, updatedStake);

						// Record compound transaction
						let currentIndices = switch (Map.get(compoundBlockIndices, phash, caller)) {
							case (?indices) indices;
							case (null) [];
						};
						Map.set(compoundBlockIndices, phash, caller, Array.append(currentIndices, [blockIndex]));
						#ok();
					};
					case (#Err(error)) #err("Transfer failed: " # debug_show (error));
				};
			};
		};
	};

	// Query function to get pending rewards for a stake
	// public query func getPendingReward(stakeId : Types.StakeId) : async Result.Result<Nat, Text> {
	//     switch (Map.get(stakes, nhash, stakeId)) {
	//         case (null) #err("Stake not found");
	//         case (?stake) #ok(stake.pendingRewards);
	//     };
	// };

	// Add function to get all reward-related stats for a stake
	// public query func getUserStakeRewardStats(stakeId : Types.StakeId) : async Result.Result<{ pendingReward : Nat; isAutoCompound : Bool; lastHarvestTime : Time.Time }, Text> {
	//     switch (Map.get(stakes, nhash, stakeId)) {
	//         case (null) #err("Stake not found");
	//         case (?stake) {
	//             let isAutoCompound = Set.has<Nat>(
	//                 autoCompoundPreferences,
	//                 nhash,
	//                 stakeId
	//             );

	//             #ok({
	//                 pendingReward = stake.pendingRewards;
	//                 isAutoCompound = isAutoCompound;
	//                 lastHarvestTime = stake.lastHarvestTime;
	//             });
	//         };
	//     };
	// };

	// Add helper function to get reward account balance
	// public shared func fetchRewardWalletBalance() : async Nat {
	//     await DUSD.icrc1_balance_of({
	//         owner = Principal.fromActor(this);
	//         subaccount = REWARD_SUBACCOUNT;
	//     });
	// };

	// Get all auto-compound stakes for a user
	public shared query ({ caller }) func isStakeAutoCompound(stakeId : Types.StakeId) : async Result.Result<Bool, Text> {
		// Verify stake belongs to caller
		switch (Map.get(stakes, nhash, stakeId)) {
			case (null) return #err("Stake not found");
			case (?stake) {
				if (stake.staker != caller) {
					return #err("Stake ID does not belong to caller");
				};

				// Check if stake is auto-compounding
				#ok(isRewardsAutoStaked(stakeId));
			};
		};
	};

	// Check if stake is auto-compounding
	func isRewardsAutoStaked(stakeId : Types.StakeId) : Bool {
		Set.has<Nat>(
			autoCompoundPreferences,
			nhash,
			stakeId
		);
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
		let validationResult = await isValidStakingBlock(blockIndex, caller);
		let transfer = switch (validationResult) {
			case (#err(error)) { return #err(error) };
			case (#ok(transfer)) { transfer };
		};

		// Check if bootstrap period is active
		let currentTime = Time.now();
		if (isBootstrapPhase) {

			// During bootstrap, strictly check if user has already staked
			// switch (Map.get(userStakes, phash, caller)) {
			//     case (?existingStakes) {
			//         return #err("During bootstrap period you can only have 1 active stake. Please wait for bootstrap period to end for additional stakes");
			//     };
			//     case (null) {};
			// };

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
			pendingRewards = 0;
			stakedReward = 0;
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

		// Update pool totalTokensStaked
		let newTotalStaked = pool.totalTokensStaked + transfer.amount;

		pool := { pool with totalTokensStaked = newTotalStaked };

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

	// Modified unstake function to handle rewards
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

		// Calculate total amount (stake amount + pending rewards)
		let totalAmount = stake.amount + stake.pendingRewards;

		// Remove from auto-compound preferences if enabled
		if (Set.has<Nat>(autoCompoundPreferences, nhash, stakeId)) {
			Set.delete<Nat>(autoCompoundPreferences, nhash, stakeId);
		};

		// issue: who pay fees?
		// If there are pending rewards, transfer from pendingRewards account first
		if (stake.pendingRewards > 0) {
			let rewardTransferResult = await DUSD.icrc1_transfer({
				from_subaccount = REWARD_SUBACCOUNT;
				to = { owner = caller; subaccount = null };
				amount = stake.pendingRewards;
				fee = null;
				memo = null;
				created_at_time = ?Nat64.fromNat(Int.abs(Time.now()));
			});

			switch (rewardTransferResult) {
				case (#Err(_)) return #err("Reward transfer failed");
				case (#Ok(_)) {};
			};
		};

		// issue: who pay fees?
		// Transfer stake amount
		let stakeTransferResult = await DUSD.icrc1_transfer({
			from_subaccount = null; // Default account for stake amount
			to = { owner = caller; subaccount = null };
			amount = stake.amount;
			fee = null;
			memo = null;
			created_at_time = ?Nat64.fromNat(Int.abs(Time.now()));
		});

		switch (stakeTransferResult) {
			case (#Err(_)) return #err("Stake transfer failed");
			case (#Ok(blockIndex)) {
				// Update pool total staked
				pool := {
					pool with
					totalTokensStaked = pool.totalTokensStaked - stake.amount
				};

				// Remove stake
				Map.delete(stakes, nhash, stakeId);

				// Update user stakes array
				let remainingStakes = Array.filter(
					userStakeIds,
					func(id : Types.StakeId) : Bool { id != stakeId }
				);

				if (Array.size(remainingStakes) == 0) {
					Map.delete(userStakes, phash, caller);
				} else {
					Map.set(userStakes, phash, caller, remainingStakes);
				};

				// Record unstake transaction
				let currentBlockIndices = switch (Map.get(unStakeBlockIndices, phash, caller)) {
					case (?indices) indices;
					case (null) [];
				};
				Map.set(unStakeBlockIndices, phash, caller, Array.append(currentBlockIndices, [blockIndex]));

				#ok();
			};
		};
	};

	///////////////////////////////////////////////////////////////////////////////////////////////////////
	/////////////////////////////////////  getter Functions ////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////////////////////////////

	// Public getter function for all pool data
	public query func getPoolData() : async Types.StakingPoolDetails {
		{
			pool with
			totalFeeCollected = totalFeeCollectedFromLastRewardDistribution;
			noOfStakers = Map.size(userStakes);
		};
	};

	// Get user stakes details
	public shared query ({ caller }) func getUserStakes() : async Types.QueryStakes {
		let userStakeIds = switch (Map.get(userStakes, phash, caller)) {
			case (?ids) { ids };
			case (null) { [] };
		};
		let buffer = Buffer.Buffer<Types.QueryStake>(Array.size(userStakeIds));

		for (stakeId in userStakeIds.vals()) {
			switch (Map.get(stakes, nhash, stakeId)) {
				case (?st) {
					buffer.add({
						id = st.id;
						amount = st.amount;
						stakedAt = st.stakeTime;
						unlockAt = st.lockEndTime;
						lastRewardsClaimedAt = st.lastHarvestTime;
						unclaimedRewards = st.pendingRewards;
						stakedReward = st.stakedReward;
						isRewardsAutoStaked = isRewardsAutoStaked(st.id);
					});
				};
				case (null) {};
			};
		};
		Buffer.toArray(buffer);
	};

	// Get all transactions for a user
	public shared ({ caller }) func getUserTransactions() : async [Types.Transaction] {
		let buffer = Buffer.Buffer<Types.Transaction>(0);

		// Stake transactions ko fetch karo
		for ((blockIndex, principal) in Map.entries(processedStakeTransactions)) {
			if (principal == caller) {
				try {
					switch (await fetchTransactionByBlockIndex(blockIndex)) {
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
						switch (await fetchTransactionByBlockIndex(blockIndex)) {
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

			let getTransactionsResult = await DUSDIndex.get_account_transactions(args);

			let { balance; oldest_tx_id; transactions } = switch (getTransactionsResult) {
				case (#Ok(value)) { value };
				case (#Err(error)) {
					Debug.print(
						"[method: fetchTotalFeeCollectedSofar] [args: " #debug_show (args) # "] "
						# "Error fetching transactions from DUSD Index canister: " # debug_show (error)
					);

					return ();
				};
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

	periodicFeeUpdater := do {
		let ONE_HOUR_NAN_SEC = 60_000_000_000;
		let nextFetch = ONE_HOUR_NAN_SEC - (Time.now() % ONE_HOUR_NAN_SEC);

		Timer.setTimer<system>(
			#nanoseconds(Int.abs nextFetch),
			func() : async () {
				periodicFeeUpdater := Timer.recurringTimer<system>(#nanoseconds ONE_HOUR_NAN_SEC, fetchTotalFeeCollectedSofar);
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

	// public func initFetchTotalFeeCollected() : async () {
	//     await fetchTotalFeeCollectedSofar();
	// };

	///////////////////////////////////////////////////////////////////////////////////////////////////////
	/////////////////////////////////////    timer   /////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////////////////////////////

	// Initialize timer
	rewardUpdateTimer := do {
		let WEEK_IN_NANOS = 7 * 24 * 60 * 60 * 1_000_000_000;
		// Calculate time until next week
		let nextUpdate = WEEK_IN_NANOS - (Time.now() % WEEK_IN_NANOS);

		Timer.setTimer<system>(
			#nanoseconds(Int.abs nextUpdate),
			func() : async () {
				// Set recurring timer for subsequent weeks
				rewardUpdateTimer := Timer.recurringTimer<system>(
					#nanoseconds WEEK_IN_NANOS,
					updateWeeklyRewards
				);
				// Do first update
				await updateWeeklyRewards();
			}
		);
	};

	///////////////////////////////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////// helper for notifystaking ////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////////////////////////////

	/* This function validates a staking transaction
    * Example call: isValidStakingBlock(123, "xyz-principal-id")
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
    *    Example: If minimum stake is 100 DUSD but only 50 DUSD staked, returns error
    */
	func isValidStakingBlock(blockIndex : Nat, caller : Principal) : async Result.Result<Icrc.Transfer, Text> {
		// Get transaction details
		let getTransactionsResponse = await DUSD.get_transactions({ start = blockIndex; length = 1 });
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
		let stakingAccount = await getStakingCanisterAccount(#DUSD);

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
		if (transfer.amount < pool.minimumStakeAmount) {
			return #err("Transaction amount is less than minimum stake amount");
		};

		#ok(transfer);
	};

	private func getStakingCanisterAccount(token : Tokens) : async Icrc.Account {
		switch (token) {
			case (#DUSD) {
				{
					owner = Principal.fromActor(this);
					subaccount = null;
				};
			};
		};
	};

	// Helper function to get transaction from block index
	func fetchTransactionByBlockIndex(blockIndex : Nat) : async Result.Result<Types.Transaction, Text> {
		try {
			let getTransactionsResponse = await DUSD.get_transactions({
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

	// This function is used to transfer dusd from staking canister to ckUSDC Pool canister
	public shared ({ caller }) func get_dusd_for_maintaining_peg(amount : Nat) : async Result.Result<(), Text> {
		if (caller != Principal.fromText(Env.ckusdc_pool)) {
			return #err("Not authorised");
		};

		let transferArgs = {
			from_subaccount = null;
			to = {
				owner = Principal.fromText(Env.ckusdc_pool);
				subaccount = null;
			};
			amount;
			fee = null;
			memo = null;
			created_at_time = null;
		};
		let result = await DUSD.icrc1_transfer(transferArgs);

		switch (result) {
			case (#Ok(blockIndex)) {
				Vector.add(dusdForPegBlockIndices, blockIndex);
				#ok();
			};
			case (#Err(error)) { #err("Error transferring DUSD: " # debug_show (error)) };
		};
	};

};
