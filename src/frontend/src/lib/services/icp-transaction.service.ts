import { getTransactions } from '$lib/api/icp.index.api';
import type {
	AliasAccount,
	PrincipalNameMap,
	TimestampAndDateTime,
	TransactionType,
	TransformedICPTransaction
} from '$lib/types/transactions';
import { ICP_LEDGER_CANISTER_ID, RESERVE_ACCOUNT } from '@constants/app.constants';
import { STAKING_ACCOUNT } from '@constants/staking.constants';
import type { PoolData } from '@declarations/SwapFactory/SwapFactory.did';
import {
	AccountIdentifier,
	SubAccount,
	type TimeStamp,
	type Tokens,
	type Transaction,
	type TransactionWithId
} from '@dfinity/ledger-icp';
import type { GetTransactionsParams } from '@dfinity/ledger-icp/dist/types/types/index.params';
import type { Principal } from '@dfinity/principal';
import { LedgerMetadata } from '@states/ledger-metadata.svelte';
import { poolsMap } from '@states/swap-pool-data.svelte';
import { storeNextTransactionsToFetch, storeTransactions } from '@states/transactions.svelte';
import { authStore } from '@stores/auth.store';
import { formatLocalDate } from '@utils/date-time.utils';
import { fromBigIntDecimals } from '@utils/decimals.utils';
import { memoToHex } from '@utils/transaction.utils';
import { toast } from 'svelte-sonner';
import { get } from 'svelte/store';

let map: PrincipalNameMap | undefined;
let swapPoolIds: Array<string> = [];

const createSwapPoolIds = () => {
	const user = get(authStore).principal;
	poolsMap.forEach((pool) => {
		swapPoolIds.push(
			AccountIdentifier.fromPrincipal({
				principal: pool.canisterId
			}).toHex()
		);

		swapPoolIds.push(
			AccountIdentifier.fromPrincipal({
				principal: pool.canisterId,
				subAccount: SubAccount.fromPrincipal(user)
			}).toHex()
		);
	});
};

export const fetchInitialIcpTransactions = async () => {
	try {
		const { principal } = get(authStore);
		const args = getTransactionsParams(principal);

		map = getPrincipalNameMap();
		createSwapPoolIds();

		const { balance, oldest_tx_id, transactions } = await getTransactions(args);

		storeNextTransactionsToFetch(
			ICP_LEDGER_CANISTER_ID,
			oldest_tx_id,
			transactions[transactions.length - 1]?.id
		);

		transformAndStoreTransactions(transactions);

		map = undefined;
		swapPoolIds = [];
	} catch (error) {
		console.error('Error fetching ICP transactions', error);

		toast.error('Failed fetching ICP transactions history');
		map = undefined;
		swapPoolIds = [];
	}
};

const transformAndStoreTransactions = (transactions: Array<TransactionWithId>) => {
	const transformedTransactions = transformTransactions(transactions);
	storeTransactions(ICP_LEDGER_CANISTER_ID, transformedTransactions);
};

const transformTransactions = (transactions: Array<TransactionWithId>) => {
	return transactions.map((txwithId) => transformSingleTx(txwithId));
};

const transformSingleTx = ({ id, transaction }: TransactionWithId): TransformedICPTransaction => {
	if ('Transfer' in transaction.operation) {
		return transformTransferTx(transaction.operation.Transfer, transaction, id);
	} else if ('Approve' in transaction.operation) {
		return transformApproveTx(transaction.operation.Approve, transaction, id);
	} else if ('Mint' in transaction.operation) {
		return transformMintTx(transaction.operation.Mint, transaction, id);
	} else if ('Burn' in transaction.operation) {
		return transformBurnTx(transaction.operation.Burn, transaction, id);
	} else {
		throw new Error('Unknown transaction type');
	}
};

const transformTransferTx = (
	transfer: {
		to: string;
		fee: Tokens;
		from: string;
		amount: Tokens;
		spender: [] | [string];
	},
	{ memo, icrc1_memo, timestamp, created_at_time }: Transaction,
	id: bigint
): TransformedICPTransaction => {
	return {
		ledgerId: ICP_LEDGER_CANISTER_ID,
		block_id: Number(id),
		type: getTransferType({
			from: transfer.from,
			to: transfer.to,
			userAccountId: AccountIdentifier.fromPrincipal({
				principal: get(authStore).principal
			}).toHex()
		}),
		to: getAliasAccount(transfer.to),
		from: getAliasAccount(transfer.from),
		amount: fromBigIntDecimals(transfer.amount.e8s, ICP_LEDGER_CANISTER_ID),
		memo: Number(memo),
		icrc1_memo: memoToHex(icrc1_memo),
		at: getTimestampAndDateTimeOptional(timestamp),
		created_at_time: getTimestampAndDateTimeOptional(created_at_time),
		spender: transfer.spender[0] ? getAliasAccount(transfer.spender[0]) : undefined
	};
};

