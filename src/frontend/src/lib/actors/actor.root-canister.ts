import { rootCanisterIdlFactory, type RootActor } from '$lib/types/actors';
import { ROOT_CANISTER_ID } from '@constants/app.constants';
import { authStore } from '@stores/auth.store';
import { get } from 'svelte/store';
import { getAgent, getAgentFromCache } from './agents.ic';
import { assertNonNullish } from '@dfinity/utils';
import { Actor } from '@dfinity/agent';
import { getRootActorFromPlug } from './actors.plug';
import { anonIdentity } from '$lib/connection/anonymous.connection';

export const getRootCanister = async (): Promise<RootActor> => {
	const { identityProvider, principal } = get(authStore);

	const canisterId = ROOT_CANISTER_ID;

	if (identityProvider === 'ii' || identityProvider === 'nfid') {
		const agent = getAgentFromCache(principal);

		assertNonNullish(agent, 'Agent is Nullish value');

		return Actor.createActor(rootCanisterIdlFactory, { agent, canisterId });
	} else if (identityProvider === 'plug') {
		return getRootActorFromPlug();
	} else if (identityProvider === 'anonymous') {
		const agent = await getAgent({ identity: anonIdentity });

		return Actor.createActor(rootCanisterIdlFactory, { agent, canisterId });
	}

	throw new Error('Invalid identity provider');
};
