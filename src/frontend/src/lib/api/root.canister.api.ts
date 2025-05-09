import { getRootCanister } from '$lib/actors/actor.root-canister';
import type { RootActor } from '$lib/types/actors';
import type { EmailPermission, Result } from '@declarations/root_canister/root_canister.did';
import { isNullish } from '@dfinity/utils';
import { authStore } from '@stores/auth.store';
import { get } from 'svelte/store';

let canister: Record<string, RootActor> | undefined = {};

export const getEmailPermission = async (): Promise<[] | [EmailPermission]> => {
	const { get_email_permission } = await rootCanister();

	return get_email_permission();
};

export const insertEmail = async (email?: string): Promise<Result> => {
	const { insert_email } = await rootCanister();

	return insert_email(email ? [email] : []);
};

const rootCanister = async (): Promise<RootActor> => {
	const { principal } = get(authStore);
	const cacheKey = principal.toString();

	if (isNullish(canister) || isNullish(canister[cacheKey])) {
		const rootCan = await getRootCanister();

		canister = {
			...(canister ?? {}),
			[cacheKey]: rootCan
		};

		return rootCan;
	}

	return canister[cacheKey];
};

// Function to reset the cache for testing purposes
export const _resetRootCanisterForTesting = (): void => {
	canister = {}; // Reset to an empty object
};
