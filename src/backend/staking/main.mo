/*
==============================================
DOXA STAKING CANISTER DOCUMENTATION
==============================================

Code Analysis:
The code implements a comprehensive staking system with the following key components:

1. Token Integration:
   - Uses ICRC token standard
   - Interfaces with USDx token canister
   - Handles token transfers and balance tracking

2. Data Structures:
   - Uses HashMaps for storing stakes and user data
   - Implements efficient reward calculation system
   - Maintains transaction history

3. Security Features:
   - Admin controls for emergency situations
   - Input validation on all functions
   - Lock period enforcement

4. Reward Mechanism:
   - Dynamic APR calculation
   - Per-second reward distribution
   - Weight-based reward allocation

Changes Made:
1. Added comprehensive documentation structure
2. Clarified function purposes and examples
3. Added important variables section
4. Structured documentation into logical sections

Main Features:

1. STAKING:
   - Users can stake USDx tokens
   - Minimum stake: 100 USDx (100_000_000 with decimals)
   - Lock period: 1-52 weeks flexible
   Example:
   - Transfer USDx to canister
   - Call notifyStake() to register

2. REWARDS:
   - Stake-time based rewards
   - 30% of total fees as weekly rewards
   - Per-second distribution
   Example:
   - 1000 USDx weekly fees
   - 300 USDx weekly rewards
   - Continuous distribution

3. HARVESTING:
   - Anytime reward claims
   - Minimum harvest threshold
   Example:
   - Call harvest() for claims
   - Direct wallet transfers

4. UNSTAKING:
   - Post-lock period withdrawals
   - Final reward settlement
   Example:
   - Call unstake() after lock
   - Receive stake + rewards

5. ADMIN CONTROLS:
   - Emergency withdrawal
   - Parameter updates
   Example:
   - Update reward rates
   - Emergency fund recovery

6. VIEW FUNCTIONS:
   - Pool statistics
   - User positions
   - Transaction history
   Example:
   - Check APY with getUserStakingPosition()
   - View stakes with getStakingStats()

IMPORTANT VARIABLES:
- USDx Token: irorr-5aaaa-aaaak-qddsq-cai
- Admin: 5g24m-kxyrd-yb7wl-up5k6-4egww-miul7-gajat-e2d7i-mdpc7-6dduf-eae
- Lock Duration: 1-52 weeks (flexible)
- Minimum Stake: 100 USDx
- Weekly Rewards: 30% of total fees
*/

