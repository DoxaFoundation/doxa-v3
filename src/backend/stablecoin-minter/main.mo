import Result "mo:base/Result";
import Nat "mo:base/Nat";
import Principal "mo:base/Principal";
import Nat64 "mo:base/Nat64";
import Time "mo:base/Time";
import Map "mo:map/Map";
import U "../Utils";
import Icrc "../service/icrc-interface";

actor StablecoinMinter {
	type Result<Ok, Err> = Result.Result<Ok, Err>;

	type Account = { owner : Principal; subaccount : ?Blob };

	type TransferArg = {
		to : Account;
		fee : ?Nat;
		memo : ?Blob;
		from_subaccount : ?Blob;
		created_at_time : ?Nat64;
		amount : Nat;
	};

	type DUSDBlockIndex = Nat;
	type CkUSDCBlockIndex = Nat;
	type NotifyError = {
		#AlreadyProcessed : { blockIndex : Nat };
		#InvalidTransaction : Text;
		#Other : { error_message : Text; error_code : Nat64 };

	};

	type Tokens = {
		#DUSD;
	};

	type NotifyMintWithCkusdcResult = Result<DUSDBlockIndex, NotifyError>;

	let ckUSDC : Icrc.Self = actor ("xevnm-gaaaa-aaaar-qafnq-cai");
	let DUSD : Icrc.Self = actor ("irorr-5aaaa-aaaak-qddsq-cai");

	let { nhash } = Map;

	private stable let processedMintWithCkusdc = Map.new<CkUSDCBlockIndex, DUSDBlockIndex>();

	public query func get_ckusdc_reserve_account_of({ token : Tokens }) : async Icrc.Account {
		getCkUsdcReserveAccount(token);
	};

	public shared ({ caller }) func notify_mint_with_ckusdc({
		ckusdc_block_index : CkUSDCBlockIndex;
		minting_token : Tokens;
	}) : async NotifyMintWithCkusdcResult {
		U.trapAnonymous caller;

		switch (Map.get(processedMintWithCkusdc, nhash, ckusdc_block_index)) {
			case (?dusdBI) {
				return #err(#AlreadyProcessed { blockIndex = dusdBI });
			};
			case (null) {};
		};

		let (mintAmount, mintTo) = switch (await validateCkUsdcBlockForMint(ckusdc_block_index, caller, minting_token)) {
			case (#ok(value)) { value : (Nat, Icrc.Account) };
			case (#err(error)) { return #err(error) };
		};

		let transferArg : Icrc.TransferArg = {
			amount = mintAmount;
			created_at_time = ?Nat64.fromIntWrap(Time.now());
			fee = null;
			from_subaccount = null;
			memo = null;
			to = mintTo : Account;
		};

		let dusdBlockIndex = switch (await DUSD.icrc1_transfer(transferArg)) {
			case (#Ok(value)) { value };
			case (#Err(error)) {
				return #err(#Other({ error_message = "DUSD Ledger Transfer Error: " #debug_show (error); error_code = 0 }));
			};
		};
		Map.set(processedMintWithCkusdc, nhash, ckusdc_block_index, dusdBlockIndex);
		#ok(dusdBlockIndex);
	};

	func getCkUsdcReserveAccount(_token : Tokens) : Icrc.Account {
		// switch (token) {
		//     case (#DUSD) {
		{
			owner = Principal.fromActor(StablecoinMinter);
			subaccount = U.toSubAccount(1);
		};
		//     };
		// };
	};

	func tokenNameInText(token : Tokens) : Text {
		switch (token) {
			case (#DUSD) { "DUSD" };
		};
	};

	func validateCkUsdcBlockForMint(ckusdcBI : CkUSDCBlockIndex, caller : Principal, token : Tokens) : async Result<(Nat, Icrc.Account), NotifyError> {

		let getTransactionsResponse = await ckUSDC.get_transactions({ start = ckusdcBI; length = 1 });

		let { transactions; log_length } = getTransactionsResponse;

		if (ckusdcBI >= log_length) {
			return #err(#InvalidTransaction("Invalid ckUSDC Block Index (" # Nat.toText(ckusdcBI) # ") log_length is " # Nat.toText(log_length)));
		};
		let transaction = transactions[0];

		// Check Transaction kind is transfer
		let transfer = switch (transaction.transfer) {
			case (?value) { value };
			case (null) {
				return #err(#InvalidTransaction("Notification transaction must be of type transfer not " # transaction.kind));
			};
		};

		// Check transfer.to is ckUSDC reserve_account (stablecoin minter account)
		let reserveAccount = getCkUsdcReserveAccount(token);
		if (reserveAccount != transfer.to) {
			return #err(
				#InvalidTransaction(
					"Destination account (" # debug_show (transfer.to)
					# ") in the transaction is not the reserve account of "
					# tokenNameInText(token) # " (" # debug_show (reserveAccount) # ")"
				)
			);
		};

		// Check transfer.from.owner is caller
		// if notEqual check caller is spender
		if (caller != transfer.from.owner) {
			switch (transfer.spender) {
				case (?spender) {
					if (caller != spender.owner) {
						return #err(
							#InvalidTransaction(
								"Notifier (" # Principal.toText(caller)
								# ") is neither spender (" # Principal.toText(spender.owner)
								# ") nor originator(" #Principal.toText(transfer.from.owner) # ")"
							)
						);
					};
				};
				case (null) {
					return #err(
						#InvalidTransaction(
							"Notifier principal (" # Principal.toText(caller) #
							")  and transaction originator principal (" # Principal.toText(transfer.from.owner) # ") are not the same"
						)
					);
				};
			};
		};

		// Check amount is above minimum 1USDC 1_000_000 (6 Decimal)
		if (transfer.amount < 1_000_000) {
			return #err(#InvalidTransaction("Transaction amount is less than 1 ckUSDC"));
		};

		#ok(transfer.amount, transfer.from);
	};

};
