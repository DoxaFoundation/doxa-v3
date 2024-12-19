import Types "types";

import C "mo:motoko-matchers/Canister";
import M "mo:motoko-matchers/Matchers";
import T "mo:motoko-matchers/Testable";

import Principal "mo:base/Principal";
// import Time "mo:base/Time";
import Result "mo:base/Result";
import Debug "mo:base/Debug";
import Error "mo:base/Error";
import Float "mo:base/Float";
import Array "mo:base/Array";
import Nat "mo:base/Nat";
import Int "mo:base/Int";

// type InitArg = {
//   amount : Nat;
//   stakePeriod : Int;
// };

actor class TestStakingCanister(
	init : {
		amount : Nat;
		stakePeriod : Int;
	}
) = this {

	type Account = { owner : Principal; subaccount : ?Blob };
	type Tokens = Types.Tokens;
	type Time = Int;
	type Transaction = Types.Transaction;
	type StakeId = Types.StakeId;
	type Stake = Types.Stake;
	type StakeMatric = Types.StakeMatric;
	type StakingPool = Types.StakingPool;

	let { amount; stakePeriod } = init;

	let it = C.Tester({ batchSize = 8 });
	let staking = actor ("mhahe-xqaaa-aaaag-qndha-cai") : actor {
		getBootstrapStatus : shared () -> async { isBootstrapPhase : Bool; timeRemaining : Int };
		getPoolData : shared () -> async StakingPool;
		notifyStake : shared (amount : Nat, lockupPeriod : Nat) -> async Result.Result<(), Text>;
		getBootstrapMultiplier : shared () -> async Result.Result<Float, Text>;
		calculateUserStakeMatric : shared (stakeIndex : Nat, user : Principal) -> async Result.Result<StakeMatric, Text>;
		unstake : shared (stakeIndex : Nat) -> async Result.Result<(), Text>;
		getTotalFeeCollected : shared () -> async Nat;
		getFeeCollectorBalance : shared () -> async Nat;
		getLastProcessedTxId : shared () -> async Nat;
		getStakingAccount : shared (Tokens) -> async Account;
		getTotalFeeCollectedAmount : shared () -> async Nat;
		getTransactionFromBlockIndex : shared (Nat) -> async Result.Result<Transaction, Text>;
		getUserStakeDetails : shared () -> async [Stake];
		getUserTransactions : shared () -> async [Transaction];
		calculateUserWeeklyStakeWeight : shared (StakeId) -> async Result.Result<Float, Text>;
		iterateAllStakes : shared () -> async [(Text, StakeMatric)];
		getStakeMetrics : shared (StakeId) -> async [(Text, StakeMatric)];
	};

	// Test helper function to create test principal
	func createTestPrincipal(text : Text) : Principal {
		Principal.fromText(text);
	};

	public shared func test() : async Text {
		// Test staking with initialized amount and period
		it.should(
			"stake tokens with specific amount and period",
			func() : async C.TestResult = async {
				Debug.print("🏦 Testing stake with amount: " # debug_show (amount) # " and period: " # debug_show (stakePeriod));

				// First check if we have enough balance
				let amountNat = Int.abs(amount);
				let stakePeriodNat = Int.abs(stakePeriod);

				// Get last processed tx id to use as block index
				let blockIndex = await staking.getLastProcessedTxId();
				let result = await staking.notifyStake(blockIndex, stakePeriodNat);

				switch (result) {
					case (#ok(_)) {
						Debug.print("✅ Staking successful!");

						// Verify stake was created
						let userStakes = await staking.getUserStakeDetails();
						let foundStake = Array.find<Stake>(
							userStakes,
							func(stake) {
								stake.amount == amount and stake.lockEndTime == stakePeriod
							}
						);

						switch (foundStake) {
							case (?stake) {
								Debug.print("✅ Found matching stake in user stakes");
								M.attempt(true, M.equals(T.bool(true)));
							};
							case (null) {
								Debug.print("❌ Stake not found in user stakes");
								M.attempt(false, M.equals(T.bool(true)));
							};
						};
					};
					case (#err(e)) {
						Debug.print("❌ Staking failed: " # e);
						M.attempt(false, M.equals(T.bool(true)));
					};
				};
			}
		);

		// Verify stake metrics after staking
		it.should(
			"verify stake metrics after staking",
			func() : async C.TestResult = async {
				let userStakes = await staking.getUserStakeDetails();
				if (userStakes.size() == 0) {
					Debug.print("❌ No stakes found");
					return M.attempt(false, M.equals(T.bool(true)));
				};

				let latestStake = userStakes[userStakes.size() - 1];
				let selfPrincipal = Principal.fromActor(this); // Using a test principal

				let metrics = await staking.calculateUserStakeMatric(latestStake.id, selfPrincipal);

				switch (metrics) {
					case (#ok(metric)) {
						Debug.print("📊 Stake Metrics:");
						Debug.print("- APY: " # debug_show (metric.apy));
						Debug.print("- Weight: " # debug_show (metric.userWeight));
						Debug.print("- Proportion: " # debug_show (metric.proportion));
						M.attempt(true, M.equals(T.bool(true)));
					};
					case (#err(e)) {
						Debug.print("❌ Failed to get metrics: " # e);
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
