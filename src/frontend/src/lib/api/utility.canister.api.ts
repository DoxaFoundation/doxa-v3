import { getUtilityActor } from '$lib/actors/actors.ic';
import type { UtilityActor } from '$lib/types/actors';
import { isNullish } from '@dfinity/utils';

let canister: UtilityActor | undefined;

export const getPricesFromCkusdcPools = async (): Promise<Array<[string, number]>> => {
	const { get_prices_from_ckusdc_pools_local } = await getUtilityCanister();

	return get_prices_from_ckusdc_pools_local();
};

export const getAllTokenPrices = async (): Promise<Array<[string, number]>> => {
	const { get_all_token_prices } = await getUtilityCanister();

	return get_all_token_prices();
};

const getUtilityCanister = async (): Promise<UtilityActor> => {
	if (isNullish(canister)) {
		canister = await getUtilityActor();
	}

	return canister;
};

// Function to reset the canister instance for testing purposes
export const _resetUtilityCanisterForTesting = (): void => {
	canister = undefined;
};
