import { getIcpIndexCanister } from '$lib/actors/actor.icp.index';
import type { GetAccountIdentifierTransactionsResponse, IndexCanister } from '@dfinity/ledger-icp';
import type { GetTransactionsParams } from '@dfinity/ledger-icp/dist/types/types/index.params';
import type { AccountBalanceParams } from '@dfinity/ledger-icp/dist/types/types/ledger.params';
import { isNullish } from '@dfinity/utils';

let icpIndexCanisterCache: IndexCanister | undefined;

export const accountBalance = async (args: AccountBalanceParams): Promise<bigint> => {
	const { accountBalance } = await icpIndexCanister();

	return accountBalance(args);
};

export const getTransactions = async (
	args: GetTransactionsParams
): Promise<GetAccountIdentifierTransactionsResponse> => {
	const { getTransactions } = await icpIndexCanister();
	return getTransactions(args);
};

const icpIndexCanister = async (): Promise<IndexCanister> => {
	if (isNullish(icpIndexCanisterCache)) {
		icpIndexCanisterCache = await getIcpIndexCanister();
	}
	return icpIndexCanisterCache;
};
