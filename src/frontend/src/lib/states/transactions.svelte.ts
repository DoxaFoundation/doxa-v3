import type { NextTxsState, TransactionsState } from '$lib/types/states';
import type { TransformedTransactions } from '$lib/types/transactions';

export const transactionsState: TransactionsState = $state({});
export const nextTxsState: NextTxsState = $state({});

export const storeNextTransactionsToFetch = (
	ledger_id: string,
	oldest_tx_id: [] | [bigint],
	last_fetch_id?: bigint
) => {
	nextTxsState[ledger_id] = {
		oldest_tx_id: oldest_tx_id[0],
		last_fetch_id
	};
};

export const storeTransactions = (ledger_id: string, transactions: TransformedTransactions) => {
	transactionsState[ledger_id] = transactions;
};
