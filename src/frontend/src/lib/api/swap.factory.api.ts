import { getSwapFactoryActor } from '$lib/actors/actors.swap';
import type { SwapFactoryActor } from '$lib/types/actors';
import type { GetPoolResponse, GetPoolsResponse } from '$lib/types/api';
import type { GetPoolArgs } from '@declarations/SwapFactory/SwapFactory.did';
import { isNullish } from '@dfinity/utils';

let canister: SwapFactoryActor | undefined;

export const getPool = async (args: GetPoolArgs): Promise<GetPoolResponse> => {
	const { getPool } = await swapFactoryCanister();

	return getPool(args);
};

export const getPools = async (): Promise<GetPoolsResponse> => {
	const { getPools } = await swapFactoryCanister();

	return getPools();
};

const swapFactoryCanister = async (): Promise<SwapFactoryActor> => {
	if (isNullish(canister)) {
		canister = await getSwapFactoryActor();
	}

	return canister;
};
