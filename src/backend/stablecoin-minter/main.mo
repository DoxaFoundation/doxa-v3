import ckUSDC "canister:ckusdc_ledger";
import USDx "canister:usdx_ledger";
import Result "mo:base/Result";
import Nat "mo:base/Nat";
import Principal "mo:base/Principal";
import Map "mo:map/Map";
import U "../Utils";

actor StablecoinMinter {
	type Result<Ok, Err> = Result.Result<Ok, Err>;

	type USDxBlockIndex = USDx.BlockIndex;
	type CkUSDCBlockIndex = ckUSDC.BlockIndex;
	type NotifyError = {
		#AlreadyProcessed : { blockIndex : Nat };
		#InvalidTransaction : Text;
		#Other : { error_message : Text; error_code : Nat64 };

	};

	type Tokens = {
		#USDx;
	};

	type NotifyMintWithCkusdcResult = Result<USDxBlockIndex, NotifyError>;

	let { nhash } = Map;

	private stable let processedMintWithCkusdc = Map.new<CkUSDCBlockIndex, USDxBlockIndex>();

	public query func get_ckusdc_reserve_account_of({ token : Tokens }) : async ckUSDC.Account {
		getCkUsdcReserveAccount(token);
	};

	public shared ({ caller }) func notify_mint_with_ckusdc({
		ckusdc_block_index : CkUSDCBlockIndex;
		minting_token : Tokens;
	}) : async NotifyMintWithCkusdcResult {
		U.trapAnonymous caller;

		switch (Map.get(processedMintWithCkusdc, nhash, ckusdc_block_index)) {
			case (?usdxBI) {
				return #err(#AlreadyProcessed { blockIndex = usdxBI });
			};
			case (null) {};
		};

		#ok(1);
	};

	func getCkUsdcReserveAccount(_token : Tokens) : ckUSDC.Account {
		// switch (token) {
		//     case (#USDx) {
		{
			owner = Principal.fromActor(StablecoinMinter);
			subaccount = ?U.toSubAccount(1);
		};
		//     };
		// };
	};

	func tokenNameInText(token : Tokens) : Text {
		switch (token) {
			case (#USDx) { "USDx" };
		};
	};

	func _validateCkUsdcBlockForMint(ckusdcBI : CkUSDCBlockIndex, caller : Principal, token : Tokens) : async Result<(), NotifyError> {

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

		//     ↧↧↧↧↧↧↧↧↧↧↧↧↧↧↧↧↧↧↧↧↧↧↧↧↧↧↧↧↧↧↧↧↧↧↧↧↧↧↧↧↧↧↧↧↧↧↧↧

		// {
		//     archived_transactions : [{
		//         callback : QueryArchiveFn;
		//         length : Nat;
		//         start : TxIndex;
		//     }];
		//     first_index : TxIndex;
		//     log_length : Nat;
		//     transactions : [Transaction];
		// };

		// record {
		//     burn : opt Burn;
		//     kind : text;
		//     mint : opt Mint;
		//     approve : opt Approve;
		//     timestamp : Timestamp;
		//     transfer : opt Transfer;
		// };

		// type Transfer = record {
		//     to : Account;
		//     fee : opt nat;
		//     from : Account;
		//     memo : opt blob;
		//     created_at_time : opt Timestamp;
		//     amount : nat;
		//     spender : opt Account;
		// };
		#ok();
	};

};
