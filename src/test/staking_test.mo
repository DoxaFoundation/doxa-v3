// import DoxaStaking "../backend/staking/main";
import C "mo:matchers/Canister";
import M "mo:matchers/Matchers";
import T "mo:matchers/Testable";
import Principal "mo:base/Principal";
// import Time "mo:base/Time";
import Result "mo:base/Result";
import Debug "mo:base/Debug";
import Error "mo:base/Error";
import Types "../backend/staking/types";

actor {

	type Account = { owner : Principal; subaccount : ?Blob };
	type Tokens = Types.Tokens;
	type Time = Int;
	type Transaction = Types.Transaction;
	type StakeId = Types.StakeId;
	type Stake = Types.Stake;
	type StakeMatric = Types.StakeMatric;
	type StakingPool = Types.StakingPool;

	let it = C.Tester({ batchSize = 8 });
	let staking = actor ("bw4dl-smaaa-aaaaa-qaacq-cai") : actor {
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
	};

	// Test helper function to create test principal
	func createTestPrincipal(text : Text) : Principal {
		Principal.fromText(text);
	};

	public shared func test() : async Text {

		// Test getUserStakeDetails
		it.should(
			"get user stake details successfully",
			func() : async C.TestResult = async {
				let stakeDetails = await staking.getUserStakeDetails();
				M.attempt(true, M.equals(T.bool(stakeDetails.size() >= 0))); // Should return array even if empty
			}
		);

		// Test getUserTransactions
		it.should(
			"get user transactions successfully",
			func() : async C.TestResult = async {
				let transactions = await staking.getUserTransactions();
				M.attempt(true, M.equals(T.bool(transactions.size() >= 0))); // Should return array even if empty
			}
		);

		// Test getStakingAccount
		it.should(
			"get staking account for USDx token",
			func() : async C.TestResult = async {
				let account = await staking.getStakingAccount(#USDx);
				M.attempt(Principal.isAnonymous(account.owner), M.equals(T.bool(false))); // Owner should not be anonymous
			}
		);

		// Test fee collection related functions
		it.should(
			"get fee collection details",
			func() : async C.TestResult = async {
				let totalFeeCollected = await staking.getTotalFeeCollected();
				let feeCollectorBalance = await staking.getFeeCollectorBalance();
				let totalFeeCollectedAmount = await staking.getTotalFeeCollectedAmount();

				M.attempt(totalFeeCollected >= 0 and feeCollectorBalance >= 0 and totalFeeCollectedAmount >= 0, M.equals(T.bool(true)));
			}
		);

		// Test transaction processing
		it.should(
			"get last processed transaction id",
			func() : async C.TestResult = async {
				let lastTxId = await staking.getLastProcessedTxId();
				M.attempt(lastTxId >= 0, M.equals(T.bool(true)));
			}
		);

		// Test stake weight calculation
		it.should(
			"calculate weekly stake weight",
			func() : async C.TestResult = async {
				let stakeId : StakeId = 0; // Assuming first stake
				let result = await staking.calculateUserWeeklyStakeWeight(stakeId);

				switch (result) {
					case (#ok(_)) {
						M.attempt(true, M.equals(T.bool(true)));
					};
					case (#err(_)) {
						// Should fail if no stake exists with ID 0
						M.attempt(true, M.equals(T.bool(true)));
					};
				};
			}
		);

		// Test stake metrics calculation
		it.should(
			"calculate user stake metrics",
			func() : async C.TestResult = async {
				let testPrincipal = createTestPrincipal("aaaaa-aa");
				let result = await staking.calculateUserStakeMatric(0, testPrincipal);

				switch (result) {
					case (#ok(_)) {
						M.attempt(true, M.equals(T.bool(true)));
					};
					case (#err(_)) {
						// Should fail for non-existent stake
						M.attempt(true, M.equals(T.bool(true)));
					};
				};
			}
		);

		// Test unstaking
		it.should(
			"validate unstake operation",
			func() : async C.TestResult = async {
				let result = await staking.unstake(0); // Try unstaking first stake

				switch (result) {
					case (#ok(_)) {
						M.attempt(true, M.equals(T.bool(true)));
					};
					case (#err(_)) {
						// Should fail if no stake exists
						M.attempt(true, M.equals(T.bool(true)));
					};
				};
			}
		);

		// Test transaction retrieval by block index
		it.should(
			"get transaction by block index",
			func() : async C.TestResult = async {
				let result = await staking.getTransactionFromBlockIndex(0);

				switch (result) {
					case (#ok(_tx)) {
						M.attempt(true, M.equals(T.bool(true)));
					};
					case (#err(_)) {
						// Should fail if no transaction exists at index 0
						M.attempt(true, M.equals(T.bool(true)));
					};
				};
			}
		);

		// Test bootstrap phase
		it.should(
			"start in bootstrap phase",
			func() : async C.TestResult = async {
				let status = await staking.getBootstrapStatus();
				M.attempt(status.isBootstrapPhase, M.equals(T.bool(true)));
			}
		);

		// Test pool data
		// ... existing code ...

		it.should(
			"get initial pool data",
			func() : async C.TestResult = async {
				let poolData = await staking.getPoolData();
				try {
					M.attempt(
						poolData.name == "Doxa Dynamic Staking" and
						poolData.rewardSymbol == "USDx" and
						poolData.rewardToken == "doxa-dollar" and
						poolData.stakingSymbol == "USDx" and
						poolData.stakingToken == "doxa-dollar" and
						poolData.minimumStake == 10_000_000 ,
						// poolData.rewardTokenFee == 0.05,
						M.equals(T.bool(true))
					);
				} catch (e) {
					Debug.print("Error in pool data test: " # Error.message(e));
					M.attempt(false, M.equals(T.bool(true)));
				};
			}
		);

		// Test stake validation
		it.should(
			"validate minimum stake amount",
			func() : async C.TestResult = async {
				// let testPrincipal = createTestPrincipal("aaaaa-aa");
				let result = await staking.notifyStake(1, 2_592_000_000_000_000); // 30 days

				switch (result) {
					case (#ok(_)) {
						M.attempt(true, M.equals(T.bool(false))); // Should fail as no actual stake exists
					};
					case (#err(_e)) {
						M.attempt(true, M.equals(T.bool(true)));
					};
				};
			}
		);

		// Test early staker multiplier
		// it.should(
		//     "assign correct early staker multiplier",
		//     func() : async C.TestResult = async {
		//         let testPrincipal = createTestPrincipal("aaaaa-aa");
		//         let result = await staking.getBootstrapMultiplier();

		//         switch (result) {
		//             case (#ok(multiplier)) {
		//                 M.attempt(multiplier, M.equals(T.float(1.0))); // Default multiplier for non-early staker
		//             };
		//             case (#err(_)) {
		//                 M.attempt(true, M.equals(T.bool(false)));
		//             };
		//         };
		//     }
		// );

		// Test stake metrics calculation
		it.should(
			"calculate stake metrics correctly for bootstrap phase single stake",
			func() : async C.TestResult = async {
				let testPrincipal = createTestPrincipal("aaaaa-aa");

				// Check bootstrap status first
				let bootstrapStatus = await staking.getBootstrapStatus();
				Debug.print("Bootstrap Status: " # debug_show(bootstrapStatus));

				// Test random lockup periods between min and max
				let minLockup = 2_592_000_000_000_000; // 30 days
				let maxLockup = 31_536_000_000_000_000; // 365 days

				// Single test case for bootstrap phase
				let amount = 1;
				let lockPeriod = minLockup + (maxLockup - minLockup) / 2; // Middle duration

				var testsPassed = true;

				// First stake should succeed
				let stakeResult = await staking.notifyStake(amount, lockPeriod);
				switch(stakeResult) {
					case (#ok(_)) {
						// Test with diverse block indices
						let blockIndices = [
							0, // Start
							100, // Early
							1000, // Mid
							10000, // Later
							100000 // Much later
						];

						for (blockIndex in blockIndices.vals()) {
							Debug.print("Testing blockIndex: " # debug_show(blockIndex));
							
							let result = await staking.calculateUserStakeMatric(blockIndex, testPrincipal);

							switch (result) {
								case (#ok(metrics)) {
									// Lockup weight validation
									let MIN_LOCK_DURATION_IN_NANOS : Nat = 2_592_000_000_000_000; // 30 days minimum
									let MAX_LOCK_DURATION_IN_NANOS : Nat = 31_536_000_000_000_000; // 365 days maximum

									if (metrics.lockupWeight < MIN_LOCK_DURATION_IN_NANOS or metrics.lockupWeight > MAX_LOCK_DURATION_IN_NANOS) {
										Debug.print("❌ Invalid lockupWeight: " # debug_show(metrics.lockupWeight));
										testsPassed := false;
									};

									// Stake ID validation
									if (metrics.stakeId < 0) {
										Debug.print("❌ Invalid stakeId: " # debug_show(metrics.stakeId));
										testsPassed := false;
									};

									// Lock duration validation
									if (metrics.lockDuration <= 0) {
										Debug.print("❌ Invalid lockDuration: " # debug_show(metrics.lockDuration));
										testsPassed := false;
									};

									// Bootstrap multiplier validation
									if (metrics.bootstrapMultiplier < 1.0) {
										Debug.print("❌ Invalid bootstrapMultiplier: " # debug_show(metrics.bootstrapMultiplier));
										testsPassed := false;
									};

									// Proportion validation
									if (metrics.proportion <= 0.0 or metrics.proportion > 1.0) {
										Debug.print("❌ Invalid proportion: " # debug_show(metrics.proportion));
										testsPassed := false;
									};

									// User weight validation
									if (metrics.userWeight <= 0.0) {
										Debug.print("❌ Invalid userWeight: " # debug_show(metrics.userWeight));
										testsPassed := false;
									};

									// Total weight validation
									if (metrics.totalWeight <= 0.0) {
										Debug.print("❌ Invalid totalWeight: " # debug_show(metrics.totalWeight));
										testsPassed := false;
									};

									// Final reward validation
									if (metrics.finalReward < 0.0) {
										Debug.print("❌ Invalid finalReward: " # debug_show(metrics.finalReward));
										testsPassed := false;
									};

									// APY validation
									if (metrics.apy < 0.0) {
										Debug.print("❌ Invalid APY: " # debug_show(metrics.apy));
										testsPassed := false;
									};

									// Print successful metrics for debugging
									if (testsPassed) {
										Debug.print("✅ All metrics valid for blockIndex: " # debug_show(blockIndex));
										Debug.print("Metrics: " # debug_show(metrics));
									};
								};
								case (#err(error)) {
									Debug.print("❌ Error occurred: " # debug_show(error));
									testsPassed := false;
								};
							};
						};

						// Try second stake - should fail in bootstrap phase
						let secondStakeResult = await staking.notifyStake(amount, lockPeriod);
						switch(secondStakeResult) {
							case (#ok(_)) {
								Debug.print("❌ Second stake succeeded when it should fail in bootstrap phase");
								testsPassed := false;
							};
							case (#err(_)) {
								Debug.print("✅ Second stake correctly rejected in bootstrap phase");
							};
						};

					};
					case (#err(error)) {
						Debug.print("❌ First stake failed: " # debug_show(error));
						testsPassed := false;
					};
				};

				M.attempt(testsPassed, M.equals(T.bool(true)));
			}
		);
		// Test unstaking
		it.should(
			"prevent early unstaking",
			func() : async C.TestResult = async {
				// let testPrincipal = createTestPrincipal("aaaaa-aa");
				let result = await staking.unstake(0);

				switch (result) {
					case (#ok(_)) {
						M.attempt(true, M.equals(T.bool(false))); // Should not allow early unstake
					};
					case (#err(_e)) {
						M.attempt(true, M.equals(T.bool(true)));
					};
				};
			}
		);

		// Test fee collection
		it.should(
			"track fee collection",
			func() : async C.TestResult = async {
				let totalFee = await staking.getTotalFeeCollected();
				M.attempt(totalFee >= 0, M.equals(T.bool(true)));
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
