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

// passcodeManager local - by6od-j4aaa-aaaaa-qaadq-cai
// passcodeManager mainnet - 7eikv-2iaaa-aaaag-qdgwa-cai

// swapCalculator local - bkyz2-fmaaa-aaaaa-qaaaq-cai
// swapCalculator mainnet - phr2m-oyaaa-aaaag-qjuoq-cai

// swapFactory local - a3shf-5eaaa-aaaaa-qaafa-cai
// swapFactory mainnet - 4mmnk-kiaaa-aaaag-qbllq-cai
actor CreatePool {

	private let pool_creation_fee : Nat = 100_000_000; // 1 ICP in e8s
	private let approval_fee : Nat = 10_000; // 0.0001 ICP in e8s

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
			icrc2_approve : ApproveArgs -> async ApproveResult;
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
			depositFrom : DepositArgs -> async Result;
			requestPasscode : (Principal, Principal, Nat) -> async Result_1;
		};
	};

	module SwapCalculator {
		public type Service = actor {
			getSqrtPriceX96 : (Float, Float, Float) -> async Int;
			sortToken : (Text, Text) -> async (Text, Text);
		};
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
			createPool : CreatePoolArgs -> async Result;
		};
	};

	// Canister IDs for ICPSwap services (production environment)
	let icpLedger : ICPLedger.Service = actor ("ryjl3-tyaaa-aaaaa-aaaba-cai");
	let passcodeManager : PasscodeManager.Service = actor ("by6od-j4aaa-aaaaa-qaadq-cai");
	let swapCalculator : SwapCalculator.Service = actor ("bkyz2-fmaaa-aaaaa-qaaaq-cai");
	let swapFactory : SwapFactory.Service = actor ("a3shf-5eaaa-aaaaa-qaafa-cai");

	// Updated create function with direct token parameters
	public shared func create(
		token0Id : Text,
		token0Standard : Text,
		token0Decimals : Nat,
		token1Id : Text,
		token1Standard : Text,
		token1Decimals : Nat,
		initialPrice : Float
	) : async SwapFactory.Result {
		// Remove TokenList validation steps

		// Step 3: Improved approval with error handling
		let approveArgs : ICPLedger.ApproveArgs = {
			amount = pool_creation_fee + approval_fee;
			spender = {
				owner = Principal.fromText("by6od-j4aaa-aaaaa-qaadq-cai");
				subaccount = null;
			};
			fee = ?approval_fee; // Explicit fee setting
			memo = null;
			from_subaccount = null;
			created_at_time = null; // Remove timestamp for local testing
			expected_allowance = null; // Critical fix for AllowanceChanged
			expires_at = null;
		};

		let approveResult = await icpLedger.icrc2_approve(approveArgs);
		switch approveResult {
			case (#Ok(blockIndex)) {
				Debug.print("Approval successful in block: " # Nat.toText(blockIndex));
			};
			case (#Err(#AllowanceChanged { current_allowance })) {
				return #err(#InternalError("Existing allowance: " # Nat.toText(current_allowance)));
			};
			case (#Err(e)) {
				return #err(#InternalError("Approval failed: " # debug_show (e)));
			};
		};

		// Before deposit call
		Debug.print("Attempting deposit with: " # Nat.toText(100_000_000) # " amount and " # Nat.toText(10_000) # " fee");

		// Step 4: Deposit creation fee (unchanged)
		let depositResult = await passcodeManager.depositFrom({
			fee = 10_000; // 0.0001 ICP fee
			amount = 100_000_000; // 1 ICP
		});

		// After deposit call
		Debug.print("Deposit result: " # debug_show (depositResult));
		
		switch depositResult {
			case (#err(e)) return #err(#InternalError("Deposit failed"));
			case _ {};
		};

		// Step 5: Request passcode (unchanged)
		let passcodeResult = await passcodeManager.requestPasscode(
			Principal.fromText(token0Id),
			Principal.fromText(token1Id),
			pool_creation_fee
		);
		let passcode = switch passcodeResult {
			case (#ok(code)) code;
			case (#err(e)) return #err(#InternalError("Passcode request failed"));
		};

		// Step 6: Prepare pool creation parameters with direct inputs
		let (sorted0, sorted1) = await swapCalculator.sortToken(token0Id, token1Id);

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
		await swapFactory.createPool(poolArgs);
	};

};
