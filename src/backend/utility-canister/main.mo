import Principal "mo:base/Principal";
import HashMap "mo:base/HashMap";
import Text "mo:base/Text";
import Float "mo:base/Float";
import Option "mo:base/Option";
import Buffer "mo:base/Buffer";
import Helper "../swap/helper";
import Timer "mo:base/Timer";
import Time "mo:base/Time";
import Int "mo:base/Int";
import Array "mo:base/Array";
import Debug "mo:base/Debug";
import Error "mo:base/Error";

actor {
	type TimerId = Timer.TimerId;

	private stable var Q192 = (2 ** 96) ** 2;

	let decimalsMap : HashMap.HashMap<Text, Nat> = Helper.getDecimalsMap();

	let swapFactory : SwapFactory.Service = actor "4mmnk-kiaaa-aaaag-qbllq-cai";

	let nodeIndex : NodeIndex.Service = actor "ggzvv-5qaaa-aaaag-qck7a-cai";

	// let tokenStorage : TokenStorage.Service = actor "moe7a-tiaaa-aaaag-qclfq-cai"; // either of "duhra-7yaaa-aaaag-qnccq-cai" "moe7a-tiaaa-aaaag-qclfq-cai" depends on the token

	// Token address constants
	let tokenMap = {
		DUSD = "irorr-5aaaa-aaaak-qddsq-cai";
		ICP = "ryjl3-tyaaa-aaaaa-aaaba-cai";
		ckUSDC = "xevnm-gaaaa-aaaar-qafnq-cai";
		ckBTC = "mxzaz-hqaaa-aaaar-qaada-cai";
		ckETH = "ss2fx-dyaaa-aaaar-qacoq-cai";
		ckUSDT = "cngnf-vqaaa-aaaar-qag4q-cai";
	};

	stable var allTokenPriceMainnet : [var (Text, Float)] = [var (tokenMap.ckUSDC, 1.0), (tokenMap.ckUSDT, 1.0), (tokenMap.ckETH, 0), (tokenMap.ckBTC, 0), (tokenMap.ICP, 0), (tokenMap.DUSD, 1.0)];

	stable var timerId : TimerId = 0;

	// private func fetchPricesFromICPSwap() : async () {

	//     let x = allTokenPriceMainnet.keys();
	//     label l loop {
	//         switch (x.next()) {
	//             case (?index) {
	//                 /// for loop body start
	//                 try {
	//                     let (token, price) = allTokenPriceMainnet[index];

	//                     // let tokenStorage : TokenStorage.Service = switch (await nodeIndex.tokenStorage(token)) {
	//                     //     case (null) { continue l };
	//                     //     case (?canisterId) { actor (canisterId) };
	//                     // };

	//                     /* lets assume all tokens currently have same tokenStorage [moe7a-tiaaa-aaaag-qclfq-cai].
	//                      when writing this code manually checked all token's tokenStorage and its same tokenStorage.
	//                      If in future any token has different tokenStorage, then you can uncomment the above code and comment the below code for tokenStorage.
	//                     */

	//                     let tokenStorage : TokenStorage.Service = actor "moe7a-tiaaa-aaaag-qclfq-cai";

	//                     let tokenPrices = await tokenStorage.getTokenPricesData(token, 0, 86400, 1);

	//                     if (tokenPrices.size() > 0) {

	//                         let price = tokenPrices[0].close;
	//                         allTokenPriceMainnet[index] := (token, price);
	//                         // Debug.print("token: " # token # " price: " # Float.toText(price));
	//                     }

	//                 } catch (e : Error) {
	//                     Debug.print("error: " # Error.message(e));
	//                 };

	//                 /// for loop body end
	//             };
	//             case (null) break l;
	//         };
	//     };
	// };

	// public  query func get_interval() : async Int {
	//     return intervalgot;
	// };

	/// Timer to fetch token prices from mainnet ICPSwap
	// timerId := do {
	//     let oneMinInNanos = 60_000_000_000;
	//     let nextFetch = oneMinInNanos - (Time.now() % oneMinInNanos);
	//     // let bufferSec = 5_000_000_000;

	//     Timer.setTimer<system>(
	//         #nanoseconds(Int.abs nextFetch),
	//         func() : async () {
	//             timerId := Timer.recurringTimer<system>(#seconds 60, fetchPricesFromICPSwap);
	//             await fetchPricesFromICPSwap();
	//         }
	//     );
	// };

	func getDecimals(tokenId : Text) : Nat {
		Option.get(decimalsMap.get(tokenId), 1);
	};

	/**
     * Get the price of all tokens from mainnet ICPSwap
     * @return - Array of (token, price)
     */
	public composite query func get_all_token_prices() : async [(Text, Float)] {
		let x = allTokenPriceMainnet.keys();

		label l loop {
			switch (x.next()) {
				case (?index) {
					/// for loop body start
					try {
						let (token, price) = allTokenPriceMainnet[index];

						// let tokenStorage : TokenStorage.Service = switch (await nodeIndex.tokenStorage(token)) {
						//     case (null) { continue l };
						//     case (?canisterId) { actor (canisterId) };
						// };

						/* lets assume all tokens currently have same tokenStorage [moe7a-tiaaa-aaaag-qclfq-cai].
                         when writing this code manually checked all token's tokenStorage and its same tokenStorage.
                         If in future any token has different tokenStorage, then you can uncomment the above code and comment the below code for tokenStorage.
                        */

						let tokenStorage : TokenStorage.Service = actor "moe7a-tiaaa-aaaag-qclfq-cai";

						let tokenPrices = await tokenStorage.getTokenPricesData(token, 0, 86400, 1);
						if (tokenPrices.size() > 0) {

							let price = tokenPrices[0].close;
							allTokenPriceMainnet[index] := (token, price);
						}

					} catch (e : Error) {
						Debug.trap("Failed get Token Price error: " # Error.message(e));
					};

					/// for loop body end
				};
				case (null) break l;
			};
		};

		return Array.freeze(allTokenPriceMainnet);
	};

	/**
     * Get the price of a token from a pool. FOR LOCAL TESTING
     * @param poolId - The pool id array
     * @return - Array of (token, price)
     */
	public shared composite query func get_prices_from_ckusdc_pools_local() : async [(Text, Float)] {

		let buffer = Buffer.Buffer<(Text, Float)>(0);

		buffer.add(("xevnm-gaaaa-aaaar-qafnq-cai", 1.0));

		for (args in getPoolAgs().vals()) {

			switch (await swapFactory.getPool(args)) {
				case (#ok(poolData)) {
					let swapPool : SwapPool.Service = actor (Principal.toText(poolData.canisterId));

					switch (await swapPool.metadata()) {
						case (#ok({ sqrtPriceX96; token0; token1 })) {

							let decimals0 = getDecimals(token0.address);
							let decimals1 = getDecimals(token1.address);

							let price_ = getPrice(sqrtPriceX96, decimals0, decimals1);

							// buffer.add(("raw price", price_));

							buffer.add(orderPriceBasedOnStablecoin(token0.address, token1.address, price_));

						};
						case (_) {};
					};
				};
				case (#err(_)) {};
			};

		};

		return Buffer.toArray(buffer);
	};

	func orderPriceBasedOnStablecoin(token0 : Text, token1 : Text, price : Float) : (Text, Float) {
		let ckUSDC = "xevnm-gaaaa-aaaar-qafnq-cai";
		// let dusd = "irorr-5aaaa-aaaak-qddsq-cai";
		// let ckUSDT = "cngnf-vqaaa-aaaar-qag4q-cai";

		// price is token1 usd price / token0 usd price
		if (token0 == ckUSDC /* or token0 == ckUSDT or token0 == dusd */) {
			// Round to 8 decimal places for consistency
			return (token1, roundToDecimals(price, 8));
		} else if (token1 == ckUSDC /* or token1 == ckUSDT or token1 == dusd */) {
			// Improved precision for division with rounding
			let inversePrice = 1.0 / price;
			return (token0, roundToDecimals(inversePrice, 8));
		};

		return (token1, roundToDecimals(price, 8)); // exchange rate base/quote token
	};

	// Helper function to round a float to a specific number of decimal places. give precision to given decimal places
	func roundToDecimals(value : Float, decimals : Nat) : Float {
		let factor = Float.pow(10, Float.fromInt(decimals));
		let rounded = Float.nearest(value * factor);
		return rounded / factor;
	};

	/**
     * Get the price of a token from a pool
     * @param sqrtPriceX96 - The sqrt price x96
     * @param decimals0 - The decimals of the token0
     * @param decimals1 - The decimals of the token1
     * @return - The price of the token
     * @dev This is implemented in the SwapCalculator canister [https://github.com/ICPSwap-Labs/icpswap-calculator/blob/f68540cfbfb16200c026b6abcf5c5a150f2db9e9/src/SwapCalculator.mo#L28]
     */
	func getPrice(sqrtPriceX96 : Nat, decimals0 : Nat, decimals1 : Nat) : Float {

		let DECIMALS = 10000000;

		let part1 = sqrtPriceX96 ** 2 * 10 ** decimals0 * DECIMALS;
		let part2 = Q192 * 10 ** decimals1;
		let priceWithDecimals = Float.div(Float.fromInt(part1), Float.fromInt(part2));
		return Float.div(priceWithDecimals, Float.fromInt(DECIMALS));
	};

	func getPoolAgs() : [SwapFactory.GetPoolArgs] {
		let tokenMap = {
			DUSD = "irorr-5aaaa-aaaak-qddsq-cai";
			ICP = "ryjl3-tyaaa-aaaaa-aaaba-cai";
			ckUSDC = "xevnm-gaaaa-aaaar-qafnq-cai";
			ckBTC = "mxzaz-hqaaa-aaaar-qaada-cai";
			ckETH = "ss2fx-dyaaa-aaaar-qacoq-cai";
			ckUSDT = "cngnf-vqaaa-aaaar-qag4q-cai";
		};

		let tokenPairs : [SwapFactory.GetPoolArgs] = [
			// {
			//     token0 = { address = tokenMap.DUSD; standard = "ICRC2" };
			//     token1 = { address = tokenMap.ICP; standard = "ICRC2" };
			//     fee = 3000;
			// }, // DUSD ⇄ ICP
			{
				token0 = { address = tokenMap.DUSD; standard = "ICRC2" };
				token1 = { address = tokenMap.ckUSDC; standard = "ICRC2" };
				fee = 3000;
			}, // DUSD ⇄ ckUSDC
			// {
			//     token0 = { address = tokenMap.DUSD; standard = "ICRC2" };
			//     token1 = { address = tokenMap.ckBTC; standard = "ICRC2" };
			//     fee = 3000;
			// }, // DUSD ⇄ ckBTC
			// {
			//     token0 = { address = tokenMap.DUSD; standard = "ICRC2" };
			//     token1 = { address = tokenMap.ckETH; standard = "ICRC2" };
			//     fee = 3000;
			// }, // DUSD ⇄ ckETH
			// {
			//     token0 = { address = tokenMap.ckUSDT; standard = "ICRC2" };
			//     token1 = { address = tokenMap.DUSD; standard = "ICRC2" };
			//     fee = 3000;
			// }, // DUSD ⇄ ckUSDT
			{
				token0 = { address = tokenMap.ICP; standard = "ICRC2" };
				token1 = { address = tokenMap.ckUSDC; standard = "ICRC2" };
				fee = 3000;
			}, // ICP ⇄ ckUSDC
			// {
			//     token0 = { address = tokenMap.ckBTC; standard = "ICRC2" };
			//     token1 = { address = tokenMap.ICP; standard = "ICRC2" };
			//     fee = 3000;
			// }, // ICP ⇄ ckBTC
			// {
			//     token0 = { address = tokenMap.ICP; standard = "ICRC2" };
			//     token1 = { address = tokenMap.ckETH; standard = "ICRC2" };
			//     fee = 3000;
			// }, // ICP ⇄ ckETH
			{
				token0 = { address = tokenMap.ckBTC; standard = "ICRC2" };
				token1 = { address = tokenMap.ckUSDC; standard = "ICRC2" };
				fee = 3000;
			}, // ckUSDC ⇄ ckBTC
			{
				token0 = { address = tokenMap.ckETH; standard = "ICRC2" };
				token1 = { address = tokenMap.ckUSDC; standard = "ICRC2" };
				fee = 3000;
			}, // ckUSDC ⇄ ckETH
			{
				token0 = { address = tokenMap.ckUSDT; standard = "ICRC2" };
				token1 = { address = tokenMap.ckUSDC; standard = "ICRC2" };
				fee = 3000;
			}, // ckUSDC ⇄ ckUSDT
			// {
			//     token0 = { address = tokenMap.ckBTC; standard = "ICRC2" };
			//     token1 = { address = tokenMap.ckETH; standard = "ICRC2" };
			//     fee = 3000;
			// }, // ckBTC ⇄ ckETH
			// {
			//     token0 = { address = tokenMap.ckUSDT; standard = "ICRC2" };
			//     token1 = { address = tokenMap.ckBTC; standard = "ICRC2" };
			//     fee = 3000;
			// }, // ckBTC ⇄ ckUSDT
			// {
			//     token0 = { address = tokenMap.ckUSDT; standard = "ICRC2" };
			//     token1 = { address = tokenMap.ckETH; standard = "ICRC2" };
			//     fee = 3000;
			// } // ckETH ⇄ ckUSDT
		];

		return tokenPairs;
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

	module SwapFactory {
		public type Error = {
			#CommonError;
			#InternalError : Text;
			#UnsupportedToken : Text;
			#InsufficientFunds;
		};

		public type Token = { address : Text; standard : Text };
		public type GetPoolArgs = { fee : Nat; token0 : Token; token1 : Token };

		public type PoolData = {
			fee : Nat;
			key : Text;
			tickSpacing : Int;
			token0 : Token;
			token1 : Token;
			canisterId : Principal;
		};

		public type Result_4 = { #ok : [PoolData]; #err : Error };
		public type Result_8 = { #ok : PoolData; #err : Error };

		public type Service = actor {
			getPool : shared query GetPoolArgs -> async Result_8;
			getPools : shared query () -> async Result_4;
		};
	};

	module NodeIndex {
		public type PublicTokenOverview = {
			id : Nat;
			volumeUSD1d : Float;
			volumeUSD7d : Float;
			totalVolumeUSD : Float;
			name : Text;
			volumeUSD : Float;
			feesUSD : Float;
			priceUSDChange : Float;
			address : Text;
			txCount : Int;
			priceUSD : Float;
			standard : Text;
			symbol : Text;
		};
		public type Service = actor {
			allTokenStorage : shared query () -> async [Text];
			getAllTokens : shared query () -> async [PublicTokenOverview];
			tokenStorage : shared query Text -> async ?Text;
		};
	};

	module TokenStorage {
		public type PoolInfo = {
			fee : Int;
			token0Id : Text;
			token1Id : Text;
			pool : Text;
			token1Price : Float;
			token1Standard : Text;
			token1Decimals : Float;
			token0Standard : Text;
			token0Symbol : Text;
			token0Decimals : Float;
			token0Price : Float;
			token1Symbol : Text;
		};
		public type PublicTokenChartDayData = {
			id : Int;
			volumeUSD : Float;
			timestamp : Int;
			txCount : Int;
		};
		public type PublicTokenPricesData = {
			id : Int;
			low : Float;
			high : Float;
			close : Float;
			open : Float;
			timestamp : Int;
		};

		public type Service = actor {
			getPoolsForToken : shared query Text -> async [PoolInfo];
			getTokenChartData : shared query (Text, Nat, Nat) -> async [
				PublicTokenChartDayData
			];
			getTokenPricesData : shared query (Text, Int, Int, Nat) -> async [
				PublicTokenPricesData
			];
		};
	};

};

// ICP -> moe7a-tiaaa-aaaag-qclfq-cai
// ckUSDC -> moe7a-tiaaa-aaaag-qclfq-cai
// ckBTC -> moe7a-tiaaa-aaaag-qclfq-cai
// ckETH -> moe7a-tiaaa-aaaag-qclfq-cai
// ckUSDT -> moe7a-tiaaa-aaaag-qclfq-cai

// Token address constants
// let tokenMap = {
//     DUSD = "irorr-5aaaa-aaaak-qddsq-cai";
//     ICP = "ryjl3-tyaaa-aaaaa-aaaba-cai";
//     ckUSDC = "xevnm-gaaaa-aaaar-qafnq-cai";
//     ckBTC = "mxzaz-hqaaa-aaaar-qaada-cai";
//     ckETH = "ss2fx-dyaaa-aaaar-qacoq-cai";
//     ckUSDT = "cngnf-vqaaa-aaaar-qag4q-cai";
// };
