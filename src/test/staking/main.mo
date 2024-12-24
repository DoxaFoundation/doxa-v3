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
	type StakeMatric = Types.StakeMatric;
	type StakingPool = Types.StakingPool;

	let { amount; stakePeriod } = init;

	let it = C.Tester({ batchSize = 8 });
	let staking = actor ("mhahe-xqaaa-aaaag-qndha-cai") : actor {
		getBootstrapStatus : shared () -> async { isBootstrapPhase : Bool; timeRemaining : Int };
		getPoolData : shared () -> async StakingPool;
		notifyStake : shared (amount : Nat, lockupPeriod : Nat) -> async Result.Result<(), Text>;
		getBootstrapMultiplier : shared () -> async Result.Result<Nat, Text>;
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
		calculateUserWeeklyStakeWeight : shared (StakeId) -> async Result.Result<Nat, Text>;
		iterateAllStakes : shared () -> async [(Text, StakeMatric)];
		getStakeMetrics : shared (StakeId) -> async [(Text, StakeMatric)];
	};

	// Public functions to check stake status
	public shared func getStakeDetails() : async [Stake] {
		await staking.getUserStakeDetails();
	};

	public shared func getPoolInfo() : async StakingPool {
		await staking.getPoolData();
	};

	public shared func getBootstrapInfo() : async { isBootstrapPhase : Bool; timeRemaining : Int } {
		await staking.getBootstrapStatus();
	};

	public shared func getStakeMetric() : async Result.Result<[StakeMatric], Text> {
		let stakeDetails = await getStakeDetails();

		let buffer = Buffer.Buffer<StakeMatric>(0);

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

	public shared func getFees() : async Nat {
		await staking.getTotalFeeCollected();
	};

	public shared func getWeeklyWeight(stakeId : StakeId) : async Result.Result<Nat, Text> {
		await staking.calculateUserWeeklyStakeWeight(stakeId);
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
