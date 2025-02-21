import { getSwapPoolActor } from '$lib/actors/actors.swap';
import type { SwapPoolActor } from '$lib/types/actors';
import type {
	CanisterApiFunctionParams,
	GetUserUnusedBalanceResponse,
	MetadataResponse,
	SwapPoolResponse,
	TokenMetadata
} from '$lib/types/api';
import type { DepositArgs, SwapArgs, WithdrawArgs } from '@declarations/SwapPool/SwapPool.did';
import type { Principal } from '@dfinity/principal';
import { authStore } from '@stores/auth.store';
import { get } from 'svelte/store';

const swapPoolCanisterCache = new Map<string, SwapPoolActor>();

export const deposit = async ({
	canisterId,
	...args
}: CanisterApiFunctionParams<DepositArgs>): Promise<SwapPoolResponse> => {
	const { deposit } = await swapPoolCanister({ canisterId });

	return deposit(args);
};

export const depositFrom = async ({
	canisterId,
	...args
}: CanisterApiFunctionParams<DepositArgs>): Promise<SwapPoolResponse> => {
	const { depositFrom } = await swapPoolCanister({ canisterId });

	return depositFrom(args);
};

export const getTokenMeta = async ({
	canisterId
}: CanisterApiFunctionParams): Promise<TokenMetadata> => {
	const { getTokenMeta } = await swapPoolCanister({ canisterId });

	return getTokenMeta();
};

export const getUserUnusedBalance = async ({
	canisterId,
	principal
}: CanisterApiFunctionParams<{ principal: Principal }>): Promise<GetUserUnusedBalanceResponse> => {
	const { getUserUnusedBalance } = await swapPoolCanister({ canisterId });

	return getUserUnusedBalance(principal);
};

export const metadata = async ({
	canisterId
}: CanisterApiFunctionParams): Promise<MetadataResponse> => {
	const { metadata } = await swapPoolCanister({ canisterId });

	return metadata();
};

export const quote = async ({
	canisterId,
	...args
}: CanisterApiFunctionParams<SwapArgs>): Promise<SwapPoolResponse> => {
	const { quote } = await swapPoolCanister({ canisterId });

	return quote(args);
};

export const swap = async ({
	canisterId,
	...args
}: CanisterApiFunctionParams<SwapArgs>): Promise<SwapPoolResponse> => {
	const { swap } = await swapPoolCanister({ canisterId });

	return swap(args);
};

export const withdraw = async ({
	canisterId,
	...args
}: CanisterApiFunctionParams<WithdrawArgs>): Promise<SwapPoolResponse> => {
	const { withdraw } = await swapPoolCanister({ canisterId });

	return withdraw(args);
};

const swapPoolCanister = async ({
	canisterId
}: CanisterApiFunctionParams): Promise<SwapPoolActor> => {
	let { principal } = get(authStore);

	const cacheKey = `${principal}_${canisterId}`;

	if (swapPoolCanisterCache.has(cacheKey)) {
		return swapPoolCanisterCache.get(cacheKey)!;
	}

	const swapPoolInstance = await getSwapPoolActor(canisterId);

	swapPoolCanisterCache.set(cacheKey, swapPoolInstance);

	return swapPoolInstance;
};
