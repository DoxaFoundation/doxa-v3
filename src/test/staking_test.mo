// import DoxaStaking "../backend/staking/main";
import C "mo:matchers/Canister";
import M "mo:matchers/Matchers";
import T "mo:matchers/Testable";
import Principal "mo:base/Principal";
// import Time "mo:base/Time";
import Result "mo:base/Result";
import Debug "mo:base/Debug";

actor {
    let it = C.Tester({ batchSize = 8 });
    let staking = actor ("be2us-64aaa-aaaaa-qaabq-cai") : actor {
        getBootstrapStatus : shared () -> async { isBootstrapPhase : Bool };
        getPoolData : shared () -> async { name : Text };
        notifyStake : shared (amount : Nat, lockupPeriod : Nat) -> async Result.Result<(), Text>;
        getLockupWeight : shared (lockupPeriod : Nat) -> async Result.Result<Nat, Text>;
        getBootstrapMultiplier : shared () -> async Result.Result<Float, Text>;
        calculateUserStakeMatric : shared (stakeIndex : Nat, user : Principal) -> async Result.Result<{ lockupWeight : Int }, Text>;
        unstake : shared (stakeIndex : Nat) -> async Result.Result<(), Text>;
        getTotalFeeCollected : shared () -> async Int;
    };

    // Test helper function to create test principal 
    func createTestPrincipal(text : Text) : Principal {
        Principal.fromText(text);
    };

    public shared func test() : async Text {

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

        // Test lockup weight calculation
        it.should(
            "calculate correct lockup weight",
            func() : async C.TestResult = async {
                // let testPrincipal = createTestPrincipal("aaaaa-aa");
                let result = await staking.getLockupWeight(31_104_000); // 360 days

                switch (result) {
                    case (#ok(weight)) {
                        M.attempt(weight, M.equals(T.nat(4))); // Should return 4x for 360 days
                    };
                    case (#err(_)) {
                        M.attempt(true, M.equals(T.bool(false)));
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
            "calculate stake metrics correctly",
            func() : async C.TestResult = async {
                let testPrincipal = createTestPrincipal("aaaaa-aa");

                // First create a stake
                ignore await staking.notifyStake(1, 2_592_000_000_000_000);

                // Then calculate metrics
                let result = await staking.calculateUserStakeMatric(0, testPrincipal);

                switch (result) {
                    case (#ok(metrics)) {
                        M.attempt(metrics.lockupWeight, M.equals(T.int(1))); // Should be 1x for 30 days
                    };
                    case (#err(_)) {
                        M.attempt(true, M.equals(T.bool(false)));
                    };
                };
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
