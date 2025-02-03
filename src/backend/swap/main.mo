// Import necessary modules
import Array "mo:base/Array";
import Principal "mo:base/Principal";
import Float "mo:base/Float";
import Int "mo:base/Int";
import Result "mo:base/Result";
import Text "mo:base/Text";
import Nat "mo:base/Nat";
import Nat64 "mo:base/Nat64";
import Time "mo:base/Time";
import Debug "mo:base/Debug";
import Buffer "mo:base/Buffer";

// passcodeManager local - by6od-j4aaa-aaaaa-qaadq-cai
// passcodeManager mainnet - 7eikv-2iaaa-aaaag-qdgwa-cai

// swapCalculator local - bkyz2-fmaaa-aaaaa-qaaaq-cai
// swapCalculator mainnet - phr2m-oyaaa-aaaag-qjuoq-cai

// swapFactory local - a3shf-5eaaa-aaaaa-qaafa-cai
// swapFactory mainnet - 4mmnk-kiaaa-aaaag-qbllq-cai

actor class CreatePool(
	icpCid : Text,
	passcodeManagerCid : Text,
	swapCalculatorCid : Text,
	swapFactoryCid : Text
) {

	var swapPoolsCreated = Buffer.Buffer<(Text, SwapFactory.PoolData)>(0);
	stable var stSwapPoolsCreated : [(Text, SwapFactory.PoolData)] = [];

	private let poolCreationFee : Nat = 100_000_000; // 1 ICP in e8s
	private let approvalFee : Nat = 10_000; // 0.0001 ICP in e8s

	let icpLedger : ICPLedger.Service = actor (icpCid);
	let passcodeManager : PasscodeManager.Service = actor (passcodeManagerCid);
	let swapCalculator : SwapCalculator.Service = actor (swapCalculatorCid);
	let swapFactory : SwapFactory.Service = actor (swapFactoryCid);

	// Updated create function with direct token parameters
	public shared func create({
		token0Id : Text;
		token0Standard : Text;
		token0Decimals : Nat;
		token1Id : Text;
		token1Standard : Text;
		token1Decimals : Nat;
		initialPrice : Float;
	}) : async Result.Result<SwapFactory.PoolData, Text> {

		// Todo checks needed allow only adims

		// Remove TokenList validation steps

		// Step 3: Improved approval with error handling
		let approveArgs : ICPLedger.ApproveArgs = {
			amount = poolCreationFee + approvalFee;
			spender = {
				owner = Principal.fromText(passcodeManagerCid);
				subaccount = null;
			};
			fee = null;
			memo = null;
			from_subaccount = null;
			created_at_time = null;
			expected_allowance = null;
			expires_at = null;
		};

		// Use ICP.icrc2_approve to approve PasscodeManager to transfer SwapPool creation fees from current principal.
		switch (await icpLedger.icrc2_approve(approveArgs)) {
			case (#Ok(blockIndex)) {
				Debug.print("Approval successful in block: " # Nat.toText(blockIndex));
			};
			case (#Err(e)) {
				return #err(("Approval failed: " # debug_show (e)));
			};
		};

		// Before deposit call
		Debug.print("Attempting deposit with: " # Nat.toText(100_000_000) # " amount and " # Nat.toText(10_000) # " fee");

		// Step 4: Deposit creation fee (unchanged)
		// Use PasscodeManager.depositFrom to transfer ICP from the caller to PasscodeManager.
		let depositResult = await passcodeManager.depositFrom({
			fee = 10_000; // 0.0001 ICP fee
			amount = 100_000_000; // 1 ICP
		});

		// After deposit call
		Debug.print("Deposit result: " # debug_show (depositResult));

		switch depositResult {
			case (#err(error)) return #err(("Deposit failed " # debug_show (error)));
			case (#ok(_amount)) {};
		};

		// Step 5: Request passcode (unchanged)
		// Use PasscodeManager.requestPasscode to request a passcode for creating a SwapPool.

		let passcodeResult = await passcodeManager.requestPasscode((
			Principal.fromText(token0Id),
			Principal.fromText(token1Id),
			3_000
		));
		let passcode = switch passcodeResult {
			case (#ok(code)) code;
			case (#err(error)) return #err(("Passcode request failed " # debug_show (error)));
		};

		// Step 6: Prepare pool creation parameters with direct inputs
		let (sorted0, sorted1) = await swapCalculator.sortToken(token0Id, token1Id);

		// Note
		// initialPrice = sorted1 price / sorted0 price

		// Calculate initial sqrt price using provided decimals
		let sqrtPrice = await swapCalculator.getSqrtPriceX96(
			initialPrice,
			Float.fromInt(token0Decimals),
			Float.fromInt(token1Decimals)
		);

		// Create pool arguments with direct standards input
		let poolArgs : SwapFactory.CreatePoolArgs = {
			fee = 3_000; // 0.3% pool fee
			sqrtPriceX96 = Int.toText(sqrtPrice);
			subnet = null;
			token0 = { address = sorted0; standard = token0Standard };
			token1 = { address = sorted1; standard = token1Standard };
		};

		// Final step: Create the pool
		// Use SwapFactory.createPool to create a SwapPool.
		switch (await swapFactory.createPool(poolArgs)) {
			case (#ok(value)) {
				swapPoolsCreated.add(passcode, value);
				#ok(value);
			};
			case (#err(error)) { #err("Create Pool failed " # debug_show (error)) };
		};
	};

	public query func getCreatedPoolData() : async [(Text, SwapFactory.PoolData)] {
		Buffer.toArray(swapPoolsCreated);
	};

	system func preupgrade() {
		stSwapPoolsCreated := Buffer.toArray(swapPoolsCreated);
	};

	system func postupgrade() {
		swapPoolsCreated := Buffer.fromArray(stSwapPoolsCreated);
		stSwapPoolsCreated := [];
	};

	module ICPLedger {
		public type Account = { owner : Principal; subaccount : ?[Nat8] };
		public type ApproveArgs = {
			fee : ?Nat;
			memo : ?[Nat8];
			from_subaccount : ?[Nat8];
			created_at_time : ?Nat64;
			amount : Nat;
			expected_allowance : ?Nat;
			expires_at : ?Nat64;
			spender : Account;
		};
		public type ApproveError = {
			#GenericError : { message : Text; error_code : Nat };
			#TemporarilyUnavailable;
			#Duplicate : { duplicate_of : Nat };
			#BadFee : { expected_fee : Nat };
			#AllowanceChanged : { current_allowance : Nat };
			#CreatedInFuture : { ledger_time : Nat64 };
			#TooOld;
			#Expired : { ledger_time : Nat64 };
			#InsufficientFunds : { balance : Nat };
		};
		public type ApproveResult = { #Ok : Nat; #Err : ApproveError };
		public type Service = actor {
			icrc2_approve : shared ApproveArgs -> async ApproveResult;
		};
	};

	module PasscodeManager {
		public type DepositArgs = { fee : Nat; amount : Nat };
		public type Error = {
			#CommonError;
			#InternalError : Text;
			#UnsupportedToken : Text;
			#InsufficientFunds;
		};
		public type Result = { #ok : Nat; #err : Error };
		public type Result_1 = { #ok : Text; #err : Error };
		public type Service = actor {
			depositFrom : shared DepositArgs -> async Result;
			requestPasscode : shared (Principal, Principal, Nat) -> async Result_1;
		};
	};

	module SwapCalculator {
		public type Service = actor {
			getSqrtPriceX96 : shared query (Float, Float, Float) -> async Int;
			sortToken : shared query (Text, Text) -> async (Text, Text);
		}

	};

	module SwapFactory {
		public type Token = { address : Text; standard : Text };
		public type CreatePoolArgs = {
			fee : Nat;
			sqrtPriceX96 : Text;
			subnet : ?Text;
			token0 : Token;
			token1 : Token;
		};
		public type PoolData = {
			fee : Nat;
			key : Text;
			tickSpacing : Int;
			token0 : Token;
			token1 : Token;
			canisterId : Principal;
		};
		public type Error = {
			#CommonError;
			#InternalError : Text;
			#UnsupportedToken : Text;
			#InsufficientFunds;
		};
		public type Result = { #ok : PoolData; #err : Error };
		public type Service = actor {
			createPool : shared CreatePoolArgs -> async Result;
		};
	};

};
