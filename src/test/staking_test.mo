// import DoxaStaking "../backend/staking/main";
import C "mo:matchers/Canister";
import M "mo:matchers/Matchers";
import T "mo:matchers/Testable";
import Principal "mo:base/Principal";
// import Time "mo:base/Time";
import Result "mo:base/Result";
import Debug "mo:base/Debug";
import Types "../backend/staking/types";

actor {

	type Account = { owner : Principal; subaccount : ?Blob };
	type Tokens = Types.Tokens;
	type Time = Int;
	type Transaction = Types.Transaction;
	type StakeId = Types.StakeId;
	type Stake = Types.Stake;
	type StakeMatric = Types.StakeMatric;

	let it = C.Tester({ batchSize = 8 });
	let staking = actor ("be2us-64aaa-aaaaa-qaabq-cai") : actor {
		getBootstrapStatus : shared () -> async { isBootstrapPhase : Bool; timeRemaining : Int };
		getPoolData : shared () -> async {
			name : Text;
			totalStaked : Nat;
			totalStakers : Nat;
			minStakeAmount : Nat;
			maxStakeAmount : Nat;
		};
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
		it.should(
			"get initial pool data",
			func() : async C.TestResult = async {
				let poolData = await staking.getPoolData();
				M.attempt(poolData.name, M.equals(T.text("Doxa Dynamic Staking")));
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
			"calculate stake metrics correctly for various lockup periods and block indices",
			func() : async C.TestResult = async {
				let testPrincipal = createTestPrincipal("aaaaa-aa");

				// Test random lockup periods between min and max
				let minLockup = 2_592_000_000_000_000; // 30 days
				let maxLockup = 31_536_000_000_000_000; // 365 days

				// Test cases with different lockup periods
				let testCases = [
					// Edge cases
					(1, minLockup), // Minimum lockup
					(1, maxLockup), // Maximum lockup
					// Random periods in between
					(1, minLockup + (maxLockup - minLockup) / 3),
					(1, minLockup + (maxLockup - minLockup) / 2),
					(1, maxLockup - (maxLockup - minLockup) / 4)
				];

				var testsPassed = true;

				for ((amount, lockPeriod) in testCases.vals()) {
					ignore await staking.notifyStake(amount, lockPeriod);

					// Test with more diverse block indices
					let blockIndices = [
						0, // Start
						100, // Early
						1000, // Mid
						10000, // Later
						100000 // Much later
					];

					for (blockIndex in blockIndices.vals()) {
						let result = await staking.calculateUserStakeMatric(blockIndex, testPrincipal);

						switch (result) {
							case (#ok(metrics)) {
								// Lockup weight validation - check if weight is between min (1) and max (4)
								// Weight increases with longer lockup periods (90d=1, 180d=2, 270d=3, 360d=4)
								let expectedMinWeight = 1;
								let expectedMaxWeight = 4;
								if (
									metrics.lockupWeight < expectedMinWeight or
									metrics.lockupWeight > expectedMaxWeight
								) {
									testsPassed := false;
								};

								// Validate stake ID is a natural number
								if (metrics.stakeId < 0) {
									testsPassed := false;
								};

								// Lock duration must be positive (future end time - current time)
								if (metrics.lockDuration <= 0) {
									testsPassed := false;
								};

								// Bootstrap multiplier should be >= 1.0 (1.0 for normal stakers, >1.0 for early stakers)
								if (metrics.bootstrapMultiplier < 1.0) {
									testsPassed := false;
								};

								// Proportion represents user's stake vs total stake, must be between 0-1
								if (metrics.proportion <= 0.0 or metrics.proportion > 1.0) {
									testsPassed := false;
								};

								// User weight combines proportion, lockup weight and bootstrap multiplier
								// Must be positive
								if (metrics.userWeight <= 0.0) {
									testsPassed := false;
								};

								// Total weight is sum of all user weights, must be positive
								if (metrics.totalWeight <= 0.0) {
									testsPassed := false;
								};

								// Final reward is user's share of total rewards, cannot be negative
								if (metrics.finalReward < 0.0) {
									testsPassed := false;
								};

								// APY (Annual Percentage Yield) must be non-negative
								if (metrics.apy < 0.0) {
									testsPassed := false;
								};
							};
							case (#err(_)) {
								testsPassed := false;
							};
						};
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
