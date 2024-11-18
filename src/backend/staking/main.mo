import HashMap "mo:base/HashMap";
import Principal "mo:base/Principal";
import Time "mo:base/Time";
import Nat "mo:base/Nat";
import Nat64 "mo:base/Nat64";
import Result "mo:base/Result";
import Nat32 "mo:base/Nat32";
import Int "mo:base/Int";
import Types "types";
import Icrc "icrc-interface"; // ICRC token interface
import Map "mo:map/Map";

actor class DoxaStaking() = this {
	// Token interfaces
	private let USDx : Icrc.Self = actor ("irorr-5aaaa-aaaak-qddsq-cai"); // USDx token canister

	// Pool configuration
	private var pool : Types.StakingPool = {
		name = "Doxa Staking";
		startTime = Time.now();
		endTime = Time.now() + 31_536_000_000_000_000; // 1 year
		totalStaked = 0;
		rewardTokenFee = 0;
		stakingSymbol = "USDx";
		stakingToken = "doxa-dollar";
		rewardSymbol = "USDx"; // Same as staking symbol
		rewardToken = "doxa-dollar"; // Same as staking token
		rewardPerSecond = 100_000; // Adjust based on tokenomics
		minimumStake = 100_000_000; // 100 tokens with 6 decimals
		lockDuration = 15_780_000; // 6 months in seconds
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
	private let s_heartbeatIntervalSeconds : Nat = 3600; // 1 hour

	// For tracking processed stake transactions
	private let { nhash } = Map;
	private stable let processedStakeTransactions = Map.new<Nat, Principal>();

	// Stake tokens
	type Tokens = {
		#USDx;
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

	public shared ({ caller }) func notifyStake(blockIndex : Nat) : async Result.Result<(), Text> {
		// Check if transaction already processed
		switch (Map.get(processedStakeTransactions, nhash, blockIndex)) {
			case (?existingCaller) {
				return #err("Transaction already processed for caller: " # Principal.toText(existingCaller));
			};
			case (null) {};
		};

		// Get transaction details
		let getTransactionsResponse = await USDx.get_transactions({ start = blockIndex; length = 1 });
		let { transactions; log_length } = getTransactionsResponse;

		if (blockIndex >= log_length) {
			return #err("Invalid block index");
		};

		let transaction = transactions[0];

		// Verify transaction type
		let transfer = switch (transaction.transfer) {
			case (?value) { value };
			case (null) {
				return #err("Transaction must be a transfer");
			};
		};

		// Verify destination is staking contract
		let stakingAccount = getStakingAccount(#USDx);
		if (stakingAccount != transfer.to) {
			return #err("Transfer must be to staking contract");
		};

		// Verify amount meets minimum
		if (transfer.amount < pool.minimumStake) {
			return #err("Amount below minimum stake");
		};

		// Create stake record
		let stake : Types.Stake = {
			staker = transfer.from.owner;
			amount = transfer.amount;
			stakeTime = Time.now();
			lockEndTime = Time.now() + pool.lockDuration * 1_000_000_000;
			lastHarvestTime = Time.now();
			earned = 0;
		};

		stakes.put(transfer.from.owner, stake);
		var totalStaked = pool.totalStaked + transfer.amount;
		pool := { pool with totalStaked = totalStaked };

		// Record processed transaction
		Map.set(processedStakeTransactions, nhash, blockIndex, transfer.from.owner);

		#ok();
	};


	// More functions to implement:
	// - unstake()
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

	private func calculateRewards(staker : Principal) : async Nat {
		switch (stakes.get(staker)) {
			case (null) return 0;
			case (?stake) {
				let timeNow = Time.now();
				let stakedSeconds = timeNow - stake.lastHarvestTime;

				// Only calculate if minimum time has passed
				if (stakedSeconds < s_heartbeatIntervalSeconds * 1_000_000_000) return 0;

				// Check pool active time
				if (timeNow < pool.startTime or timeNow > pool.endTime) return 0;

				// Calculate rewards: (staked amount * reward rate * time) / total staked
				let rewardPerToken = if (pool.totalStaked == 0) {
					0;
				} else {
					(pool.rewardPerSecond * Nat64.toNat(Nat64.fromIntWrap(stakedSeconds / 1_000_000_000))) / pool.totalStaked;
				};

				return stake.amount * rewardPerToken;
			};
		};
	};

	// - harvest()
	public shared ({ caller }) func harvest() : async Result.Result<(), Text> {
		switch (stakes.get(caller)) {
			case (null) return #err("No active stake found");
			case (?stake) {
				let rewards = await calculateRewards(caller);

				if (rewards < pool.minimumStake) {
					return #err("Rewards below minimum harvest amount");
				};

				// Transfer rewards using same token canister as staking
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
								earned = 0; // Reset earned after harvest
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

	// - getPoolStats()
	public shared ({ caller }) func getPoolStats() : async Types.PoolStats {
		var userStake : Nat = 0;
		var userEarned : Nat64 = 0;

		switch (stakes.get(caller)) {
			case (?stake) {
				userStake := stake.amount;
				userEarned := Nat64.fromNat(await calculateRewards(caller));
			};
			case (null) {};
		};

		{
			totalStaked = pool.totalStaked;
			totalStakers = stakes.size();
			totalRewarded = totalRewards;
			apr = calculateAPR();
			userStake = userStake;
			userEarned = userEarned;
			minimumStake = pool.minimumStake;
			lockDuration = pool.lockDuration;
		};
	};

	private func calculateAPR() : Nat {
		if (pool.totalStaked == 0) return 0;

		// APR = (rewards per year / total staked) * 100
		let rewardsPerYear = pool.rewardPerSecond * 31_536_000; // seconds in a year
		(rewardsPerYear * 100) / pool.totalStaked;
	};
};
