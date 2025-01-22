import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Error "mo:base/Error";
import Debug "mo:base/Debug";
import Array "mo:base/Array";
import Nat "mo:base/Nat";

actor Pool {
	// Test environment canister IDs
	private let NETWORK_ID = "ic";
	private let CANISTERS = {
		DOXA = "irorr-5aaaa-aaaak-qddsq-cai";
		ICP = "ryjl3-tyaaa-aaaaa-aaaba-cai";
		// CKBTC = "mxzaz-hqaaa-aaaar-qaada-cai";
		// CKETH = "ss2fx-dyaaa-aaaar-qacoq-cai";
		// CKUSDC = "ss2fx-dyaaa-aaaar-qacoq-cai";
		SWAP_FACTORY = "be2us-64aaa-aaaaa-qaabq-cai"; // From local deployment
		PASSCODE_MANAGER = "bkyz2-fmaaa-aaaaa-qaaaq-cai"; // From local deployment
		SWAP_CALCULATOR = "br5f7-7uaaa-aaaaa-qaaca-cai"; // SwapFeeReceiver from deployment

	};

	// Types
	type Token = {
		address : Text;
		standard : Text;
	};

	type PoolData = {
		fee : Nat;
		key : Text;
		tickSpacing : Int;
		token0 : Token;
		token1 : Token;
		canisterId : Principal;
	};

	// Interface to existing SwapFactory
	public type SwapFactory = actor {
		createPool : (CreatePoolArgs) -> async Result.Result<PoolData, Text>;
	};

	type CreatePoolArgs = {
		fee : Nat;
		sqrtPriceX96 : Text;
		subnet : ?Text;
		token0 : Token;
		token1 : Token;
	};

	// Interface to SwapCalculator
	public type SwapCalculator = actor {
		swap : ({ amount : Nat; poolData : PoolData }) -> async Result.Result<Nat, Text>;
	};

	// Interface to PasscodeManager
	public type PasscodeManager = actor {
		depositFrom : (DepositArgs) -> async Result.Result<Nat, Text>;
		requestPasscode : (Principal, Principal, Nat) -> async Result.Result<Text, Text>;
	};

	type DepositArgs = {
		fee : Nat;
		amount : Nat;
	};

	// Create new pool
	public shared (msg) func createPool(token0Address : Text, token1Address : Text) : async Result.Result<Text, Text> {
		try {
			// 1. Deposit fee
			let passcodeManager = actor (CANISTERS.PASSCODE_MANAGER) : PasscodeManager;
			let depositResult = await passcodeManager.depositFrom({
				amount = 100_000_000; // 1 ICP in test env
				fee = 10000;
			});

			// 2. Request passcode
			let token0Principal = Principal.fromText(token0Address);
			let token1Principal = Principal.fromText(token1Address);
			let passcodeResult = await passcodeManager.requestPasscode(
				token0Principal,
				token1Principal,
				3000 // 0.3% fee tier
			);

			// 3. Create pool
			let swapFactory = actor (CANISTERS.SWAP_FACTORY) : SwapFactory;
			let createPoolResult = await swapFactory.createPool({
				fee = 3000;
				sqrtPriceX96 = "79228162514264337593543950336"; // Default 1:1 price
				subnet = null;
				token0 = {
					address = token0Address;
					standard = "ICRC1";
				};
				token1 = {
					address = token1Address;
					standard = "ICRC1";
				};
			});

			switch (createPoolResult) {
				case (#ok(poolData)) {
					#ok("Pool created with ID: " # Principal.toText(poolData.canisterId));
				};
				case (#err(e)) {
					#err("Failed to create pool: " # e);
				};
			};
		} catch (e) {
			#err("Error: " # Error.message(e));
		};
	};

	// Create DOXA pairs
	public shared (msg) func createDOXAPairs() : async [Result.Result<Text, Text>] {
		let pairs = [
			(CANISTERS.DOXA, CANISTERS.ICP),
			// (CANISTERS.DOXA, CANISTERS.CKUSDC),
			// (CANISTERS.DOXA, CANISTERS.CKETH)
		];

		var results : [Result.Result<Text, Text>] = [];
		for ((token0, token1) in pairs.vals()) {
			let result = await createPool(token0, token1);
			results := Array.append(results, [result]);
		};
		results;
	};

	// Query existing pool
	public shared func getPoolId(token0 : Text, token1 : Text) : async Text {
		// Format: token0 + "_" + token1 + "_" + fee
		token0 # "_" # token1 # "_3000";
	};
};
