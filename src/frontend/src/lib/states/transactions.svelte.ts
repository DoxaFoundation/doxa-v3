import type { NextTxsState, TransactionsState } from '$lib/types/states';
import type { TransformedTransactions } from '$lib/types/transactions';

export const transactionsState: TransactionsState = $state({});
export const nextTxsState: NextTxsState = $state({});

export const storeNextTransactionsToFetch = (
	canisterId: string,
	oldest_tx_id: [] | [bigint],
	last_fetch_id?: bigint
) => {
	nextTxsState[canisterId] = {
		oldest_tx_id: oldest_tx_id[0],
		last_fetch_id
	};
};

export const storeTransactions = (canisterId: string, transactions: TransformedTransactions) => {
	transactionsState[canisterId] = transactions;
};
