import Types "types";

import C "mo:motoko-matchers/Canister";
import M "mo:motoko-matchers/Matchers";
import T "mo:motoko-matchers/Testable";

import Principal "mo:base/Principal";
// import Time "mo:base/Time";
import Result "mo:base/Result";
import Debug "mo:base/Debug";
import Nat "mo:base/Nat";
import Int "mo:base/Int";
import Buffer "mo:base/Buffer";
import Icrc "../../backend/service/icrc-interface";

actor class TestStakingCanister(
	init : {
		amount : Nat;
		stakePeriod : Int;
	}
) = this {
	private let USDx : Icrc.Self = actor ("irorr-5aaaa-aaaak-qddsq-cai"); // USDx token canister

	type Account = { owner : Principal; subaccount : ?Blob };
	type Tokens = Types.Tokens;
	type Time = Int;
	type Transaction = Types.Transaction;
	type StakeId = Types.StakeId;
	type Stake = Types.Stake;
	type StakeMetrics = Types.StakeMetrics;
	type StakingPoolDetails = Types.StakingPoolDetails;

	let { amount; stakePeriod } = init;
	let it = C.Tester({ batchSize = 8 });
	let staking = actor ("mhahe-xqaaa-aaaag-qndha-cai") : actor {
		calculateAndTransferAutoCompounds : shared () -> async ();
		calculateUserStakeMatric : shared (StakeId, Principal) -> async Result.Result<StakeMetrics, Text>;
		manuallyCompoundRewards : shared (StakeId) -> async Result.Result<(), Text>;
		distributeWeeklyRewards : shared (Nat) -> async ();
		getBootstrapMultiplier : shared () -> async Result.Result<Nat, Text>;
		getBootstrapStatus : shared () -> async { isBootstrapPhase : Bool; timeRemaining : Int };
		getFeeCollectorBalance : shared () -> async Nat;
		getLastProcessedTxId : shared () -> async Nat;
		getPendingReward : shared (StakeId) -> async Result.Result<Nat, Text>;
		getPoolData : shared () -> async StakingPoolDetails;
		fetchRewardWalletBalance : shared () -> async Nat;
		getStakingCanisterAccount : shared (Tokens) -> async Account;
		getTotalFeeCollectedFromLastRewardDistribution : shared () -> async Nat;
		getTotalFeeCollectedSofar : shared () -> async Nat;
		getTotalWeight : shared () -> async Nat;
		fetchTransactionByBlockIndex : shared (Nat) -> async Result.Result<Transaction, Text>;
		getUserStakeDetails : shared () -> async [Stake];
		getUserStakeRewardStats : shared (StakeId) -> async Result.Result<{ pendingReward : Nat; lastHarvestTime : Time; isAutoCompound : Bool }, Text>;
		getUserTransactions : shared () -> async [Transaction];
		getWeightTable : shared () -> async [(Nat, Nat)];
		harvestReward : shared (StakeId) -> async Result.Result<(), Text>;
		initFetchTotalFeeCollected : shared () -> async ();
		isStakeAutoCompound : shared (StakeId) -> async Result.Result<Bool, Text>;
		notifyStake : shared (Nat, Nat) -> async Result.Result<(), Text>;
		previewWeightForDuration : shared (Nat) -> async Nat;
		toggleAutoCompound : shared (StakeId, Types.AutoCompoundAction) -> async Result.Result<Bool, Text>;
		transferRewardFromCKUSDCPool : shared (Nat) -> async ();
		triggerRewardDistributionForTesting : shared () -> async Result.Result<(), Text>;
		unstake : shared (StakeId) -> async Result.Result<(), Text>;
	};

	// Test distribute weekly rewards
	public shared func testDistributeWeeklyRewards(amount : Nat) : async () {
		Debug.print("📅 Testing weekly rewards distribution with amount " # debug_show(amount));
		await staking.distributeWeeklyRewards(amount);
		Debug.print("Weekly rewards distributed");
	};

	// Test transfer reward from CKUSD pool
	public shared func testTransferRewardFromCKUSDPool(amount : Nat) : async () {
		Debug.print("💸 Testing reward transfer from CKUSD pool: " # debug_show(amount));
		await staking.transferRewardFromCKUSDCPool(amount);
		Debug.print("Reward transfer completed");
	};

	// Test auto compound reward
	public shared func testAutoCompoundReward() : async () {
		Debug.print("🔄 Testing auto compound reward");
		await staking.calculateAndTransferAutoCompounds();
		Debug.print("Auto compound completed");
	};

	// Test compound reward manually
	public shared func testCompoundRewardManually(stakeId : StakeId) : async Result.Result<(), Text> {
		Debug.print("🔄 Testing manual compound for stake " # debug_show(stakeId));
		let result = await staking.manuallyCompoundRewards(stakeId);
		Debug.print("Manual compound result: " # debug_show(result));
		result;
	};

	// Test is stake auto compound
	public shared func testIsStakeAutoCompound(stakeId : StakeId) : async Result.Result<Bool, Text> {
		Debug.print("🔍 Checking if stake is auto-compounding: " # debug_show(stakeId));
		let result = await staking.isStakeAutoCompound(stakeId);
		Debug.print("Auto compound status: " # debug_show(result));
		result;
	};

	// Test toggle auto-compound
	public shared func testToggleAutoCompound(stakeId : StakeId, action : Types.AutoCompoundAction) : async Result.Result<Bool, Text> {
		Debug.print("🔄 Testing auto-compound toggle for stake " # debug_show(stakeId));
		let result = await staking.toggleAutoCompound(stakeId, action);
		Debug.print("Result: " # debug_show(result));
		result;
	};

	// Test harvest reward
	public shared func testHarvestReward(stakeId : StakeId) : async Result.Result<(), Text> {
		Debug.print("🌾 Testing reward harvest for stake " # debug_show(stakeId));
		let result = await staking.harvestReward(stakeId);
		Debug.print("Result: " # debug_show(result));
		result;
	};

	// Get pending reward
	public shared func testGetPendingReward(stakeId : StakeId) : async Result.Result<Nat, Text> {
		Debug.print("💰 Getting pending reward for stake " # debug_show(stakeId));
		let result = await staking.getPendingReward(stakeId);
		Debug.print("Pending reward: " # debug_show(result));
		result;
	};

	// Get stake reward stats
	public shared func testGetStakeRewardStats(stakeId : StakeId) : async Result.Result<{ pendingReward : Nat; lastHarvestTime : Time; isAutoCompound : Bool }, Text> {
		Debug.print("📊 Getting reward stats for stake " # debug_show(stakeId));
		let result = await staking.getUserStakeRewardStats(stakeId);
		Debug.print("Reward stats: " # debug_show(result));
		result;
	};

	// Get reward account balance
	public shared func testGetRewardBalance() : async Nat {
		Debug.print("💳 Getting reward account balance");
		let result = await staking.fetchRewardWalletBalance();
		Debug.print("Balance: " # debug_show(result));
		result;
	};

	// Public functions to check stake status
	public shared func getStakeDetails() : async [Stake] {
		await staking.getUserStakeDetails();
	};

	public shared func getPoolInfo() : async StakingPoolDetails {
		await staking.getPoolData();
	};

	public shared func getBootstrapInfo() : async { isBootstrapPhase : Bool; timeRemaining : Int } {
		await staking.getBootstrapStatus();
	};

	public shared func getStakeMetric() : async Result.Result<[StakeMetrics], Text> {
		let stakeDetails = await staking.getUserStakeDetails();

		Debug.print(debug_show ("stakeDetails", stakeDetails));

		let buffer = Buffer.Buffer<StakeMetrics>(0);

		for (stake in stakeDetails.vals()) {
			let { id; staker } = stake;

			switch (await staking.calculateUserStakeMatric(id, staker)) {
				case (#ok(stakeMetric)) { buffer.add(stakeMetric) };
				case (_) {};
			};

		};

		#ok(Buffer.toArray(buffer));
	};

	public shared func getTransactions() : async [Transaction] {
		await staking.getUserTransactions();
	};

	public shared func test() : async Text {
		// Test staking with initialized amount and period
		it.should(
			"stake tokens with specific amount and period",
			func() : async C.TestResult = async {
				Debug.print("🏦 Testing stake with amount: " # debug_show (amount) # " and period: " # debug_show (stakePeriod));

				// Transfer USDx to staking canister
				let transferResult = await USDx.icrc1_transfer({
					to = {
						owner = Principal.fromText("mhahe-xqaaa-aaaag-qndha-cai");
						subaccount = null;
					};
					amount = amount;
					fee = null;
					memo = null;
					from_subaccount = null;
					created_at_time = null;
				});

				switch (transferResult) {
					case (#Ok(blockIndex)) {
						Debug.print("✅ USDx transfer successful with block index: " # debug_show (blockIndex));

						// Call notifyStake with block index and stake period
						let stakePeriodNat = Int.abs(stakePeriod);
						let result = await staking.notifyStake(blockIndex, stakePeriodNat);

						switch (result) {
							case (#ok(_)) {
								Debug.print("✅ Staking notification successful!");
								M.attempt(true, M.equals(T.bool(true)));
							};

							case (#err(e)) {
								Debug.print("❌ Staking notification failed: " # e);
								M.attempt(false, M.equals(T.bool(true)));
							};
						};
					};

					case (#Err(e)) {
						Debug.print("❌ USDx transfer failed: " # debug_show (e));
						M.attempt(false, M.equals(T.bool(true)));
					};
				};
			}
		);

		// Run all tests
		await it.runAll();
	};

	// Helper function to simulate time passing
	public func advanceTime(seconds : Int) : async () {
		// Note: This is just a mock implementation
		// In real testing, you'd need IC's time-travel capabilities
		Debug.print("Advancing time by " # debug_show (seconds) # " seconds");
	};
};
