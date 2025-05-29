import { get } from 'svelte/store';
import { authStore } from '@stores/auth.store';
import { storeNextTransactionsToFetch, storeTransactions } from '$lib/states/transactions.svelte';
import { getIcrcLedgerAndIndexCanisterIds } from '@utils/icrc-ledger.utils';
import { toast } from 'svelte-sonner';
import { getTransactions, ledgerId } from '$lib/api/icrc.index.api';
import { encodeIcrcAccount, type GetIndexNgAccountTransactionsParams } from '@dfinity/ledger-icrc';
import type { Principal } from '@dfinity/principal';
import type {
	Approve,
	Burn,
	Mint,
	Subaccount,
	Transfer
} from '@dfinity/ledger-icrc/dist/candid/icrc_ledger';
import type { TransactionWithId } from '@dfinity/ledger-icrc/dist/candid/icrc_index-ng';
import type {
	AliasAccount,
	PrincipalNameMap,
	TimestampAndDateTime,
	TransactionType,
	TransformedTransaction,
	TransformedTransactions
} from '$lib/types/transactions';
import { poolsMap } from '@states/swap-pool-data.svelte';
import { LedgerMetadata } from '@states/ledger-metadata.svelte';
import type { PoolData } from '@declarations/SwapFactory/SwapFactory.did';
import { STAKING_ACCOUNT } from '@constants/staking.constants';
import { RESERVE_ACCOUNT } from '@constants/app.constants';
import type { Account } from '@dfinity/ledger-icp';
import { formatLocalDate } from '@utils/date-time.utils';
import { fromBigIntDecimals } from '@utils/decimals.utils';
import { memoToHex } from '@utils/transaction.utils';

let map: PrincipalNameMap | undefined;
let swapPoolIds: Array<string> = [];

export const fetchInitialIcrcTransactions = async () => {
	try {
		const { principal } = get(authStore);
		const args = getAccountTransactionsArgs(principal);

		const icrcIndexCanisterIds = getIcrcLedgerAndIndexCanisterIds();

		map = getPrincipalNameMap();
		swapPoolIds = Array.from(poolsMap.values()).map((pool) => pool.canisterId.toString());

		await Promise.all(
			icrcIndexCanisterIds.map(async ({ ledger_id, index_id }) => {
				try {
					const { balance, oldest_tx_id, transactions } = await getTransactions({
						canisterId: index_id,
						...args
					});

					storeNextTransactionsToFetch(
						ledger_id,
						oldest_tx_id,
						transactions[transactions.length - 1]?.id
					);

					transformAndStoreTransactions(ledger_id, transactions);
				} catch (error) {
					console.error(`Error fetching transactions for ${ledger_id}`, error);
					toast.error(
						`Failed fetching transactions history for ${LedgerMetadata[ledger_id]?.name ?? ledger_id}`
					);
				}
			})
		);
		map = undefined;
		swapPoolIds = [];
	} catch (error) {
		console.error('Error fetching transactions', error);

		toast.error('Failed fetching transactions history');
		map = undefined;
		swapPoolIds = [];
	}
};

const transformAndStoreTransactions = (
	canisterId: string,
	transactions: Array<TransactionWithId>
) => {
	const transformedTransactions = transformTransactions(canisterId, transactions);
	storeTransactions(canisterId, transformedTransactions);
};

const transformTransactions = (
	canisterId: string,
	transactions: Array<TransactionWithId>
): TransformedTransactions => {
	return transactions.map((txwithId) => transformSingleTx(txwithId, canisterId));
};

const transformSingleTx = (
	{ id, transaction }: TransactionWithId,
	canisterId: string
): TransformedTransaction => {
	const { transfer, approve, mint, burn, kind, timestamp } = transaction;

	if (transfer[0]) {
		return transformTransferTx(transfer[0], timestamp, id, canisterId);
	} else if (approve[0]) {
		return transformApproveTx(approve[0], timestamp, id, canisterId);
	} else if (mint[0]) {
		return transformMintTx(mint[0], timestamp, id, canisterId);
	} else if (burn[0]) {
		return transformBurnTx(burn[0], timestamp, id, canisterId);
	} else {
		throw new Error('Unknown transaction type');
	}
};

const transformTransferTx = (
	transfer: Transfer,
	timestamp: bigint,
	id: bigint,
	ledger_id: string
): TransformedTransaction => {
	return {
		ledgerId: ledger_id,
		block_id: Number(id),
		type: getTransferType({
			from: transfer.from,
			to: transfer.to,
			userPrincipal: get(authStore).principal
		}),
		at: getTimestampAndDateTime(timestamp),
		to: getAliasAccount(transfer.to),
		from: getAliasAccount(transfer.from),
		memo: memoToHex(transfer.memo),
		created_at_time: getTimestampAndDateTimeOptional(transfer.created_at_time),
		amount: fromBigIntDecimals(transfer.amount, ledger_id),
		spender: transfer.spender[0] ? getAliasAccount(transfer.spender[0]) : undefined
	};
};

