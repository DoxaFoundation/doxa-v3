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
import HashMap "mo:base/HashMap";
import Option "mo:base/Option";
import Blob "mo:base/Blob";
import Nat8 "mo:base/Nat8";

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

	var swapPoolsCreated = Buffer.Buffer<SwapFactory.PoolData>(0);
	stable var stSwapPoolsCreated : [SwapFactory.PoolData] = [];

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
		let _passcode = switch passcodeResult {
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
				swapPoolsCreated.add(value);
				#ok(value);
			};
			case (#err(error)) { #err("Create Pool failed " # debug_show (error)) };
		};
	};

	public query func getCreatedPoolData() : async [SwapFactory.PoolData] {
		Buffer.toArray(swapPoolsCreated);
	};

	func getTokenFeeMap() : HashMap.HashMap<Text, Nat> {
		let map = HashMap.HashMap<Text, Nat>(0, Text.equal, Text.hash);
		map.put("ryjl3-tyaaa-aaaaa-aaaba-cai", 10_000);
		map.put("xevnm-gaaaa-aaaar-qafnq-cai", 10_000);
		map.put("irorr-5aaaa-aaaak-qddsq-cai", 10_000);
		map.put("mxzaz-hqaaa-aaaar-qaada-cai", 10);
		map.put("ss2fx-dyaaa-aaaar-qacoq-cai", 2_000_000_000_000);
		map.put("cngnf-vqaaa-aaaar-qag4q-cai", 10_000);
		map;
	};
	func getDecimalsMap() : HashMap.HashMap<Text, Nat> {
		let map = HashMap.HashMap<Text, Nat>(0, Text.equal, Text.hash);
		map.put("ryjl3-tyaaa-aaaaa-aaaba-cai", 8);
		map.put("xevnm-gaaaa-aaaar-qafnq-cai", 6);
		map.put("irorr-5aaaa-aaaak-qddsq-cai", 6);
		map.put("mxzaz-hqaaa-aaaar-qaada-cai", 8);
		map.put("ss2fx-dyaaa-aaaar-qacoq-cai", 18);
		map.put("cngnf-vqaaa-aaaar-qag4q-cai", 6);
		map;
	};

	type Price1000UsdArgs = {
		ICP : Nat;
		USDx : Nat;
		ckBTC : Nat;
		ckETH : Nat;
		ckUSDC : Nat;
		ckUSDT : Nat;
	};

	let failures = Buffer.Buffer<Text>(0);
	var liquidityAmountMap = HashMap.HashMap<Text, Nat>(0, Text.equal, Text.hash);
	let tokeFeeMap : HashMap.HashMap<Text, Nat> = getTokenFeeMap();
	let decimalsMap : HashMap.HashMap<Text, Nat> = getDecimalsMap();

	public func addInitialLiquidityLocal(price : Price1000UsdArgs) : async [Text] {
		liquidityAmountMap := getLiquidtyAmountMap(price);

		failures.clear();

		for (poolData in swapPoolsCreated.vals()) {
			let { canisterId; token0; token1; key } = poolData;
			dPrint("\n\nstart -- " # Principal.toText(canisterId) # " \n");
			let success0 = await depositeToken(token0.address, canisterId, key);
			let success1 = await depositeToken(token1.address, canisterId, key);

			if (success0 and success1) {
				let _ = await mintAPosition(token0.address, token1.address, canisterId);
			}

		};
		Buffer.toArray(failures);
	};

	func depositeToken(tokenId : Text, swapPoolId : Principal, key : Text) : async Bool {
		// Giving approval for particular SwapPool to transfer your token0
		let swapPool : SwapPool.Service = actor (Principal.toText(swapPoolId));

		let ledger : Icrc2.Service = actor (tokenId);
		let fee = Option.get(tokeFeeMap.get(tokenId), 0);
		let amount = Option.get(liquidityAmountMap.get(tokenId), 0);
		let approveArgs = getSwapPoolApproveArgs(amount + fee, swapPoolId);

		dPrint("approve -- " # tokenId);
		switch (await ledger.icrc2_approve(approveArgs)) {
			case (#Ok(_value)) {
				dPrint("approve Success-- " # tokenId);
				switch (await swapPool.depositFrom({ token = tokenId; fee; amount })) {
					case (#ok(_value)) {
						dPrint("deposit Success-- " # tokenId);
						true;
					};
					case (#err(error)) {
						dPrint("deposit Failed-- " # tokenId);
						failures.add(tokenId # " deposit failed: " # "[pool: " #Principal.toText(swapPoolId) # "] [method: depositFrom] [args: " # debug_show (approveArgs) # "] [response: " #debug_show (error) # "]\n\n");
						false;
					};
				};
			};
			case (#Err(error)) {
				dPrint("approve Failed-- " # tokenId);
				failures.add(tokenId # " Approval failed: " # "[key: " #key # "] [method: icrc2_approve] [args: " #debug_show (approveArgs) # "] [response: " #debug_show (error) # "]\n\n");
				false;
			};
		};
	};

	func mintAPosition(token0Id : Text, token1Id : Text, swapPoolId : Principal) : async ?Nat {
		let swapPool : SwapPool.Service = actor (Principal.toText(swapPoolId));
		let amount0Desired = Nat.toText(Option.get(liquidityAmountMap.get(token0Id), 0));
		let amount1Desired = Nat.toText(Option.get(liquidityAmountMap.get(token1Id), 0));

		let { sqrtPriceX96 } = switch (await swapPool.metadata()) {
			case (#ok(metadata)) { metadata };
			case (#err(error)) {
				dPrint("metadata Failed-- " # Principal.toText(swapPoolId));
				failures.add("failed to get metadata : " # "[pool: " #Principal.toText(swapPoolId) # "] [method: metadata] [response: " #debug_show (error) # "]\n\n");
				return null;
			};
		};
		let { tickLower; tickUpper } = await getTicks(token0Id, token1Id, sqrtPriceX96);
		let mintArgs = {
			fee = 3000;
			amount0Desired;
			amount1Desired;
			token0 = token0Id;
			token1 = token1Id;
			tickUpper;
			tickLower;
		};
		dPrint("mintArgs -- " # debug_show (mintArgs));
		switch (await swapPool.mint(mintArgs)) {
			case (#ok(value)) {
				dPrint("mint success --" # debug_show (value));
				?value;
			};
			case (#err(error)) {
				dPrint("mint Failed --" # debug_show (error));
				failures.add("Minting position failed: " # "[pool: " #Principal.toText(swapPoolId) # "] [method: mint] [args: " # debug_show (mintArgs) # "] [response: " #debug_show (error) # "]\n\n");
				null;
			};
		};
	};

	func dPrint(text : Text) {
		Debug.print(text);
	};

	func getTicks(token0Id : Text, token1Id : Text, sqrtPriceX96 : Nat) : async {
		tickLower : Int;
		tickUpper : Int;

	} {
		let decimals0 = Option.get(decimalsMap.get(token0Id), 1);
		let decimals1 = Option.get(decimalsMap.get(token1Id), 1);
		let price = await swapCalculator.getPrice(sqrtPriceX96, decimals0, decimals1);
		let lowerPrice = getLowerPrice(price);
		let upperPrice = getUpperPrice(price);
		dPrint("price -- " # debug_show (price) # " lowerPrice -- " # debug_show (lowerPrice) # " upperPrice -- " # debug_show (upperPrice));
		let tickLower = await swapCalculator.priceToTick(lowerPrice, 3000);
		let tickUpper = await swapCalculator.priceToTick(upperPrice, 3000);
		dPrint("tickLower -- " # debug_show (tickLower) # " tickUpper -- " # debug_show (tickUpper));
		{ tickLower; tickUpper };
	};

	func getLowerPrice(price : Float) : Float {
		calculatePriceChange(price, -50); // -50%
	};
	func getUpperPrice(price : Float) : Float {
		calculatePriceChange(price, 100) // +100%
	};

	func calculatePriceChange(price : Float, percentage : Float) : Float {
		// Convert percentage to a multiplier
		let multiplier = 1 + (percentage / 100);
		// Calculate the new price
		let newPrice = price * multiplier;

		if (newPrice < 0) {
			Debug.trap("Price can not be negative, use correct percentage");
		};
		return newPrice;
	};

	func getSwapPoolApproveArgs(amount : Nat, canisterId : Principal) : Icrc2.ApproveArgs {
		{
			fee = null;
			memo = null;
			from_subaccount = null;
			created_at_time = null;
			expires_at = null;
			expected_allowance = null;
			amount;
			spender = { owner = canisterId; subaccount = null };
		};
	};

	func getLiquidtyAmountMap(price : Price1000UsdArgs) : HashMap.HashMap<Text, Nat> {
		let liquidityAmountMap = HashMap.HashMap<Text, Nat>(0, Text.equal, Text.hash);

		let usd1000 = 1000;
		let decimals = (10 ** 8);

		let icpAmount1000usd = (usd1000 * decimals) / price.ICP;
		liquidityAmountMap.put("ryjl3-tyaaa-aaaaa-aaaba-cai", icpAmount1000usd);
		liquidityAmountMap.put("xevnm-gaaaa-aaaar-qafnq-cai", (1000 * (10 ** 6)) / price.ckUSDC);
		liquidityAmountMap.put("irorr-5aaaa-aaaak-qddsq-cai", (1000 * (10 ** 6)) / price.USDx);
		liquidityAmountMap.put("mxzaz-hqaaa-aaaar-qaada-cai", (1000 * (10 ** 8)) / price.ckBTC);
		liquidityAmountMap.put("ss2fx-dyaaa-aaaar-qacoq-cai", (1000 * (10 ** 18)) / price.ckETH);
		liquidityAmountMap.put("cngnf-vqaaa-aaaar-qag4q-cai", (1000 * (10 ** 6)) / price.ckUSDT);
		liquidityAmountMap;
	};

	public query func principalToBlob(p : Principal) : async Blob {
		var arr : [Nat8] = Blob.toArray(Principal.toBlob(p));
		var defaultArr : [var Nat8] = Array.init<Nat8>(32, 0);
		defaultArr[0] := Nat8.fromNat(arr.size());
		var ind : Nat = 0;
		while (ind < arr.size() and ind < 32) {
			defaultArr[ind + 1] := arr[ind];
			ind := ind + 1;
		};
		return Blob.fromArray(Array.freeze(defaultArr));
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
			getPrice : shared query (Nat, Nat, Nat) -> async Float;
			getSqrtPriceX96 : shared query (Float, Float, Float) -> async Int;
			sortToken : shared query (Text, Text) -> async (Text, Text);
			priceToTick : shared query (Float, Nat) -> async Int;
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

	module SwapPool {
		public type DepositArgs = { fee : Nat; token : Text; amount : Nat };
		public type Error = {
			#CommonError;
			#InternalError : Text;
			#UnsupportedToken : Text;
			#InsufficientFunds;
		};
		public type IncreaseLiquidityArgs = {
			positionId : Nat;
			amount0Desired : Text;
			amount1Desired : Text;
		};
		public type MintArgs = {
			fee : Nat;
			tickUpper : Int;
			token0 : Text;
			token1 : Text;
			amount0Desired : Text;
			amount1Desired : Text;
			tickLower : Int;
		};
		public type Token = { address : Text; standard : Text };
		public type PoolMetadata = {
			fee : Nat;
			key : Text;
			sqrtPriceX96 : Nat;
			tick : Int;
			liquidity : Nat;
			token0 : Token;
			token1 : Token;
			maxLiquidityPerTick : Nat;
			nextPositionId : Nat;
		};
		public type WithdrawArgs = { fee : Nat; token : Text; amount : Nat };
		public type Result = { #ok : Nat; #err : Error };
		public type Result_6 = { #ok : PoolMetadata; #err : Error };
		public type Result_7 = {
			#ok : { balance0 : Nat; balance1 : Nat };
			#err : Error;
		};
		public type Result_11 = { #ok : [Nat]; #err : Error };
		public type Service = actor {
			depositFrom : shared DepositArgs -> async Result;
			getUserPositionIdsByPrincipal : shared query Principal -> async Result_11;
			getUserUnusedBalance : shared query Principal -> async Result_7;
			increaseLiquidity : shared IncreaseLiquidityArgs -> async Result;
			mint : shared MintArgs -> async Result;
			withdraw : shared WithdrawArgs -> async Result;
			metadata : shared query () -> async Result_6;
		};
	};

	module Icrc2 {
		public type Account = { owner : Principal; subaccount : ?Blob };
		public type ApproveArgs = {
			fee : ?Nat;
			memo : ?Blob;
			from_subaccount : ?Blob;
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
		public type Result_2 = { #Ok : Nat; #Err : ApproveError };
		public type Service = actor {
			icrc2_approve : shared ApproveArgs -> async Result_2;
		};
	};
};
