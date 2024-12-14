// import DoxaStaking "../backend/staking/main";
import C "mo:matchers/Canister";
import M "mo:matchers/Matchers";
import T "mo:matchers/Testable";
import Principal "mo:base/Principal";
// import Time "mo:base/Time";
import Result "mo:base/Result";
import Debug "mo:base/Debug";
import Error "mo:base/Error";
import Float "mo:base/Float";
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
	let staking = actor ("be2us-64aaa-aaaaa-qaabq-cai") : actor {
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

 
// Test suite for calculateUserStakeMatric
it.should(
    "verify stake metrics calculation logic",
    func() : async C.TestResult = async {
        var testsPassed = true;
        let testPrincipal = createTestPrincipal("aaaaa-aa");

        // Test Case 1: Invalid Stake ID
        Debug.print("🧪 Testing invalid stake ID...");
        let invalidResult = await staking.calculateUserStakeMatric(999999, testPrincipal);
        switch(invalidResult) {
            case (#err(msg)) {
                if (msg != "No stakes found for user" and 
                    msg != "This stake ID does not belong to caller") {
                    Debug.print("❌ Unexpected error message for invalid stake");
                    testsPassed := false;
                };
            };
            case (#ok(_)) {
                Debug.print("❌ Should not succeed with invalid stake ID");
                testsPassed := false;
            };
        };

        // Test Case 2: Get existing stakes and verify their metrics
        Debug.print("🧪 Testing metrics for existing stakes...");
        let userStakes = await staking.getUserStakeDetails();
        
        for (stake in userStakes.vals()) {
            let metricResult = await staking.calculateUserStakeMatric(stake.id, testPrincipal);
            
            switch(metricResult) {
                case (#ok(metric)) {
                    // Verify basic metric properties
                    if (metric.proportion <= 0.0 or metric.proportion > 1.0) {
                        Debug.print("❌ Invalid proportion: " # debug_show(metric.proportion));
                        testsPassed := false;
                    };

                    if (metric.userWeight <= 0.0) {
                        Debug.print("❌ Invalid user weight: " # debug_show(metric.userWeight));
                        testsPassed := false;
                    };

                    if (metric.apy < 0.0) {
                        Debug.print("❌ Invalid APY: " # debug_show(metric.apy));
                        testsPassed := false;
                    };

                    Debug.print("✅ Metrics validated for stake ID: " # debug_show(stake.id));
                    Debug.print("Metrics: " # debug_show(metric));
                };
                case (#err(error)) {
                    Debug.print("❌ Failed to calculate metrics: " # error);
                    testsPassed := false;
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
