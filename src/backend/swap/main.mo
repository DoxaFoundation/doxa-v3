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
import Helper "./helper";

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
	// Yeh section pool creation ke liye data flow ko handle karta hai.
	// Sabse pehle, hum ek buffer banate hain jisme created pools ka data store hota hai.
	var swapPoolsCreated = Buffer.Buffer<SwapFactory.PoolData>(0);
	// Stable variable jo upgrade ke samay state ko maintain karega.
	stable var stSwapPoolsCreated : [SwapFactory.PoolData] = [];

	// Fees for pool creation:
	// poolCreationFee: 1 ICP (in e8s), example: 100_000_000 e8s = 1 ICP.
	private let poolCreationFee : Nat = 100_000_000;
	// approvalFee: 0.0001 ICP in e8s, example: 10_000 e8s.
	private let approvalFee : Nat = 10_000;

	// External service actors:
	// ICP Ledger: ICP tokens transfer and approval.
	let icpLedger : ICPLedger.Service = actor (icpCid);
	// Passcode Manager: Handles passcode requests aur deposit operations.
	let passcodeManager : PasscodeManager.Service = actor (passcodeManagerCid);
	// Swap Calculator: Calculates prices, ticks, and sqrtPrice.
	let swapCalculator : SwapCalculator.Service = actor (swapCalculatorCid);
	// Swap Factory: Create pool ke liye actual canister call.
	let swapFactory : SwapFactory.Service = actor (swapFactoryCid);

	// Helper maps for token decimals, prices, and names.
	let decimalsMap : HashMap.HashMap<Text, Nat> = Helper.getDecimalsMap();
	let priceMap = Helper.getTokenPriceMap();
	let tokenNameMap = Helper.getTokenNameMap();

	// Function: create
	// Yeh function pool creation ka main process manage karta hai.
	// Input Example:
	//    firstTokenId: "ryjl3-tyaaa-aaaaa-aaaba-cai"
	//    secondTokenId: "xevnm-gaaaa-aaaar-qafnq-cai"
	// Return Example:
	//    On success: { #ok: { canisterId: Principal("..."), token0: {...}, token1: {...}, key: "..." } }
	//    On failure: { #err: "Error message..." }
	public shared func create(firstTokenId : Text, secondTokenId : Text) : async Result.Result<SwapFactory.PoolData, Text> {

		// NOTE: Abhi validations add nahi ki gayi, check karna hai ki sirf admin ya valid tokens use ho rahe hain.

		// Step 3: Token Approval
		// Yahan hum caller se permission lete hain ki PasscodeManager, ICP tokens transfer kar sake.
		// Data flow: Caller -> ICP Ledger (approve) -> PasscodeManager.
		let approveArgs : ICPLedger.ApproveArgs = {
			amount = poolCreationFee + approvalFee; // Total fee: 1 ICP + 0.0001 ICP.
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

		// ICP Ledger ka icrc2_approve function call karte hain.
		switch (await icpLedger.icrc2_approve(approveArgs)) {
			case (#Ok(blockIndex)) {
				// Example: blockIndex = 12345. Matlab approval transaction block number 12345 par successful.
				Debug.print("Approval successful in block: " # Nat.toText(blockIndex));
			};
			case (#Err(e)) {
				// Agar approval fail ho jaata hai, error return kar dete hain.
				return #err(("Approval failed: " # debug_show (e)));
			};
		};

		// Deposit phase: Fee deposit karwana PasscodeManager ke paas.
		Debug.print("Attempting deposit with: " # Nat.toText(100_000_000) # " amount and " # Nat.toText(10_000) # " fee");

		// Step 4: Deposit creation fee from the caller to PasscodeManager.
		// Data flow: Caller -> PasscodeManager deposit.
		let depositResult = await passcodeManager.depositFrom({
			fee = 10_000; // 0.0001 ICP fee.
			amount = 100_000_000; // 1 ICP deposit.
		});

		// Debug print deposit result.
		Debug.print("Deposit result: " # debug_show (depositResult));

		switch depositResult {
			case (#err(error))
			// Example error: {#InternalError = "Insufficient balance"}
			return #err(("Deposit failed " # debug_show (error)));
			case (#ok(_amount)) {};
		};

		// Step 6: Prepare pool creation parameters.
		// Token IDs sort ho jaate hain for consistency.
		let (token0Id, token1Id) = Helper.sortToken(firstTokenId, secondTokenId);
		// Example: token0Id = "ryjl3-tyaaa-aaaaa-aaaba-cai", token1Id = "xevnm-gaaaa-aaaar-qafnq-cai"

		// Step 5: Request a passcode for pool creation.
		// Data flow: Caller -> PasscodeManager -> Passcode response.
		let passcodeResult = await passcodeManager.requestPasscode((
			Principal.fromText(token0Id),
			Principal.fromText(token1Id),
			3_000 // Pool fee parameter as an example.
		));
		let _passcode = switch passcodeResult {
			case (#ok(code)) code; // Example: code = "samplePasscode123"
			case (#err(error)) return #err(("Passcode request failed " # debug_show (error)));
		};

		// Calculate initial price using helper function.
		// Data flow: priceMap -> getInitialPrice -> Float initialPrice.
		let initialPrice = getInitialPrice(token0Id, token1Id);
		// Example: initialPrice might be 1.25

		// Get decimal values for tokens from decimalsMap.
		let decimals0 = getDecimals(token0Id); // Example: 8
		let decimals1 = getDecimals(token1Id); // Example: 8

		// Calculate sqrtPrice using swapCalculator service.
		// Data flow: (initialPrice, decimals) -> swapCalculator.getSqrtPriceX96 -> sqrtPrice.
		let sqrtPrice = await swapCalculator.getSqrtPriceX96(
			initialPrice,
			Float.fromInt(decimals0),
			Float.fromInt(decimals1)
		);
		// Example: sqrtPrice = 79228162514264337593543950336

		// Prepare arguments for pool creation.
		let poolArgs : SwapFactory.CreatePoolArgs = {
			fee = 3_000; // Pool fee: 0.3% (example value).
			sqrtPriceX96 = Int.toText(sqrtPrice); // Converted to string.
			subnet = null;
			// Token information with standard "ICRC2".
			token0 = { address = token0Id; standard = "ICRC2" };
			token1 = { address = token1Id; standard = "ICRC2" };
		};

		// Final step: Call swapFactory ka createPool function.
		// Data flow: poolArgs -> SwapFactory -> Pool creation -> Returns PoolData.
		switch (await swapFactory.createPool(poolArgs)) {
			case (#ok(value)) {
				// On success, add pool data to our buffer.
				// Example pool data: { canisterId: Principal("abcd..."), token0: {...}, token1: {...}, key: "uniqueKey" }
				swapPoolsCreated.add(value);
				#ok(value);
			};
			case (#err(error)) {
				#err("Create Pool failed " # debug_show (error));
			};
		};
	};

	// Function: getInitialPrice
	// Purpose: Token prices ke ratio se initial price calculate karta hai.
	// Input: token0Id and token1Id as Text.
	// Example: Agar token0 ki price 2.0 aur token1 ki price 3.0 hai, to initialPrice = 3.0 / 2.0 = 1.5.
	func getInitialPrice(token0Id : Text, token1Id : Text) : Float {
		let token0Price = Option.get(priceMap.get(token0Id), 0.0);
		let token1Price = Option.get(priceMap.get(token1Id), 0.0);
		let initialPrice = token1Price / token0Price;

		if (initialPrice == 0) Debug.trap("Initial price is 0");

		initialPrice;
	};

	// Function: getDecimals
	// Purpose: Token ka decimal value retrieve karta hai.
	// Input: tokenId as Text.
	// Example: "ryjl3-tyaaa-aaaaa-aaaba-cai" -> 8 decimals.
	func getDecimals(tokenId : Text) : Nat {
		Option.get(decimalsMap.get(tokenId), 1);
	};

	// Function: getCreatedPoolData
	// Purpose: Created pool data ko retrieve karta hai.
	// Returns: Array of SwapFactory.PoolData.
	public query func getCreatedPoolData() : async [SwapFactory.PoolData] {
		Buffer.toArray(swapPoolsCreated);
	};

	// Type definition for liquidity amount conversion.
	type Price1000UsdArgs = {
		ICP : Nat;
		USDx : Nat;
		ckBTC : Nat;
		ckETH : Nat;
		ckUSDC : Nat;
		ckUSDT : Nat;
	};

	// Buffer for logging failures during liquidity addition.
	let failures = Buffer.Buffer<Text>(0);
	var liquidityAmountMap = HashMap.HashMap<Text, Nat>(0, Text.equal, Text.hash);
	let tokeFeeMap : HashMap.HashMap<Text, Nat> = Helper.getTokenFeeMap();

	// Function: addInitialLiquidityLocal
	// Purpose: Har created pool ke liye initial liquidity add karta hai.
	// Input Example: price = { ICP: 30000, USDx: 1, ckBTC: 40000, ckETH: 2000, ckUSDC: 1, ckUSDT: 1 }
	// Return: Array of failure messages [Text].
	public func addInitialLiquidityLocal(price : Price1000UsdArgs) : async [Text] {
		liquidityAmountMap := getLiquidtyAmountMap(price);

		// Pehle se stored failures clear kar do.
		failures.clear();

		// Har pool ke liye token deposits aur liquidity minting karte hain.
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

	// Function: depositeToken
	// Purpose: Specific token ke liye approval dekar deposit process handle karta hai.
	// Input Example: tokenId = "ryjl3-tyaaa-aaaaa-aaaba-cai", swapPoolId = Principal("abcd..."), key = "uniqueKey"
	// Return: true agar process successful, false otherwise.
	func depositeToken(tokenId : Text, swapPoolId : Principal, key : Text) : async Bool {
		// SwapPool ka service access karna.
		let swapPool : SwapPool.Service = actor (Principal.toText(swapPoolId));

		// Ledger service jo token transfers handle karta hai.
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

	// Function: mintAPosition
	// Purpose: Deposit ke baad liquidity position mint karta hai.
	// Input Example: token0Id = "ryjl3-tyaaa-aaaaa-aaaba-cai", token1Id = "xevnm-gaaaa-aaaar-qafnq-cai", swapPoolId = Principal("abcd...")
	// Return: Optional Nat (position id) on success, null on failure.
	func mintAPosition(token0Id : Text, token1Id : Text, swapPoolId : Principal) : async ?Nat {
		let swapPool : SwapPool.Service = actor (Principal.toText(swapPoolId));
		let amount0Desired = Nat.toText(Option.get(liquidityAmountMap.get(token0Id), 0));
		let amount1Desired = Nat.toText(Option.get(liquidityAmountMap.get(token1Id), 0));

		// Pool se current metadata (including sqrtPriceX96) lete hain.
		let { sqrtPriceX96 } = switch (await swapPool.metadata()) {
			case (#ok(metadata)) { metadata };
			case (#err(error)) {
				dPrint("metadata Failed-- " # Principal.toText(swapPoolId));
				failures.add("failed to get metadata : " # "[pool: " #Principal.toText(swapPoolId) # "] [method: metadata] [response: " #debug_show (error) # "]\n\n");
				return null;
			};
		};
		// Tick values calculate karne ke liye price ranges set karte hain.
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

	// Helper function: dPrint
	// Purpose: Debug messages print karne ke liye.
	func dPrint(text : Text) {
		Debug.print(text);
	};

	// Function: getTicks
	// Purpose: Current sqrtPrice ke basis par lower aur upper tick values calculate karta hai.
	// Input Example:
	//    token0Id: "ryjl3-tyaaa-aaaaa-aaaba-cai"
	//    token1Id: "xevnm-gaaaa-aaaar-qafnq-cai"
	//    sqrtPriceX96: Nat value from swapCalculator.
	// Return Example:
	//    { tickLower: -100, tickUpper: 100 }
	func getTicks(token0Id : Text, token1Id : Text, sqrtPriceX96 : Nat) : async {
		tickLower : Int;
		tickUpper : Int;

	} {
		let decimals0 = getDecimals(token0Id);
		let decimals1 = getDecimals(token1Id);
		// Get current price using sqrtPrice and token decimals.
		let price = await swapCalculator.getPrice(sqrtPriceX96, decimals0, decimals1);
		// Calculate lower and upper price limits.
		let lowerPrice = getLowerPrice(price);
		let upperPrice = getUpperPrice(price);
		dPrint("price -- " # debug_show (price) # " lowerPrice -- " # debug_show (lowerPrice) # " upperPrice -- " # debug_show (upperPrice));
		// Updated swapCalculator.priceToTick call with 4 parameters as per new candid.
		let tickLower = await swapCalculator.priceToTick(lowerPrice, Float.fromInt(decimals0), Float.fromInt(decimals1), 3000);
		let tickUpper = await swapCalculator.priceToTick(upperPrice, Float.fromInt(decimals0), Float.fromInt(decimals1), 3000);
		dPrint("tickLower -- " # debug_show (tickLower) # " tickUpper -- " # debug_show (tickUpper));
		{ tickLower; tickUpper };
	};

	// Function: getLowerPrice
	// Purpose: Current price se -50% adjustment lagake lower price calculate karta hai.
	func getLowerPrice(price : Float) : Float {
		calculatePriceChange(price, -50); // -50% change.
	};
	// Function: getUpperPrice
	// Purpose: Current price se +100% adjustment lagake upper price calculate karta hai.
	func getUpperPrice(price : Float) : Float {
		calculatePriceChange(price, 100); // +100% change.
	};

	// Function: calculatePriceChange
	// Purpose: Given percentage ke hisaab se price adjust karta hai.
	// Input Example:
	//    price = 1.5, percentage = -50, multiplier = 0.5 then newPrice = 0.75.
	func calculatePriceChange(price : Float, percentage : Float) : Float {
		// Percentage ko multiplier mein convert karte hain.
		let multiplier = 1 + (percentage / 100);
		// New price calculate karo.
		let newPrice = price * multiplier;

		if (newPrice < 0) {
			Debug.trap("Price can not be negative, use correct percentage");
		};
		return newPrice;
	};

	// Function: getSwapPoolApproveArgs
	// Purpose: Specific token approval arguments prepare karta hai for a given SwapPool.
	// Input: amount (Nat) and canisterId (Principal).
	// Return: Icrc2.ApproveArgs object.
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

	// Function: getLiquidtyAmountMap
	// Purpose: Fixed $1000 ke hisaab se har token ka liquidity amount calculate karta hai.
	// Input: Price1000UsdArgs jisme token conversion details hote hain.
	// Return: HashMap<Text, Nat> jisme token addresses mapped hote hain unke calculated amounts.
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

	// Function: principalToBlob
	// Purpose: Principal ko Blob format mein convert karta hai.
	// Input: Principal p.
	// Return: Blob (asynchronous).
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

	// Function: getPoolPrices
	// Purpose: Sabhi created pools se unka current price retrieve karta hai.
	// Data flow: For each pool, metadata fetch karo -> getPrice from swapCalculator -> format token names.
	// Return: Array of records { name: Text; price: Float }.
	public composite query func getPoolPrices() : async [{ name : Text; price : Float }] {

		let prices = Buffer.Buffer<{ name : Text; price : Float }>(0);
		for ({ canisterId; token0; token1 } in swapPoolsCreated.vals()) {

			let swapPool : SwapPool.Service = actor (Principal.toText(canisterId));

			switch (await swapPool.metadata()) {
				case (#ok(metadata)) {
					let { sqrtPriceX96; token0; token1 } = metadata;
					let decimals0 = getDecimals(token0.address);
					let decimals1 = getDecimals(token1.address);
					let price = await swapCalculator.getPrice(sqrtPriceX96, decimals0, decimals1);

					let name = getTokenName(token1.address) # "/" # getTokenName(token0.address);
					prices.add({ name; price });
				};
				case (_) {};
			};
		};
		Buffer.toArray(prices);
	};

	// Function: getTokenName
	// Purpose: Token address se uska naam retrieve karta hai.
	// Input: tokenId as Text.
	// Return: Token name (agar map mein na mile, toh tokenId return karta hai).
	func getTokenName(tokenId : Text) : Text {
		Option.get(tokenNameMap.get(tokenId), tokenId);
	};

	public func calculatePositionAmount(poolId : Principal, amount0Desired : Nat, amount1Desired : Nat) : async ?{
		name : Text;
		amount0 : Int;
		amount1 : Int;
	} {

		let swapPool : SwapPool.Service = actor (Principal.toText(poolId));

		switch (await swapPool.metadata()) {
			case (#ok(metadata)) {
				let { sqrtPriceX96; token0; token1 } = metadata;
				let decimals0 = getDecimals(token0.address);
				let decimals1 = getDecimals(token1.address);

				let price = await swapCalculator.getPrice(sqrtPriceX96, decimals0, decimals1);
				let lowerPrice = getLowerPrice(price);
				let upperPrice = getUpperPrice(price);

				let tickCurrent = await swapCalculator.priceToTick(price, Float.fromInt(decimals0), Float.fromInt(decimals1), 3000);
				let tickLower = await swapCalculator.priceToTick(lowerPrice, Float.fromInt(decimals0), Float.fromInt(decimals1), 3000);
				let tickUpper = await swapCalculator.priceToTick(upperPrice, Float.fromInt(decimals0), Float.fromInt(decimals1), 3000);
				let { amount0; amount1 } = await swapCalculator.getPositionTokenAmount(sqrtPriceX96, tickCurrent, tickLower, tickUpper, amount0Desired, amount1Desired);

				// Token1/Token0
				let name = getTokenName(token1.address) # "/" # getTokenName(token0.address) # "   (token1/token0)";

				dPrint(
					"\n\n calculatePositionAmount -- " # name # "\n" # "sqrtPriceX96 =" # debug_show (sqrtPriceX96) # "\n" #
					"decimals0 =" # debug_show (decimals0) # "\n" # "decimals1 =" # debug_show (decimals1) # "\n"
					# "price =" # debug_show (price) # "\n" # "lowerPrice =" # debug_show (lowerPrice) # "\n" #
					"upperPrice =" # debug_show (upperPrice) # "\n" # "tickCurrent =" # debug_show (tickCurrent) # "\n"
					# "tickLower =" # debug_show (tickLower) # "\n" # "tickUpper =" # debug_show (tickUpper) # "\n"
					# "amount0Desired =" # debug_show (amount0Desired) # "\n" # "amount1Desired =" # debug_show (amount1Desired) # "\n"
					# "amount0 =" # debug_show (amount0) # "\n" # "amount1 =" # debug_show (amount1) # "\n\n"
				);

				?{ name; amount0; amount1 };
			};
			case (_) { null };
		};

	};

	// System functions for upgrade state management.
	system func preupgrade() {
		// Upgrade se pehle pool data stable variable mein store karna.
		stSwapPoolsCreated := Buffer.toArray(swapPoolsCreated);
	};

	system func postupgrade() {
		// Upgrade ke baad pool data ko restore karna.
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
			getPositionTokenAmount : shared query (Nat, Int, Int, Int, Nat, Nat) -> async ({
				amount0 : Int;
				amount1 : Int;
			});

			// Updated signature as per new candid: now accepts three Float parameters and a Nat.
			priceToTick : shared query (Float, Float, Float, Nat) -> async Int;
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
