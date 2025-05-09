import { getIcpLedgerActor } from '$lib/actors/actor.icp.ledger';
import type { IcpLedgerActor } from '$lib/types/actors';
import type { TransferArgs, TransferResult } from '@dfinity/ledger-icp/dist/candid/ledger.d.ts';
import { isNullish } from '@dfinity/utils';
import { authStore } from '@stores/auth.store';
import { get } from 'svelte/store';

let canister: Record<string, IcpLedgerActor> | undefined = {};

export const transferICP = async (args: TransferArgs): Promise<TransferResult> => {
	const { transfer } = await icpLedgerCanister();

	return transfer(args);
};

const icpLedgerCanister = async (): Promise<IcpLedgerActor> => {
	const { principal } = get(authStore);

	const cacheKey = principal.toString();

	if (isNullish(canister) || isNullish(canister[cacheKey])) {
		const icpLedger = await getIcpLedgerActor();

		canister = {
			...(canister ?? {}),
			[cacheKey]: icpLedger
		};

		return icpLedger;
	}

	return canister[cacheKey];
};

// Function to reset the cache for testing purposes
export const _resetIcpLedgerCanisterForTesting = (): void => {
	canister = {}; // Reset to an empty object as per its initialization
};