const transformApproveTx = (
	approve: Approve,
	timestamp: bigint,
	id: bigint,
	ledger_id: string
): TransformedTransaction => {
	return {
		ledgerId: ledger_id,
		block_id: Number(id),
		type: 'Approve',
		at: getTimestampAndDateTime(timestamp),
		from: getAliasAccount(approve.from),
		memo: memoToHex(approve.memo),
		created_at_time: getTimestampAndDateTimeOptional(approve.created_at_time),
		amount: fromBigIntDecimals(approve.amount, ledger_id),
		expected_allowance: approve.expected_allowance[0]
			? fromBigIntDecimals(approve.expected_allowance[0], ledger_id)
			: undefined,
		expires_at: getTimestampAndDateTimeOptional(approve.expires_at),
		spender: getAliasAccount(approve.spender)
	};
};

const transformMintTx = (
	mint: Mint,
	timestamp: bigint,
	id: bigint,
	ledger_id: string
): TransformedTransaction => {
	return {
		ledgerId: ledger_id,
		block_id: Number(id),
		type: 'Mint',
		at: getTimestampAndDateTime(timestamp),
		to: getAliasAccount(mint.to),
		memo: memoToHex(mint.memo),
		created_at_time: getTimestampAndDateTimeOptional(mint.created_at_time),
		amount: fromBigIntDecimals(mint.amount, ledger_id)
	};
};

const transformBurnTx = (
	burn: Burn,
	timestamp: bigint,
	id: bigint,
	ledger_id: string
): TransformedTransaction => {
	return {
		ledgerId: ledger_id,
		block_id: Number(id),
		type: 'Burn',
		at: getTimestampAndDateTime(timestamp),
		from: getAliasAccount(burn.from),
		memo: memoToHex(burn.memo),
		created_at_time: getTimestampAndDateTimeOptional(burn.created_at_time),
		amount: fromBigIntDecimals(burn.amount, ledger_id),
		spender: burn.spender[0] ? getAliasAccount(burn.spender[0]) : undefined
	};
};

const getPrincipalNameMap = () => {
	const principalNameMap = new Map<string, string>();

	poolsMap.forEach((pool) => {
		principalNameMap.set(pool.canisterId.toString(), createPrincipalNameFromPool(pool));
	});

	principalNameMap.set(get(authStore).principal.toString(), 'Your Account');
	principalNameMap.set(
		encodeIcrcAccount({
			owner: STAKING_ACCOUNT.owner,
			subaccount: STAKING_ACCOUNT.subaccount[0]
		}),
		'Staking'
	);

	principalNameMap.set(
		encodeIcrcAccount({
			owner: RESERVE_ACCOUNT.owner,
			subaccount: RESERVE_ACCOUNT.subaccount[0]
		}),
		'DUSD Reserve'
	);

	return principalNameMap;
};

const createPrincipalNameFromPool = (pool: PoolData) => {
	return `${LedgerMetadata[pool.token1.address]?.symbol ?? pool.token1.address} - ${
		LedgerMetadata[pool.token0.address]?.symbol ?? pool.token0.address
	} Swap Pool`;
};

const getAccountTransactionsArgs = (
	principal: Principal,
	max_results: number = 100,
	start?: bigint,
	subaccount?: Subaccount
): GetIndexNgAccountTransactionsParams => ({
	max_results: BigInt(max_results),
	start,
	account: {
		owner: principal,
		subaccount
	},
	certified: false
});

const getTransferType = ({
	from,
	to,
	userPrincipal
}: {
	to: Account;
	from: Account;
	userPrincipal: Principal;
}): TransactionType => {
	if (userPrincipal.compareTo(from.owner) === 'eq') {
		return swapPoolIds.includes(to.owner.toString()) ? 'Swap' : 'Send';
	} else if (userPrincipal.compareTo(to.owner) === 'eq') {
		return swapPoolIds.includes(from.owner.toString()) ? 'Swap' : 'Receive';
	}
	return 'Transfer';
};

const getAliasAccount = ({ owner, subaccount }: Account): AliasAccount => {
	return {
		name: map?.get(owner.toString()),
		encodedAccount: encodeIcrcAccount({ owner, subaccount: subaccount[0] })
	};
};

const getTimestampAndDateTime = (timestamp: bigint): TimestampAndDateTime => {
	return {
		timestamp: Number(timestamp) / 1_000_000, //convert to milliseconds
		local_date_time: formatLocalDate(timestamp)
	};
};

const getTimestampAndDateTimeOptional = (
	timestamp: [] | [bigint]
): TimestampAndDateTime | undefined => {
	return timestamp[0] ? getTimestampAndDateTime(timestamp[0]) : undefined;
};
