import type {
	GetIndexNgAccountTransactionsParams,
	IcrcIndexNgCanister
} from '@dfinity/ledger-icrc';
import type { CanisterApiFunctionParams } from '$lib/types/api';
import { getIcrcIndexNgCanister } from '$lib/actors/actor.icrc.index';
import type { QueryParams } from '@dfinity/utils';
import type { Principal } from '@dfinity/principal';
import type { GetTransactions } from '@dfinity/ledger-icrc/dist/candid/icrc_index-ng';

const indexCanisterCache = new Map<string, IcrcIndexNgCanister>();

export const getTransactions = async ({
	canisterId,
	...params
}: CanisterApiFunctionParams<GetIndexNgAccountTransactionsParams>): Promise<GetTransactions> => {
	const { getTransactions } = await icrcIndexNgCanister({
		canisterId
	});

	return getTransactions(params);
};

export const ledgerId = async ({
	canisterId,
	...params
}: CanisterApiFunctionParams<QueryParams>): Promise<Principal> => {
	const { ledgerId } = await icrcIndexNgCanister({
		canisterId
	});

	return ledgerId(params);
};

const icrcIndexNgCanister = async ({
	canisterId
}: CanisterApiFunctionParams): Promise<IcrcIndexNgCanister> => {
	// If a canister instance exists for the key, return it.
	if (indexCanisterCache.has(canisterId)) {
		return indexCanisterCache.get(canisterId)!;
	}

	// Otherwise, create a new instance and store it in the cache.
	const canisterInstance = await getIcrcIndexNgCanister(canisterId);

	indexCanisterCache.set(canisterId, canisterInstance);
	return canisterInstance;
};