const transformApproveTx = (
	approve: {
		fee: Tokens;
		from: string;
		allowance: Tokens;
		expected_allowance: [] | [Tokens];
		expires_at: [] | [TimeStamp];
		spender: string;
	},
	{ memo, icrc1_memo, timestamp, created_at_time }: Transaction,
	id: bigint
): TransformedICPTransaction => {
	return {
		ledgerId: ICP_LEDGER_CANISTER_ID,
		block_id: Number(id),
		type: 'Approve',
		from: getAliasAccount(approve.from),
		amount: fromBigIntDecimals(approve.allowance.e8s, ICP_LEDGER_CANISTER_ID),
		memo: Number(memo),
		icrc1_memo: memoToHex(icrc1_memo),
		at: getTimestampAndDateTimeOptional(timestamp),
		created_at_time: getTimestampAndDateTimeOptional(created_at_time),
		spender: getAliasAccount(approve.spender),
		expected_allowance: approve.expected_allowance[0]?.e8s
			? fromBigIntDecimals(approve.expected_allowance[0].e8s, ICP_LEDGER_CANISTER_ID)
			: undefined,
		expires_at: getTimestampAndDateTimeOptional(approve.expires_at)
	};
};

const transformMintTx = (
	mint: { to: string; amount: Tokens },
	{ memo, icrc1_memo, timestamp, created_at_time }: Transaction,
	id: bigint
): TransformedICPTransaction => {
	return {
		ledgerId: ICP_LEDGER_CANISTER_ID,
		block_id: Number(id),
		type: 'Mint',
		memo: Number(memo),
		icrc1_memo: memoToHex(icrc1_memo),
		at: getTimestampAndDateTimeOptional(timestamp),
		created_at_time: getTimestampAndDateTimeOptional(created_at_time),
		amount: fromBigIntDecimals(mint.amount.e8s, ICP_LEDGER_CANISTER_ID),
		to: getAliasAccount(mint.to)
	};
};

const transformBurnTx = (
	burn: { from: string; amount: Tokens; spender: [] | [string] },
	{ memo, icrc1_memo, timestamp, created_at_time }: Transaction,
	id: bigint
): TransformedICPTransaction => {
	return {
		ledgerId: ICP_LEDGER_CANISTER_ID,
		block_id: Number(id),
		type: 'Burn',
		from: getAliasAccount(burn.from),
		amount: fromBigIntDecimals(burn.amount.e8s, ICP_LEDGER_CANISTER_ID),
		spender: burn.spender[0] ? getAliasAccount(burn.spender[0]) : undefined,
		memo: Number(memo),
		icrc1_memo: memoToHex(icrc1_memo),
		at: getTimestampAndDateTimeOptional(timestamp),
		created_at_time: getTimestampAndDateTimeOptional(created_at_time)
	};
};

const getAliasAccount = (accountId: string): AliasAccount => {
	return {
		name: map?.get(accountId),
		encodedAccount: accountId
	};
};

const getPrincipalNameMap = () => {
	const principalNameMap = new Map<string, string>();

	const user = get(authStore).principal;

	poolsMap.forEach((pool) => {
		principalNameMap.set(
			AccountIdentifier.fromPrincipal({
				principal: pool.canisterId
			}).toHex(),
			createPrincipalNameFromPool(pool)
		);

		principalNameMap.set(
			AccountIdentifier.fromPrincipal({
				principal: pool.canisterId,
				subAccount: SubAccount.fromPrincipal(user)
			}).toHex(),
			createPrincipalNameFromPool(pool)
		);
	});

	principalNameMap.set(
		AccountIdentifier.fromPrincipal({
			principal: user
		}).toHex(),
		'Your Account'
	);

	principalNameMap.set(
		AccountIdentifier.fromPrincipal({
			principal: STAKING_ACCOUNT.owner
		}).toHex(),
		'Staking'
	);

	const array: number[] = new Array(32).fill(0);
	array[31] = 1;
	const subAccountResult = SubAccount.fromBytes(new Uint8Array(array));
	const subAccount = subAccountResult instanceof Error ? undefined : subAccountResult;
	principalNameMap.set(
		AccountIdentifier.fromPrincipal({
			principal: RESERVE_ACCOUNT.owner,
			subAccount
		}).toHex(),
		'DUSD Reserve'
	);

	return principalNameMap;
};

const createPrincipalNameFromPool = (pool: PoolData) => {
	return `${LedgerMetadata[pool.token1.address]?.symbol ?? pool.token1.address} - ${
		LedgerMetadata[pool.token0.address]?.symbol ?? pool.token0.address
	} Swap Pool`;
};

const getTimestampAndDateTimeOptional = (
	timestamp: [] | [TimeStamp]
): TimestampAndDateTime | undefined => {
	return timestamp[0]
		? {
				timestamp: Number(timestamp[0].timestamp_nanos) / 1_000_000, //convert to milliseconds
				local_date_time: formatLocalDate(timestamp[0].timestamp_nanos)
			}
		: undefined;
};

const getTransferType = ({
	from,
	to,
	userAccountId
}: {
	to: string;
	from: string;
	userAccountId: string;
}): TransactionType => {
	if (userAccountId === from) {
		return swapPoolIds.includes(to) ? 'Swap' : 'Send';
	} else if (userAccountId === to) {
		return swapPoolIds.includes(from) ? 'Swap' : 'Receive';
	}
	return 'Transfer';
};

const getTransactionsParams = (
	principal: Principal,
	maxResults: number = 100,
	start?: bigint,
	subAccount?: SubAccount
): GetTransactionsParams => ({
	maxResults: BigInt(maxResults),
	start,
	accountIdentifier: AccountIdentifier.fromPrincipal({ principal, subAccount }),
	certified: false
});
