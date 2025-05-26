export interface AliasAccount {
	name?: string;
	encodedAccount: string;
}

export interface TimestampAndDateTime {
	timestamp: number; // timestamp in mi
	local_date_time: string;
}

export type TransactionType =
	| 'Transfer'
	| 'Approve'
	| 'Burn'
	| 'Mint'
	| 'Send'
	| 'Receive'
	| 'Swap'
	| 'Stake';

export interface TransformedTransaction {
	ledgerId: string;
	block_id: number; // Block Index
	type: TransactionType;
	at: TimestampAndDateTime;
	to?: AliasAccount; // not available for approve tx
	// fee: number; // for Transfer and Approve there is a fee . for Mint and Burn there is no fee
	from?: AliasAccount; // not available for mint tx
	memo?: string;
	created_at_time?: TimestampAndDateTime;
	amount: number;
	spender?: AliasAccount;
	expected_allowance?: number;
	expires_at?: TimestampAndDateTime;
}
export interface TransformedICPTransaction {
	ledgerId: string;
	block_id: number; // Block Index
	type: TransactionType;
	at?: TimestampAndDateTime;
	to?: AliasAccount; // not available for approve tx
	// fee: number; // for Transfer and Approve there is a fee of 0.0001 ICP. for Mint and Burn there is no fee
	memo: number;
	from?: AliasAccount; // not available for mint tx
	icrc1_memo?: string;
	created_at_time?: TimestampAndDateTime;
	amount: number;
	spender?: AliasAccount;
	expected_allowance?: number;
	expires_at?: TimestampAndDateTime;
}

export type TransformedTransactions = Array<TransformedTransaction | TransformedICPTransaction>;

export interface NextTxs {
	last_fetch_id?: bigint; // last fetched transaction block index which can be passed as start arg of next getTransactions
	oldest_tx_id?: bigint; // the first transaction block index of this specific account in the icrc ledger
}

type PrincipalText = string;
type AliasName = string;
export type PrincipalNameMap = Map<PrincipalText, AliasName>;
