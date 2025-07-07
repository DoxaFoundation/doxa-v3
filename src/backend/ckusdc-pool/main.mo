import XRC "canister:exchange_rate_canister";
import Icrc "../service/icrc-interface";

import Cycles "mo:base/ExperimentalCycles";
import Timer "mo:base/Timer";
import Time "mo:base/Time";
import Int "mo:base/Int";
import Result "mo:base/Result";
import Principal "mo:base/Principal";
import Nat64 "mo:base/Nat64";
import Nat32 "mo:base/Nat32";
import Float "mo:base/Float";
import Buffer "mo:base/Buffer";
import U "../Utils";
import Env "../service/env";

actor CkusdcPool {
	type TimerId = Timer.TimerId;
	type Time = Time.Time;
	type Result<Ok, Err> = Result.Result<Ok, Err>;
	type Tokens = {
		#DUSD;
	};

	type XrcFetchError = {
		error_time : Time;
		error : XRC.ExchangeRateError;
	};
	type XrcFetcheResult = Result<(), XrcFetchError>;
	type ResultErrorLog = {
		timestamp : Nat64;
		error : {
			#ExchangeRateError : XRC.ExchangeRateError;
			#CkUDSCTransferError : Icrc.TransferError;
			#DUSDBurnTransferError : Icrc.TransferError;
			#FailedToAdjustReserve : Tokens;
		};
	};

	type RewardApprovalArg = {
		memo : ?Blob;
		created_at_time : ?Nat64;
		amount : Nat;
		expires_at : ?Nat64;
	};

	type RewardApprovalErr = {
		#NotAuthorised;
		#LedgerApprovalError : Icrc.ApproveError;
	};

	let ckUSDC : Icrc.Self = actor ("xevnm-gaaaa-aaaar-qafnq-cai");
	let DUSD : Icrc.Self = actor (Env.dusd_ledger);

	let errorResultLog = Buffer.Buffer<ResultErrorLog>(0);

	stable var usdUsdc = { rateF : Float = 0; timestamp : Nat64 = 0 };
	stable var timerId : TimerId = 0;

	func getUsdUsdcRate() : async XRC.GetExchangeRateResult {
		let base_asset = { symbol = "USD"; class_ = #FiatCurrency };
		let quote_asset = { symbol = "USDC"; class_ = #Cryptocurrency };
		let timestamp = ?(U.timeNowInNat64() / (10 ** 9));

		Cycles.add<system>(10_000_000_000);
		await XRC.get_exchange_rate({
			base_asset;
			quote_asset;
			timestamp;
		});
	};

	func fetchXrcRate() : async () {
		let getExchangeRateResult = await getUsdUsdcRate();
		let { rate; metadata; timestamp } : XRC.ExchangeRate = switch (getExchangeRateResult) {
			case (#Ok(value)) { value };
			case (#Err(error)) {
				return errorResultLog.add({
					timestamp = U.timeNowInNat64();
					error = #ExchangeRateError error;
				});
			};
		};
		let newRate = rateInFloat(metadata.decimals, rate);
		usdUsdc := { rateF = newRate; timestamp };

	};

	func adjustDUSDReserve() : async () {
		//When USD/USDC Rate is Above 1 (USDC Depreciates)
		if (usdUsdc.rateF > 1) {
			// Add more USDC or Burn DUSD supply
			let issuedDUSD = from6DecimalToFloat(await DUSD.icrc1_total_supply()); //
			let expectedCkusdcInReserve = issuedDUSD * usdUsdc.rateF;
			let currentCkusdcInReserve = from6DecimalToFloat(await getCurrentReserveOfDUSD()); //

			if (expectedCkusdcInReserve > currentCkusdcInReserve) {
				// Add more USDC or Burn DUSD
				let ckUsdcToAdd = fromFloatTo6Decimals(expectedCkusdcInReserve - currentCkusdcInReserve);
				await handleCkusdcOrBurnDusd(ckUsdcToAdd);
			};
		};
	};

	func handleCkusdcOrBurnDusd(amount : Nat) : async () {
		let ckusdcPoolBalance = await getCkUsdcPoolBalance();
		let ckUsdcInNeed = amount + 10_000;
		if (ckusdcPoolBalance >= ckUsdcInNeed) {
			await transferCkusdcToReserve(amount);
		} else {
			// send some ckUSDC and burn Dusd
			await xferAvailableCkusdcAndBurnDUSD(ckusdcPoolBalance);
		};
	};

	func xferAvailableCkusdcAndBurnDUSD(ckUsdcBalance : Nat) : async () {
		var addedCkusdc : Nat = 0;
		if (ckUsdcBalance >= 20_000) {
			addedCkusdc := ckUsdcBalance - 10_000;
			await transferCkusdcToReserve(addedCkusdc);
		};
		let currentCkUSReserveBalance : Float = from6DecimalToFloat(await getCurrentReserveOfDUSD()); //
		let expectedDUSDTotalSupply : Float = currentCkUSReserveBalance / usdUsdc.rateF;
		let currentDUSDTotalSupply : Float = from6DecimalToFloat(await DUSD.icrc1_total_supply()); //

		if (expectedDUSDTotalSupply < currentDUSDTotalSupply) {
			let burnAmountF : Float = currentDUSDTotalSupply - expectedDUSDTotalSupply;
			let burnAmount : Nat = fromFloatTo6Decimals(burnAmountF);

			// Get DUSD from Staking Canister for Burning
			await getDusdFromStakingCanisterForBurning(burnAmount);

			// Get DUSD Balance of Pool
			let dusdBalanceOfPool : Nat = await getDusdBalanceOfPool();

			// Burning only if CkUSDC Pool have enough DUSD balance
			if (burnAmount <= dusdBalanceOfPool) {
				await burnDusd(burnAmount);
			} else {
				recordFailedToAdjustReserve();
			};
		};
	};

	func getDusdFromStakingCanisterForBurning(burnAmount : Nat) : async () {
		let dusdBalanceOfPool : Nat = await getDusdBalanceOfPool();

		if (burnAmount > dusdBalanceOfPool) {

			let stakingCanister : actor {
				get_dusd_for_maintaining_peg : (Nat) -> async Result.Result<(), Text>;
			} = actor (Env.staking_canister);

			let _transferResult = await stakingCanister.get_dusd_for_maintaining_peg(burnAmount - dusdBalanceOfPool);
		};

	};

	func recordFailedToAdjustReserve() : () {
		errorResultLog.add({
			timestamp = U.timeNowInNat64();
			error = #FailedToAdjustReserve(#DUSD);
		});
	};

	func transferCkusdcToReserve(amount : Nat) : async () {
		let transferResult = await ckUSDC.icrc1_transfer({
			to = getCkUsdcReserveAccount(#DUSD);
			amount;
			fee = null;
			memo = null;
			from_subaccount = null;
			created_at_time = ?U.timeNowInNat64();
		});

		switch (transferResult) {
			case (#Ok(value)) {};
			case (#Err(error)) {
				errorResultLog.add({
					timestamp = U.timeNowInNat64();
					error = #CkUDSCTransferError error;
				});
			};
		};
	};

	func burnDusd(amount : Nat) : async () {
		let dusdTransferResult = await DUSD.icrc1_transfer({
			to = getDUSDMinterAccount();
			amount;
			fee = null;
			memo = null;
			from_subaccount = null;
			created_at_time = ?U.timeNowInNat64();
		});

		switch (dusdTransferResult) {
			case (#Ok(value)) {};
			case (#Err(error)) {
				errorResultLog.add({
					timestamp = U.timeNowInNat64();
					error = #DUSDBurnTransferError error;
				});
			};
		};
	};

	func fromDecimalToFloat(decimals : Float, value : Nat) : Float {
		return Float.fromInt(value) / (10 ** decimals);
	};

	func from6DecimalToFloat(value : Nat) : Float {
		fromDecimalToFloat(6, value);
	};

	func fromFloatTo6Decimals(value : Float) : Nat {
		Int.abs(Float.toInt((value * (10 ** 6))));
	};

	func rateInFloat(xrcDecimal : Nat32, rate : Nat64) : Float {
		let decimalF : Float = Float.fromInt(Nat32.toNat xrcDecimal);
		let rateF : Float = Float.fromInt(Nat64.toNat rate);
		return rateF / (10 ** decimalF);
	};

	func getCkUsdcPoolBalance() : async Nat {
		await ckUSDC.icrc1_balance_of({
			owner = Principal.fromText(Env.ckusdc_pool);
			subaccount = null;
		});
	};

	func getDusdBalanceOfPool() : async Nat {
		await DUSD.icrc1_balance_of({
			owner = Principal.fromText(Env.ckusdc_pool);
			subaccount = null;
		});
	};

	func _getDUSDTotalSupply() : async Nat {
		await DUSD.icrc1_total_supply();
	};

	func getCurrentReserveOfDUSD() : async Nat {
		await ckUSDC.icrc1_balance_of({
			owner = Principal.fromText(Env.stablecoin_minter);
			subaccount = U.toSubAccount(1);
		});
	};

	// func rateToSixDecimal(_xrcDecimal : Nat32, _rate : Nat64) : Nat {
	//     let rate = Nat64.toNat _rate;
	//     let xrcDecimal = Nat32.toNat _xrcDecimal;
	//     if (xrcDecimal > 6) {
	//         let subDecimal : Nat = xrcDecimal - 6;
	//         return rate / (10 ** subDecimal);
	//     } else {
	//         let addDecimal : Nat = 6 - xrcDecimal;
	//         return rate * (10 ** addDecimal);
	//     };
	// };

	func getCkUsdcReserveAccount(_token : Tokens) : Icrc.Account {
		{
			owner = Principal.fromText(Env.stablecoin_minter);
			subaccount = U.toSubAccount(1);
		};
	};

	func getDUSDMinterAccount() : Icrc.Account {
		{
			owner = Principal.fromText(Env.stablecoin_minter);
			subaccount = null;
		};
	};

	func fetchRateAndAdjustReserve() : async () {
		await fetchXrcRate();
		await adjustDUSDReserve();
	};

	/// Timer
	timerId := do {
		let oneMinInNanos = 60_000_000_000;
		let nextFetch = oneMinInNanos - (Time.now() % oneMinInNanos);
		// let bufferSec = 5_000_000_000;

		Timer.setTimer<system>(
			#nanoseconds(Int.abs nextFetch),
			func() : async () {
				timerId := Timer.recurringTimer<system>(#seconds 60, fetchRateAndAdjustReserve);
				await fetchRateAndAdjustReserve();
			}
		);
	};

	public query func get_error_result_log() : async [ResultErrorLog] {
		Buffer.toArray(errorResultLog);
	};

	public query func get_usd_usdc_rate() : async { rate : Float; timestamp : Nat64 } {
		{ rate = usdUsdc.rateF; timestamp = usdUsdc.timestamp };
	};

	public shared ({ caller }) func weekly_reward_approval({ memo; created_at_time; amount; expires_at } : RewardApprovalArg) : async Result<Nat, RewardApprovalErr> {
		let stakingCanister = Principal.fromText(Env.staking_canister);

		if (caller != stakingCanister) {
			return #err(#NotAuthorised);
		};

		let approveArg : Icrc.ApproveArgs = {
			fee = null;
			memo;
			from_subaccount = null;
			created_at_time;
			amount;
			expected_allowance = null;
			expires_at;
			spender = { owner = stakingCanister; subaccount = null }

		};

		switch (await DUSD.icrc2_approve(approveArg)) {
			case (#Ok(value)) { #ok(value) };
			case (#Err(error)) { #err(#LedgerApprovalError error) };
		};

	}

};