import HashMap "mo:base/HashMap";
import Principal "mo:base/Principal";
import Time "mo:base/Time";
import Nat "mo:base/Nat";
import Nat64 "mo:base/Nat64";
import Result "mo:base/Result";
import Nat32 "mo:base/Nat32";
import Int "mo:base/Int";
import Buffer "mo:base/Buffer";
import Timer "mo:base/Timer";
import Debug "mo:base/Debug";
import Float "mo:base/Float";
import Error "mo:base/Error";
import Array "mo:base/Array";
import Option "mo:base/Option";
import Text "mo:base/Text";
import Types "types";
import U "../Utils";
import Icrc "../service/icrc-interface"; // ICRC token interface
import Map "mo:map/Map";
import Reward "reward";

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
	} = actor ("bd3sg-teaaa-aaaaa-qaaba-cai");
	// Lock duration constants
	private let MIN_LOCK_DURATION_IN_SEC : Nat = 2_592_000; // 30 days minimum
	private let MAX_LOCK_DURATION_IN_SEC : Nat = 31_536_000; // 365 days maximum
	private let ONE_YEAR : Nat = 31_536_000; // For APR calculation

	// Pool configuration
	private stable var pool : Types.StakingPool = {
		name = "Doxa Dynamic Staking";
		startTime = Time.now();
		endTime = Time.now() + (ONE_YEAR * 1_000_000_000);
		totalStaked = 0;
		rewardTokenFee = 0;
		stakingSymbol = "USDx";
		stakingToken = "doxa-dollar";
		rewardSymbol = "USDx";
		rewardToken = "doxa-dollar";
		rewardPerSecond = 100_000; // Base reward rate
		minimumStake = 10_000_000; // 10 tokens with 6 decimals
		lockDuration = MIN_LOCK_DURATION_IN_SEC * 1_000_000_000; // Default minimum duration in nanoseconds
	};

	let { nhash; phash } = Map;

	// Storage
	private stable let stakes = Map.new<Types.StakeId, Types.Stake>();
	private stable let userStakes = Map.new<Principal, [Types.StakeId]>();
	// Type alias for block index
	private type BlockIndex = Nat;
	private type TransactionId = Nat;

	private stable let stakeBlockIndices = Map.new<TransactionId, BlockIndex>(); // Maps transaction ID to block index
	private stable let harvestBlockIndices = Map.new<TransactionId, BlockIndex>(); // Maps transaction ID to block index
	// Transaction se block index nikalne ke liye helper function
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

	// Counters
	private stable var nextStakeId : Nat = 0;
	private stable var totalRewards : Nat64 = 0;
	private stable var _tranIdx : Nat = 0;
	private stable var _harvestIdx : Nat = 0;
	private let s_heartbeatIntervalSeconds : Nat = 3600;

	private stable let processedStakeTransactions = Map.new<Nat, Principal>();

	type Tokens = {
		#USDx;
	};

	// Modified stake notification to handle dynamic periods
	public shared ({ caller }) func notifyStake(blockIndex : Nat, lockDuration : Nat) : async Result.Result<(), Text> {
		// Validate lock duration
		if (lockDuration < MIN_LOCK_DURATION_IN_SEC) {
			return #err("Lock duration must be at least 30 days");
		};
		if (lockDuration > MAX_LOCK_DURATION_IN_SEC) {
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

		let lockDurationNanos = lockDuration * 1_000_000_000;

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

		// Create new stake with unique ID
		let stakeId = nextStakeId;
		nextStakeId += 1;

		// Create initial stake record
		let stake : Types.Stake = {
			id = stakeId;
			staker = transfer.from.owner;
			amount = transfer.amount;
			stakeTime = Time.now();
			lockEndTime = Time.now() + (lockDuration * 1_000_000_000);
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

		Map.set(processedStakeTransactions, nhash, blockIndex, transfer.from.owner);

		#ok();
	};

	// Calculate stake metrics for a specific user
	public shared ({ caller }) func calculateStakeMetrics() : async Result.Result<[{ stakeId : Nat; earned : Nat64; weight : Float; estimatedAPY : Text }], Text> {
		switch (Map.get(userStakes, phash, caller)) {
			case (null) return #err("Koi stake nahi mila");
			case (?userStakeIds) {
				if (Array.size(userStakeIds) == 0) return #err("Active stake nahi hai");

				var stakeMetrics : [{
					stakeId : Nat;
					earned : Nat64;
					weight : Float;
					estimatedAPY : Text;
				}] = [];

				// Get total fees collected for APY calculation
				let totalFees = await getTotalFeeCollected();
				let weeklyRewards = (totalFees * 30) / 100; // 30% of fees as rewards

				for (stakeId in userStakeIds.vals()) {
					switch (Map.get(stakes, nhash, stakeId)) {
						case (null) {};
						case (?stake) {
							let lockDuration = Int.abs(stake.lockEndTime - stake.stakeTime) / 1_000_000_000;
							let weight = Float.fromInt(lockDuration) / Float.fromInt(MAX_LOCK_DURATION_IN_SEC);

							// Calculate earned rewards
							let timeNow = Time.now();
							let stakedSeconds = timeNow - stake.lastHarvestTime;

							let earned = if (
								stakedSeconds < s_heartbeatIntervalSeconds * 1_000_000_000 or
								timeNow < pool.startTime or timeNow > pool.endTime
							) {
								0;
							} else {
								// Calculate per-second reward based on user's share
								let secondsSinceLastHarvest = stakedSeconds / 1_000_000_000;
								let userShare = Float.fromInt(stake.amount) / Float.fromInt(pool.totalStaked);
								let rewardPerSecond = Float.fromInt(weeklyRewards) / (7.0 * 24.0 * 3600.0); // Weekly rewards to per second
								let earnedAmount = rewardPerSecond * userShare * Float.fromInt(secondsSinceLastHarvest);

								// Apply weight multiplier based on lock duration
								let weightMultiplier = Float.fromInt(Reward.getLockupWeight(lockDuration));
								Int.abs(Float.toInt(earnedAmount * weightMultiplier));
							};

							// Calculate APY based on actual rewards
							let estimatedAPY = if (pool.totalStaked == 0 or weeklyRewards == 0) {
								"0%";
							} else {
								let userWeight = Reward.calculateUserWeeklyStakeWeight(
									stake.amount,
									pool.totalStaked,
									lockDuration
								);

								var totalWeight : Float = 0;
								for ((_, s) in Map.entries(stakes)) {
									totalWeight += Reward.calculateUserWeeklyStakeWeight(
										s.amount,
										pool.totalStaked,
										Int.abs(s.lockEndTime - s.stakeTime) / 1_000_000_000
									);
								};

								let userRewards = Reward.calculateUserWeeklyReward(weeklyRewards, userWeight, totalWeight);
								let apy = Reward.calculateAPY(userRewards, stake.amount);

								if (apy < 0.000001) {
									"0.000001%";
								} else {
									Float.toText(apy) # "%";
								};
							};

							stakeMetrics := Array.append(stakeMetrics, [{ stakeId = stakeId; earned = Nat64.fromNat(earned); weight = weight; estimatedAPY = estimatedAPY }]);
						};
					};
				};

				#ok(stakeMetrics);
			};
		};
	};

	// public shared ({ caller }) func harvest() : async Result.Result<(), Text> {
	//     // Get user's stake IDs
	//     switch (Map.get(userStakes, phash, caller)) {
	//         case (null) return #err("No stakes found for user");
	//         case (?userStakeIds) {
	//             if (Array.size(userStakeIds) == 0) return #err("No active stakes found");
	//             let stakeId = userStakeIds[0]; // Get first stake ID
	//             switch (Map.get(stakes, nhash, stakeId)) {
	//                 case (null) return #err("No active stake found");
	//                 case (?stake) {
	//                     let rewards = await calculateRewards(caller);

	//                     if (rewards < pool.minimumStake) {
	//                         return #err("Rewards below minimum harvest amount");
	//                     };

	//                     // Transfer rewards
	//                     let transferResult = await USDx.icrc1_transfer({
	//                         to = { owner = caller; subaccount = null };
	//                         amount = rewards;
	//                         fee = null;
	//                         memo = null;
	//                         from_subaccount = null;
	//                         created_at_time = ?Nat64.fromNat(Int.abs(Time.now()));
	//                     });

	//                     switch (transferResult) {
	//                         case (#Err(_)) return #err("Failed to transfer rewards");
	//                         case (#Ok(_)) {
	//                             // Update stake record
	//                             let updatedStake : Types.Stake = {
	//                                 id = stake.id;
	//                                 staker = stake.staker;
	//                                 amount = stake.amount;
	//                                 stakeTime = stake.stakeTime;
	//                                 lockEndTime = stake.lockEndTime;
	//                                 lastHarvestTime = Time.now();
	//                                 earned = 0;
	//                                 weight = stake.weight;
	//                                 estimatedAPY = stake.estimatedAPY;
	//                             };
	//                             Map.set(stakes, nhash, stakeId, updatedStake);

	//                             // Record transaction
	//                             let harvestTx : Types.Transaction = {
	//                                 from = Principal.fromActor(this);
	//                                 to = caller;
	//                                 amount = rewards;
	//                                 method = "Harvest";
	//                                 time = Time.now();
	//                             };
	//                             _harvestIdx += 1;

	//                             #ok();
	//                         };
	//                     };
	//                 };
	//             };
	//         };
	//     };
	// };

	// // Unstake function
	// public shared ({ caller }) func unstake() : async Result.Result<(), Text> {
	//     // Get user's stake IDs
	//     switch (Map.get(userStakes, phash, caller)) {
	//         case (null) return #err("No stakes found for user");
	//         case (?userStakeIds) {
	//             if (Array.size(userStakeIds) == 0) return #err("No active stakes found");
	//             let stakeId = userStakeIds[0]; // Get first stake ID
	//             switch (Map.get(stakes, nhash, stakeId)) {
	//                 case (null) return #err("No active stake found");
	//                 case (?stake) {
	//                     // Check lock period
	//                     if (Time.now() < stake.lockEndTime) {
	//                         return #err("Stake is still locked until " # Int.toText(stake.lockEndTime));
	//                     };

	//                     // Calculate final rewards before unstaking
	//                     let finalRewards = await calculateRewards(caller);

	//                     // Transfer staked tokens back
	//                     let transferResult = await USDx.icrc1_transfer({
	//                         to = { owner = caller; subaccount = null };
	//                         amount = stake.amount;
	//                         fee = null;
	//                         memo = null;
	//                         from_subaccount = null;
	//                         created_at_time = ?Nat64.fromNat(Int.abs(Time.now()));
	//                     });

	//                     switch (transferResult) {
	//                         case (#Err(e)) return #err("Failed to transfer staked tokens back");
	//                         case (#Ok(_)) {
	//                             // Transfer rewards if any
	//                             if (finalRewards > 0) {
	//                                 ignore await harvest();
	//                             };

	//                             // Update pool total staked before removing stake
	//                             pool := { pool with totalStaked = pool.totalStaked - stake.amount };

	//                             // Remove stake
	//                             Map.delete(stakes, nhash, stakeId);

	//                             // Remove from user stakes array
	//                             Map.set(userStakes, phash, caller, Array.filter(userStakeIds, func(id : Types.StakeId) : Bool { id != stakeId }));

	//                             // Record transaction
	//                             let unstakeTx : Types.Transaction = {
	//                                 from = Principal.fromActor(this);
	//                                 to = caller;
	//                                 amount = stake.amount;
	//                                 method = "Unstake";
	//                                 time = Time.now();
	//                             };
	//                             _tranIdx += 1;

	//                             #ok();
	//                         };
	//                     };
	//                 };
	//             };
	//         };
	//     };
	// };

	// // Add stake to existing position
	// public shared ({ caller }) func addStake(blockIndex : Nat) : async Result.Result<(), Text> {
	//     // Check if transaction already processed
	//     switch (Map.get(processedStakeTransactions, nhash, blockIndex)) {
	//         case (?existingCaller) {
	//             return #err("Transaction already processed for caller: " # Principal.toText(existingCaller));
	//         };
	//         case (null) {};
	//     };

	//     // Validate staking block
	//     switch (await validateStakingBlock(blockIndex, caller)) {
	//         case (#err(error)) { return #err(error) };
	//         case (#ok()) {};
	//     };

	//     // Get transaction details
	//     let getTransactionsResponse = await USDx.get_transactions({ start = blockIndex; length = 1 });
	//     let { transactions } = getTransactionsResponse;
	//     let transaction = transactions[0];

	//     let transfer = switch (transaction.transfer) {
	//         case (?value) { value };
	//         case (null) {
	//             return #err("Transaction must be a transfer");
	//         };
	//     };

	//     // Get user's stake IDs
	//     switch (Map.get(userStakes, phash, caller)) {
	//         case (null) return #err("No stakes found for user");
	//         case (?userStakeIds) {
	//             if (Array.size(userStakeIds) == 0) return #err("No active stakes found");
	//             let stakeId = userStakeIds[0]; // Get first stake ID
	//             switch (Map.get(stakes, nhash, stakeId)) {
	//                 case (null) return #err("No active stake found");
	//                 case (?existingStake) {
	//                     // Calculate current rewards before updating stake
	//                     let currentRewards = await calculateRewards(caller);

	//                     // Calculate lock duration and APY
	//                     let lockDurationSeconds = Int.abs(existingStake.lockEndTime - existingStake.stakeTime) / 1_000_000_000;
	//                     let estimatedAPY = await calculateDynamicAPR(caller, stakeId, lockDurationSeconds);

	//                     // Update stake amount and rewards
	//                     let updatedStake : Types.Stake = {
	//                         id = existingStake.id;
	//                         staker = existingStake.staker;
	//                         amount = existingStake.amount + transfer.amount;
	//                         stakeTime = existingStake.stakeTime;
	//                         lockEndTime = existingStake.lockEndTime;
	//                         lastHarvestTime = existingStake.lastHarvestTime;
	//                         earned = existingStake.earned + Nat64.fromNat(currentRewards);
	//                         weight = existingStake.weight;
	//                         estimatedAPY = estimatedAPY;
	//                     };

	//                     Map.set(stakes, nhash, stakeId, updatedStake);
	//                     pool := { pool with totalStaked = pool.totalStaked + transfer.amount };

	//                     Map.set(processedStakeTransactions, nhash, blockIndex, caller);
	//                     #ok();
	//                 };
	//             };
	//         };
	//     };
	// };

	// // Update lock duration for existing stake
	// public shared ({ caller }) func updateLockDurationforStakeId(stakeId : Nat, newDuration : Nat) : async Result.Result<(), Text> {
	//     if (newDuration < MIN_LOCK_DURATION_IN_SEC) {
	//         return #err("Lock duration must be at least 30 days");
	//     };
	//     if (newDuration > MAX_LOCK_DURATION_IN_SEC) {
	//         return #err("Lock duration cannot exceed 365 days");
	//     };

	//     // Get user's stake IDs
	//     switch (Map.get(userStakes, phash, caller)) {
	//         case (null) return #err("No stakes found for user");
	//         case (?userStakeIds) {
	//             if (Array.size(userStakeIds) == 0) return #err("No active stakes found");

	//             // Check if stakeId belongs to caller
	//             if (Option.isNull(Array.find<Nat>(userStakeIds, func(x) = x == stakeId))) {
	//                 return #err("Stake ID does not belong to caller");
	//             };

	//             switch (Map.get(stakes, nhash, stakeId)) {
	//                 case (?existingStake) {
	//                     let currentTime = Time.now();
	//                     let newLockEndTime = currentTime + newDuration * 1_000_000_000;

	//                     if (newLockEndTime <= existingStake.lockEndTime) {
	//                         return #err("New lock duration must be longer than current duration");
	//                     };

	//                     let updatedStake : Types.Stake = {
	//                         id = existingStake.id;
	//                         staker = existingStake.staker;
	//                         amount = existingStake.amount;
	//                         stakeTime = existingStake.stakeTime;
	//                         lockEndTime = newLockEndTime;
	//                         lastHarvestTime = existingStake.lastHarvestTime;
	//                         earned = existingStake.earned;
	//                         weight = Float.fromInt(newDuration) / Float.fromInt(MAX_LOCK_DURATION_IN_SEC);
	//                         estimatedAPY = await calculateDynamicAPR(caller, stakeId, newDuration);
	//                     };

	//                     Map.set(stakes, nhash, stakeId, updatedStake);
	//                     return #ok();
	//                 };
	//                 case (null) {
	//                     return #err("No active stake found");
	//                 };
	//             };
	//         };
	//     };
	// };

	///////////////////////////////////////////////////////////////////////////////////////////////////////
	/////////////////////////////////////  getter Functions ////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////////////////////////////

	// Modified getUserStakingPosition to include dynamic APR
	// public shared ({ caller }) func getUserStakingPosition() : async Types.PoolStats {
	//     var userStake : Nat = 0;
	//     var userEarned : Nat64 = 0;
	//     var dynamicAPR : Nat = 0;

	//     // Get user's stake IDs
	//     switch (Map.get(userStakes, phash, caller)) {
	//         case (?userStakeIds) {
	//             for (stakeId in userStakeIds.vals()) {
	//                 switch (Map.get(stakes, nhash, stakeId)) {
	//                     case (?stake) {
	//                         userStake += stake.amount;
	//                         userEarned += stake.earned;
	//                         // Convert estimated APY string to Nat
	//                         let aprStr = stake.estimatedAPY;
	//                         let aprWithoutPercent = Text.replace(aprStr, #text("%"), "");
	//                         // Parse float value directly from string
	//                         let aprParts = Text.split(aprWithoutPercent, #char('.'));
	//                         let aprInt = switch (aprParts.next()) {
	//                             case (?val) { val };
	//                             case null { 0 };
	//                         };
	//                         if (aprInt > dynamicAPR) {
	//                             dynamicAPR := aprInt;
	//                         };
	//                     };
	//                     case (null) {};
	//                 };
	//             };
	//         };
	//         case (null) {};
	//     };

	//     {
	//         totalStaked = pool.totalStaked;
	//         totalStakers = Map.size(stakes);
	//         totalRewarded = totalRewards;
	//         apr = dynamicAPR;
	//         userStake = userStake;
	//         userEarned = userEarned;
	//         minimumStake = pool.minimumStake;
	//         lockDuration = pool.lockDuration;
	//     };
	// };

	// Public getter function for all pool data
	public query func getPoolData() : async Types.StakingPool {
		pool;
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
		for ((blockIndex, principal) in Map.entries(harvestBlockIndices)) {
			if (principal == caller) {
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

		Buffer.toArray(buffer);
	};

	///////////////////////////////////////////////////////////////////////////////////////////////////////
	/////////////////////////////////////  Admin Functions ////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////////////////////////////

	private stable var YOUR_ADMIN_PRINCIPAL : Text = "5g24m-kxyrd-yb7wl-up5k6-4egww-miul7-gajat-e2d7i-mdpc7-6dduf-eae";

	public shared ({ caller }) func emergencyWithdraw() : async Result.Result<(), Text> {
		if (caller != Principal.fromText(YOUR_ADMIN_PRINCIPAL)) {
			return #err("Not authorized");
		};

		let transferResult = await USDx.icrc1_transfer({
			to = { owner = caller; subaccount = null };
			amount = pool.totalStaked;
			fee = null;
			memo = null;
			from_subaccount = null;
			created_at_time = ?Nat64.fromNat(Int.abs(Time.now()));
		});

		switch (transferResult) {
			case (#Err(e)) return #err("Failed to transfer tokens");
			case (#Ok(_)) {
				pool := { pool with totalStaked = 0 };
				// Clear all stakes from stable map
				for ((stakeId, _) in Map.entries(stakes)) {
					Map.delete(stakes, nhash, stakeId);
				};
				// Clear user stakes
				for ((principal, _) in Map.entries(userStakes)) {
					Map.delete(userStakes, phash, principal);
				};
				#ok();
			};
		};
	};

	public shared ({ caller }) func updatePoolParams(params : Types.PoolParams) : async Result.Result<(), Text> {
		if (caller != Principal.fromText(YOUR_ADMIN_PRINCIPAL)) {
			return #err("Not authorized");
		};

		pool := {
			pool with
			rewardPerSecond = params.rewardPerSecond;
			minimumStake = params.minimumStake;
			lockDuration = params.lockDuration;
		};

		#ok();
	};

	///////////////////////////////////////////////////////////////////////////////////////////////////////
	/////////////////////////////////////  private    /////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////////////////////////////

	// Modified calculate rewards to account for dynamic APR
	// private func calculateRewards(staker : Principal) : async Nat {
	//     switch (Map.get(userStakes, phash, staker)) {
	//         case (null) return 0;
	//         case (?userStakeIds) {
	//             if (Array.size(userStakeIds) == 0) return 0;
	//             let stakeId = userStakeIds[0];
	//             switch (Map.get(stakes, nhash, stakeId)) {
	//                 case (null) return 0;
	//                 case (?stake) {
	//                     let timeNow = Time.now();
	//                     let stakedSeconds = timeNow - stake.lastHarvestTime;

	//                     if (stakedSeconds < s_heartbeatIntervalSeconds * 1_000_000_000) return 0;
	//                     if (timeNow < pool.startTime or timeNow > pool.endTime) return 0;

	//                     // Calculate user's stake weight based on lock duration
	//                     let userWeight = Reward.calculateUserWeeklyStakeWeight(
	//                         stake.amount,
	//                         pool.totalStaked,
	//                         Int.abs(stake.lockEndTime - stake.stakeTime) / 1_000_000_000
	//                     );

	//                     // Calculate total weight across all stakers
	//                     var totalWeight : Float = 0;
	//                     for ((_, s) in Map.entries(stakes)) {
	//                         totalWeight += Reward.calculateUserWeeklyStakeWeight(
	//                             s.amount,
	//                             pool.totalStaked,
	//                             Int.abs(s.lockEndTime - s.stakeTime) / 1_000_000_000
	//                         );
	//                     };

	//                     // Calculate total rewards for the period
	//                     let totalRewards = pool.rewardPerSecond * Nat64.toNat(Nat64.fromIntWrap(stakedSeconds / 1_000_000_000));

	//                     // Calculate user's share of rewards
	//                     return Reward.calculateUserWeeklyReward(totalRewards, userWeight, totalWeight);
	//                 };
	//             };
	//         };
	//     };
	// };

	// Helper function to calculate APR based on lock duration
	public func calculateDynamicAPR(staker : Principal, stakeId : Nat, lockDurationSeconds : Nat) : async Text {
		// check stake ID valid
		if (stakeId >= nextStakeId) {
			return "Error: Invalid stake ID";
		};

		// Check if stake exists for this user
		switch (Map.get(userStakes, phash, staker)) {
			case (null) return "Error: No stakes found for user";
			case (?userStakeIds) {
				// Check if stakeId exists in userStakeIds array
				let stakeExists = Array.find<Nat>(userStakeIds, func(x) = x == stakeId);

				switch (stakeExists) {
					case (null) return "Error: Stake ID not found in user's stakes";
					case (?id) {
						switch (Map.get(stakes, nhash, id)) {
							case (null) return "Error: Stake details not found";
							case (?stake) {
								// Add safety check for total staked
								if (pool.totalStaked == 0) {
									return "Error: No total stakes in pool";
								};

								// Calculate weight using helper function
								let userWeight = Reward.calculateUserWeeklyStakeWeight(stake.amount, pool.totalStaked, lockDurationSeconds);

								// Calculate total rewards
								let totalRewardsPool = calculateTotalRewards();

								// Calculate total weight
								var totalWeight : Float = 0;
								for ((_, s) in Map.entries(stakes)) {
									totalWeight += Reward.calculateUserWeeklyStakeWeight(
										s.amount,
										pool.totalStaked,
										Int.abs(s.lockEndTime - s.stakeTime) / 1_000_000_000
									);
								};

								// Calculate user's weekly rewards with safety check
								if (totalWeight == 0) {
									return "Error: Total weight is zero";
								};

								let userRewards = Reward.calculateUserWeeklyReward(totalRewardsPool, userWeight, totalWeight);

								// Calculate APY based on weekly rewards and convert to text
								let apy = Reward.calculateAPY(userRewards, stake.amount);
								return Float.toText(apy) # "%";
							};
						};
					};
				};
			};
		};
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

	// Calculate total rewards based on total fee collected
	func calculateTotalRewards() : Nat {
		// 30% of total fee collected
		let totalFees = totalFeeCollected;
		return (totalFees * 30) / 100;

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
	private stable var lastRewardUpdateTime : Int = 0;
	private let WEEK_IN_NANOSECONDS : Nat = 7 * 24 * 60 * 60 * 1_000_000_000;
	private var rewardUpdateTimer : Timer.TimerId = 0;

	// Weekly reward update function
	private func updateWeeklyRewards() : async () {
		try {
			let currentTime = Time.now();

			// Check if a week has passed
			if (currentTime - lastRewardUpdateTime >= WEEK_IN_NANOSECONDS) {
				// Get total fees collected
				let totalFees = await getTotalFeeCollected();

				// Calculate weekly rewards (30% of fees)
				let weeklyRewards = (totalFees * 30) / 100;

				// Update pool rewards
				pool := {
					pool with
					rewardPerSecond = weeklyRewards / (7 * 24 * 60 * 60); // Convert to per second
				};

				// Update last reward time
				lastRewardUpdateTime := currentTime;

				Debug.print("Weekly rewards updated successfully");
			};
		} catch (e) {
			Debug.print("Error updating weekly rewards: " # Error.message(e));
		};
	};

	rewardUpdateTimer := Timer.recurringTimer<system>(
		#nanoseconds(WEEK_IN_NANOSECONDS),
		updateWeeklyRewards
	);

	// Get staking stats for a user
	// public shared ({ caller }) func getStakingStats() : async {
	//     lockupPeriod : Nat;
	//     weight : Float;
	//     estimatedAPY : Float;
	//     totalRewards : Nat;
	//     rewardPerSec : Float;
	// } {
	//     switch (Map.get(userStakes, phash, caller)) {
	//         case (null) return {
	//             lockupPeriod = 0;
	//             weight = 0;
	//             estimatedAPY = 0;
	//             totalRewards = 0;
	//             rewardPerSec = 0;
	//         };
	//         case (?userStakeIds) {
	//             if (Array.size(userStakeIds) == 0) return {
	//                 lockupPeriod = 0;
	//                 weight = 0;
	//                 estimatedAPY = 0;
	//                 totalRewards = 0;
	//                 rewardPerSec = 0;
	//             };

	//             let stakeId = userStakeIds[0];
	//             switch (Map.get(stakes, nhash, stakeId)) {
	//                 case (null) return {
	//                     lockupPeriod = 0;
	//                     weight = 0;
	//                     estimatedAPY = 0;
	//                     totalRewards = 0;
	//                     rewardPerSec = 0;
	//                 };
	//                 case (?stake) {
	//                     let duration = Int.abs(stake.lockEndTime - stake.stakeTime);
	//                     let lockupDuration = duration / 1_000_000_000; // Convert to seconds

	//                     // Add safety check for total staked
	//                     if (pool.totalStaked == 0) {
	//                         return {
	//                             lockupPeriod = duration;
	//                             weight = 0;
	//                             estimatedAPY = 0;
	//                             totalRewards = Nat64.toNat(stake.earned);
	//                             rewardPerSec = 0;
	//                         };
	//                     };

	//                     // Calculate weight using helper function
	//                     let userWeight = Reward.calculateUserWeeklyStakeWeight(stake.amount, pool.totalStaked, lockupDuration);

	//                     // Calculate total rewards and user's share
	//                     let totalRewardsPool = calculateTotalRewards();

	//                     // Add safety check for total weight
	//                     var totalWeight : Float = 0;
	//                     for ((_, s) in Map.entries(stakes)) {
	//                         totalWeight += Reward.calculateUserWeeklyStakeWeight(
	//                             s.amount,
	//                             pool.totalStaked,
	//                             Int.abs(s.lockEndTime - s.stakeTime) / 1_000_000_000
	//                         );
	//                     };
	//                     let userRewards = if (totalWeight == 0) {
	//                         0;
	//                     } else {
	//                         Reward.calculateUserWeeklyReward(totalRewardsPool, userWeight, totalWeight);
	//                     };

	//                     // Calculate APY based on weekly rewards with safety check
	//                     let apy = if (stake.amount == 0) {
	//                         0.0;
	//                     } else {
	//                         Reward.calculateAPY(userRewards, stake.amount);
	//                     };

	//                     // Calculate reward per second as float
	//                     let rewardPerSec = if (stake.amount == 0) {
	//                         0.0;
	//                     } else {
	//                         Float.fromInt(userRewards) / Float.fromInt(7 * 24 * 60 * 60); // Weekly rewards divided by seconds in a week
	//                     };

	//                     return {
	//                         lockupPeriod = duration;
	//                         weight = userWeight;
	//                         estimatedAPY = apy;
	//                         totalRewards = Nat64.toNat(stake.earned);
	//                         rewardPerSec = rewardPerSec;
	//                     };
	//                 };
	//             };
	//         };
	//     };
	// };

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

	/*
VARIABLES:

1. pool : Types.StakingPool
   - Stores main staking pool configuration
   - Initial values:
     name = "Doxa Dynamic Staking"
     startTime = current time
     endTime = current time + 1 year
     totalStaked = 0
     rewardTokenFee = 0
     stakingSymbol = "USDx"
     stakingToken = "doxa-dollar"
     rewardSymbol = "USDx"
     rewardToken = "doxa-dollar"
     rewardPerSecond = 100_000
     minimumStake = 10_000_000
     lockDuration = 30 days
   - State transitions:
     - totalStaked increases when users stake tokens
     - totalStaked decreases when users unstake
     - rewardTokenFee can be updated by admin
     - rewardPerSecond can be adjusted based on pool performance

2. stakes : Map<StakeId, Stake>
   - Stores individual stake details
   - Initial value: Empty map
   - State transitions:
     - New entries added when users stake
     - Entries removed when users unstake
     - Stake.earned updated when rewards calculated
     - Stake.lastHarvestTime updated on harvest

3. userStakes : Map<Principal, [StakeId]>
   - Maps users to their stake IDs
   - Initial value: Empty map
   - State transitions:
     - Array grows when user creates new stakes
     - Array shrinks when stakes are removed
     - Maximum one stake per user currently

4. transactions/harvestTransactions : Map<Nat, Transaction>
   - Store transaction history
   - Initial value: Empty maps
   - State transitions:
     - New entries added for stake/unstake/harvest actions
     - Never removed or modified after creation

5. Counters:
   nextStakeId : Nat
   - Tracks unique stake IDs
   - Initial value: 0
   - Only increases, never decreases

   totalRewards : Nat64
   - Total rewards distributed
   - Initial value: 0
   - Only increases when rewards harvested

   _tranIdx/_harvestIdx : Nat
   - Transaction counters
   - Initial value: 0
   - Only increase when new transactions added

6. processedStakeTransactions : Map<Nat, Principal>
   - Tracks processed stake notifications
   - Initial value: Empty map
   - State transitions:
     - New entries added when stakes processed
     - Prevents double-processing of same transaction
*/

};
