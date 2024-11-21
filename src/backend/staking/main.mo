/*
==============================================
DOXA STAKING CANISTER DOCUMENTATION
==============================================

This canister implements staking functionality for USDx tokens. Here's what it does:

1. STAKING:
   - Users can stake USDx tokens by sending them to this canister
   - Minimum stake amount: 100 USDx (100_000_000 with decimals)
   - Lock period: 6 months
   Example:
   - Send 100 USDx to canister
   - Call notifyStake() to register stake

2. REWARDS:
   - Users earn USDx rewards based on stake amount and time
   - Rewards calculated as: (staked * rewardRate * time) / totalStaked
   - Rewards distributed per second (configurable)
   Example:
   - If rewardPerSecond = 100_000
   - User with 10% of total stake gets 10% of rewards

3. HARVESTING:
   - Users can harvest earned rewards anytime
   - Minimum harvest amount enforced
   Example:
   - Call harvest() to claim rewards
   - Rewards sent directly to user's wallet

4. UNSTAKING:
   - Users can unstake after lock period ends
   - Final rewards are paid during unstake
   Example:
   - Call unstake() after 6 months
   - Get back staked amount + final rewards

5. ADMIN FUNCTIONS:
   - Emergency withdraw (admin only)
   - Update pool parameters (admin only)
   Example:
   - Admin can update rewardPerSecond, minimumStake, lockDuration
   - Admin can withdraw all funds in emergency

6. VIEW FUNCTIONS:
   - getPoolStats(): Get overall pool statistics
   - getStakeDetails(): Get user's stake info
   - getUserTransactions(): Get user's transaction history
   Example:
   - Call getPoolStats() to see APR, total staked etc
   - Call getStakeDetails() to see your stake amount and rewards

IMPORTANT VARIABLES:
- USDx Token: irorr-5aaaa-aaaak-qddsq-cai
- Admin: 5g24m-kxyrd-yb7wl-up5k6-4egww-miul7-gajat-e2d7i-mdpc7-6dduf-eae
- Lock Duration: 6 months (15_552_000 seconds)
- Minimum Stake: 100 USDx
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
import Float "mo:base/Float";
import Types "types";
import U "../Utils";
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
					};
				}];
			};
			#Err : Text;
		};
	} = actor ("br5f7-7uaaa-aaaaa-qaaca-cai");
	// Lock duration constants
	private let MIN_LOCK_DURATION : Nat = 2_592_000; // 30 days minimum
	private let MAX_LOCK_DURATION : Nat = 31_536_000; // 365 days maximum
	private let ONE_YEAR : Nat = 31_536_000; // For APR calculation

	// Pool configuration
	private var pool : Types.StakingPool = {
		name = "Doxa Dynamic Staking";
		startTime = Time.now();
		endTime = Time.now() + ONE_YEAR;
		totalStaked = 0;
		rewardTokenFee = 0;
		stakingSymbol = "USDx";
		stakingToken = "doxa-dollar";
		rewardSymbol = "USDx";
		rewardToken = "doxa-dollar";
		rewardPerSecond = 100_000; // Base reward rate
		minimumStake = 10_000_000; // 10 tokens with 6 decimals
		lockDuration = MIN_LOCK_DURATION; // Default minimum duration
	};

	// Storage
	private var stakes = HashMap.HashMap<Principal, Types.Stake>(10, Principal.equal, Principal.hash);
	private var transactions = HashMap.HashMap<Nat, Types.Transaction>(10, Nat.equal, func(n : Nat) : Nat32 { Nat32.fromNat(n) });
	private var harvestTransactions = HashMap.HashMap<Nat, Types.Transaction>(10, Nat.equal, func(n : Nat) : Nat32 { Nat32.fromNat(n) });

	// Counters
	private stable var transactionCount : Nat = 0;
	private stable var totalRewards : Nat64 = 0;
	private stable var _tranIdx : Nat = 0;
	private stable var _harvestIdx : Nat = 0;
	private let s_heartbeatIntervalSeconds : Nat = 3600;

	private let { nhash } = Map;
	private stable let processedStakeTransactions = Map.new<Nat, Principal>();

	type Tokens = {
		#USDx;
	};

	// Helper function to calculate APR based on lock duration
	private func calculateDynamicAPR(lockDurationSeconds : Nat) : Nat {
		// Base APR is 10%
		let baseAPR = 10;

		// Additional APR based on lock duration (up to 20% more)
		let durationBonus = (lockDurationSeconds * 20) / MAX_LOCK_DURATION;

		baseAPR + durationBonus;
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

	// Modified stake notification to handle dynamic periods
	public shared ({ caller }) func notifyStake(blockIndex : Nat, lockDuration : Nat) : async Result.Result<(), Text> {
		// Check if caller already has an existing stake
		switch (stakes.get(caller)) {
			case (?existingStake) {
				return #err("You already have an existing stake. Please use addStake() to increase your stake amount");
			};
			case (null) {};
		};

		// Validate lock duration
		if (lockDuration < MIN_LOCK_DURATION) {
			return #err("Lock duration must be at least 30 days");
		};
		if (lockDuration > MAX_LOCK_DURATION) {
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
		switch (await validateStakingBlock(blockIndex, caller)) {
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

		// Calculate estimated APY based on lock duration
		let estimatedAPY = calculateDynamicAPR(lockDuration);

		// Calculate weight based on lock duration
		let weight : Float = Float.fromInt(lockDuration) / Float.fromInt(MAX_LOCK_DURATION);

		// Create initial stake record with custom lock duration
		let stake : Types.Stake = {
			staker = transfer.from.owner;
			amount = transfer.amount;
			stakeTime = Time.now();
			lockEndTime = Time.now() + lockDuration * 1_000_000_000;
			lastHarvestTime = Time.now();
			earned = 0;
			weight = weight;
			estimatedAPY = Float.fromInt(estimatedAPY);
		};

		stakes.put(transfer.from.owner, stake);
		var totalStaked = pool.totalStaked + transfer.amount;
		pool := {
			pool with
			totalStaked = totalStaked;
			totalRewards = totalRewards + stake.earned;
			estimatedAPY = Float.fromInt(estimatedAPY);
			weight = weight;
			lockupPeriod = lockDuration * 1_000_000_000;
		};

		Map.set(processedStakeTransactions, nhash, blockIndex, transfer.from.owner);

		#ok();
	};

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
		if (stakingAccount != transfer.to) {
			return #err(
				"Destination account (" # Principal.toText(transfer.to.owner) #
				") in the transaction is not the staking account (" #
				Principal.toText(stakingAccount.owner) # ")"
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

	// Modified calculate rewards to account for dynamic APR
	private func calculateRewards(staker : Principal) : async Nat {
		switch (stakes.get(staker)) {
			case (null) return 0;
			case (?stake) {
				let timeNow = Time.now();
				let stakedSeconds = timeNow - stake.lastHarvestTime;

				if (stakedSeconds < s_heartbeatIntervalSeconds * 1_000_000_000) return 0;
				if (timeNow < pool.startTime or timeNow > pool.endTime) return 0;

				// Calculate dynamic APR based on lock duration
				let lockDurationSeconds = Int.abs(stake.lockEndTime - stake.stakeTime) / 1_000_000_000;
				let dynamicAPR = calculateDynamicAPR(Int.abs(lockDurationSeconds));

				// Adjust reward rate based on dynamic APR
				let adjustedRewardRate = (pool.rewardPerSecond * dynamicAPR) / 100;

				let rewardPerToken = if (pool.totalStaked == 0) {
					0;
				} else {
					(adjustedRewardRate * Nat64.toNat(Nat64.fromIntWrap(stakedSeconds / 1_000_000_000))) / pool.totalStaked;
				};

				return stake.amount * rewardPerToken;
			};
		};
	};

	// Unstake function
	public shared ({ caller }) func unstake() : async Result.Result<(), Text> {
		switch (stakes.get(caller)) {
			case (null) return #err("No active stake found");
			case (?stake) {
				// Check lock period
				if (Time.now() < stake.lockEndTime) {
					return #err("Stake is still locked until " # Int.toText(stake.lockEndTime));
				};

				// Calculate final rewards before unstaking
				let finalRewards = await calculateRewards(caller);

				// Transfer staked tokens back
				let transferResult = await USDx.icrc1_transfer({
					to = { owner = caller; subaccount = null };
					amount = stake.amount;
					fee = null;
					memo = null;
					from_subaccount = null;
					created_at_time = ?Nat64.fromNat(Int.abs(Time.now()));
				});

				switch (transferResult) {
					case (#Err(e)) return #err("Failed to transfer staked tokens back");
					case (#Ok(_)) {
						// Transfer rewards if any
						if (finalRewards > 0) {
							ignore await harvest();
						};

						// Remove stake
						stakes.delete(caller);
						var totalStaked = pool.totalStaked - stake.amount;
						pool := { pool with totalStaked = totalStaked };

						// Record transaction
						transactions.put(
							_tranIdx,
							{
								from = Principal.fromActor(this);
								to = caller;
								amount = stake.amount;
								method = "Unstake";
								time = Time.now();
							}
						);
						_tranIdx += 1;

						#ok();
					};
				};
			};
		};
	};

	// Harvest function
	public shared ({ caller }) func harvest() : async Result.Result<(), Text> {
		switch (stakes.get(caller)) {
			case (null) return #err("No active stake found");
			case (?stake) {
				let rewards = await calculateRewards(caller);

				if (rewards < pool.minimumStake) {
					return #err("Rewards below minimum harvest amount");
				};

				// Transfer rewards
				let transferResult = await USDx.icrc1_transfer({
					to = { owner = caller; subaccount = null };
					amount = rewards;
					fee = null;
					memo = null;
					from_subaccount = null;
					created_at_time = ?Nat64.fromNat(Int.abs(Time.now()));
				});

				switch (transferResult) {
					case (#Err(e)) return #err("Failed to transfer rewards");
					case (#Ok(_)) {
						// Update stake record
						stakes.put(
							caller,
							{
								staker = stake.staker;
								amount = stake.amount;
								stakeTime = stake.stakeTime;
								lockEndTime = stake.lockEndTime;
								lastHarvestTime = Time.now();
								earned = 0;
							}
						);

						// Record transaction
						harvestTransactions.put(
							_harvestIdx,
							{
								from = Principal.fromActor(this);
								to = caller;
								amount = rewards;
								method = "Harvest";
								time = Time.now();
							}
						);
						_harvestIdx += 1;

						#ok();
					};
				};
			};
		};
	};

	// Modified getPoolStats to include dynamic APR
	public shared ({ caller }) func getPoolStats() : async Types.PoolStats {
		var userStake : Nat = 0;
		var userEarned : Nat64 = 0;
		var dynamicAPR : Nat = 0;

		switch (stakes.get(caller)) {
			case (?stake) {
				userStake := stake.amount;
				userEarned := Nat64.fromNat(await calculateRewards(caller));
				let lockDurationSeconds = Int.abs(stake.lockEndTime - stake.stakeTime) / 1_000_000_000;
				dynamicAPR := calculateDynamicAPR(Int.abs(lockDurationSeconds));
			};
			case (null) {};
		};

		{
			totalStaked = pool.totalStaked;
			totalStakers = stakes.size();
			totalRewarded = totalRewards;
			apr = dynamicAPR;
			userStake = userStake;
			userEarned = userEarned;
			minimumStake = pool.minimumStake;
			lockDuration = pool.lockDuration;
		};
	};

	// Add stake to existing position
	public shared ({ caller }) func addStake(blockIndex : Nat) : async Result.Result<(), Text> {
		// Check if transaction already processed
		switch (Map.get(processedStakeTransactions, nhash, blockIndex)) {
			case (?existingCaller) {
				return #err("Transaction already processed for caller: " # Principal.toText(existingCaller));
			};
			case (null) {};
		};

		// Validate staking block
		switch (await validateStakingBlock(blockIndex, caller)) {
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

		// Get existing stake
		switch (stakes.get(caller)) {
			case (?existingStake) {
				// Calculate current rewards before updating stake
				let currentRewards = await calculateRewards(caller);

				// Calculate lock duration and APY
				let lockDurationSeconds = Int.abs(existingStake.lockEndTime - existingStake.stakeTime) / 1_000_000_000;
				let estimatedAPY = calculateDynamicAPR(Int.abs(lockDurationSeconds));

				// Update stake amount and rewards
				let updatedStake : Types.Stake = {
					staker = existingStake.staker;
					amount = existingStake.amount + transfer.amount;
					stakeTime = existingStake.stakeTime;
					lockEndTime = existingStake.lockEndTime;
					lastHarvestTime = existingStake.lastHarvestTime;
					earned = existingStake.earned + Nat64.fromNat(currentRewards);
				};

				stakes.put(caller, updatedStake);
				pool := {
					pool with
					totalStaked = pool.totalStaked + transfer.amount;
					apr = estimatedAPY;
				};

				Map.set(processedStakeTransactions, nhash, blockIndex, caller);
				#ok();
			};
			case (null) {
				#err("No existing stake found. Please use notifyStake() first");
			};
		};
	};

	// Update lock duration for existing stake
	public shared ({ caller }) func updateLockDuration(newDuration : Nat) : async Result.Result<(), Text> {
		if (newDuration < MIN_LOCK_DURATION) {
			return #err("Lock duration must be at least 30 days");
		};
		if (newDuration > MAX_LOCK_DURATION) {
			return #err("Lock duration cannot exceed 365 days");
		};

		switch (stakes.get(caller)) {
			case (?existingStake) {
				let currentTime = Time.now();
				let newLockEndTime = currentTime + newDuration * 1_000_000_000;

				if (newLockEndTime <= existingStake.lockEndTime) {
					return #err("New lock duration must be longer than current duration");
				};

				let updatedStake : Types.Stake = {
					staker = existingStake.staker;
					amount = existingStake.amount;
					stakeTime = existingStake.stakeTime;
					lockEndTime = newLockEndTime;
					lastHarvestTime = existingStake.lastHarvestTime;
					earned = existingStake.earned;
				};

				stakes.put(caller, updatedStake);
				#ok();
			};
			case (null) {
				#err("No existing stake found");
			};
		};
	};

	// Get user stake details
	public shared query ({ caller }) func getStakeDetails() : async ?Types.Stake {
		stakes.get(caller);
	};

	// Get all transactions for a user
	public shared query ({ caller }) func getUserTransactions() : async [Types.Transaction] {
		let buffer = Buffer.Buffer<Types.Transaction>(transactions.size());
		for ((_, txn) in transactions.entries()) {
			if (txn.to == caller or txn.from == caller) {
				buffer.add(txn);
			};
		};
		Buffer.toArray(buffer);
	};

	// Admin Functions
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
				stakes := HashMap.HashMap<Principal, Types.Stake>(10, Principal.equal, Principal.hash);
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

	// Lockup period constants in seconds
	private let LOCKUP_90_DAYS : Nat = 7_776_000; // 90 days
	private let LOCKUP_180_DAYS : Nat = 15_552_000; // 180 days
	private let LOCKUP_270_DAYS : Nat = 23_328_000; // 270 days
	private let LOCKUP_360_DAYS : Nat = 31_104_000; // 360 days

	// Weight factors for different lockup periods
	private func getLockupWeight(duration : Nat) : Nat {
		if (duration >= LOCKUP_360_DAYS) return 4;
		if (duration >= LOCKUP_270_DAYS) return 3;
		if (duration >= LOCKUP_180_DAYS) return 2;
		return 1; // Default for 90 days
	};

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

	// Get total fee collected from fee collector transactions
	public func getTotalFeeCollected() : async Nat {
		let feeCollectorId = Principal.fromText("ieja4-4iaaa-aaaak-qddra-cai");

		// Get transactions from USDx index
		let result = await USDxIndex.get_account_transactions({
			max_results = 100;
			start = ?lastProcessedTxId;
			account = {
				owner = feeCollectorId;
				subaccount = null;
			};
		});

		switch (result) {
			case (#Ok(data)) {
				// Process new transactions
				for (tx in data.transactions.vals()) {
					switch (tx.transaction.burn) {
						case (?burn) {
							// Add burn amount to total fee
							totalFeeCollected += burn.amount;
						};
						case (null) {};
					};
					lastProcessedTxId := tx.id;
				};

				// Verify burned amount matches total fee collected minus current balance
				let currentBalance = await getFeeCollectorBalance();
				let burnedAmount = Nat.sub(totalFeeCollected, currentBalance);
				assert (burnedAmount >= 0); // Sanity check

				return totalFeeCollected;
			};
			case (#Err(_)) {
				// Return existing total on error
				return totalFeeCollected;
			};
		};
	};

	// Calculate total rewards based on total fee collected
	private func calculateTotalRewards() : Nat {
		// 30% of total fee collected
		return (totalFeeCollected * 30) / 100;
	};

	// Calculate user's stake weight
	private func calculateUserStakeWeight(userStake : Nat, totalStaked : Nat, lockupDuration : Nat) : Float {
		let proportion : Float = Float.fromInt(userStake) / Float.fromInt(totalStaked);
		let weight = Float.fromInt(getLockupWeight(lockupDuration));
		return proportion * weight;
	};

	// Calculate user's reward share
	private func calculateUserReward(totalRewards : Nat, userWeight : Float, totalWeight : Float) : Nat {
		let rewardShare = Float.fromInt(totalRewards) * (userWeight / totalWeight);
		return Int.abs(Float.toInt(rewardShare));
	};

	// Calculate APY for a user
	private func calculateAPY(weeklyReward : Nat, stakedAmount : Nat) : Float {
		let weeklyRate = Float.fromInt(weeklyReward) / Float.fromInt(stakedAmount);
		// (1 + weekly_rate)^52 - 1
		let annualRate = Float.pow(1.0 + weeklyRate, 52.0) - 1.0;
		return annualRate * 100.0; // Convert to percentage
	};

	// Get staking stats for a user
	public shared ({ caller }) func getStakingStats() : async {
		lockupPeriod : Nat;
		weight : Float;
		estimatedAPY : Float;
		totalRewards : Nat;
	} {
		switch (stakes.get(caller)) {
			case (null) return {
				lockupPeriod = 0;
				weight = 0;
				estimatedAPY = 0;
				totalRewards = 0;
			};
			case (?stake) {
				let duration = Int.abs(stake.lockEndTime - stake.stakeTime); // Convert Int to Nat using Int.abs
				let weight = calculateUserStakeWeight(stake.amount, pool.totalStaked, duration);
				let weeklyReward = stake.earned / 52; // Simplified weekly reward calc
				let apy = calculateAPY(Nat64.toNat(weeklyReward), stake.amount);

				return {
					lockupPeriod = duration;
					weight = weight;
					estimatedAPY = apy;
					totalRewards = Nat64.toNat(stake.earned);
				};
			};
		};
	};
};
