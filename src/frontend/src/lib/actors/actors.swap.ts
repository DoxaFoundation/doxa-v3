import { anonIdentity } from '$lib/connection/anonymous.connection';
import {
	swapFactoryIdlFactory,
	swapPoolIdlFactory,
	type SwapFactoryActor,
	type SwapPoolActor
} from '$lib/types/actors';
import { Actor } from '@dfinity/agent';
import { getAgent, getAgentFromCache } from './agents.ic';
import { SWAP_FACTORY_CANISTER_ID } from '@constants/swap.constants';
import { get } from 'svelte/store';
import { authStore } from '@stores/auth.store';
import { assertNonNullish } from '@dfinity/utils';
import { getSwapPoolActorFromPlug } from './actors.plug';

export const getSwapFactoryActor = async (): Promise<SwapFactoryActor> => {
	const agent = await getAgent({ identity: anonIdentity });

	return Actor.createActor(swapFactoryIdlFactory, { agent, canisterId: SWAP_FACTORY_CANISTER_ID });
};

export const getSwapPoolActor = async (canisterId: string): Promise<SwapPoolActor> => {
	const { identityProvider, principal } = get(authStore);

	if (identityProvider === 'ii' || identityProvider === 'nfid') {
		const agent = getAgentFromCache(principal);

		assertNonNullish(agent, 'Agent is Nullish value');

		return Actor.createActor(swapPoolIdlFactory, { agent, canisterId });
	} else if (identityProvider === 'plug') {
		return getSwapPoolActorFromPlug(canisterId);
	} else if (identityProvider === 'anonymous') {
		const agent = await getAgent({ identity: anonIdentity });

		return Actor.createActor(swapPoolIdlFactory, { agent, canisterId });
	}

	throw new Error('Invalid identity provider');
};
