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

// export const getSortedTransactions = (ledger_id: string): TransformedTransactions => {
//     const transactions = transactionsState[ledger_id] || [];
//     return [...transactions].sort((a, b) => {
//         return (b.at?.timestamp || 0) - (a.at?.timestamp || 0); // Sort in descending order (latest first)
//     });
// };

export const getSortedTransactions = (ledger_id: string): TransformedTransactions => {
	// Since transactions are already sorted from backend, just return them directly
	return transactionsState[ledger_id] || [];
};

export const getAllSortedTransactions = (): TransformedTransactions => {
	// Since individual ledger transactions are already sorted, we can optimize by:
	// 1. Getting all transactions
	// 2. Using a single sort operation on the combined array
	const allTransactions = Object.values(transactionsState).flat();

	// Only sort if we have transactions
	if (allTransactions.length === 0) return [];

	// Single sort operation on the combined array
	return allTransactions.sort((a, b) => (b.at?.timestamp || 0) - (a.at?.timestamp || 0));
};
