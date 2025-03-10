import { getUtilityActor } from '$lib/actors/actors.ic';
import type { UtilityActor } from '$lib/types/actors';
import { isNullish } from '@dfinity/utils';

let canister: UtilityActor | undefined;

export const getPricesFromCkusdcPools = async (): Promise<Array<[string, number]>> => {
	const { get_prices_from_ckusdc_pools } = await getUtilityCanister();

	return get_prices_from_ckusdc_pools();
};

const getUtilityCanister = async (): Promise<UtilityActor> => {
	if (isNullish(canister)) {
		canister = await getUtilityActor();
	}

	return canister;
};
