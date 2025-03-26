import { getAgent, getAgentFromCache } from '$lib/actors/agents.ic';
import { getIcrcLedgerActorFromPlug } from '$lib/actors/actors.plug';
import { assertNonNullish } from '@dfinity/utils';
import { authStore } from '@stores/auth.store';
import { get } from 'svelte/store';
import { Actor } from '@dfinity/agent';
import { icrcLedgerIdlFactory, type IcrcLedgerActor } from '$lib/types/actors';
import { anonIdentity } from '$lib/connection/anonymous.connection';

export const getIcrcLedgerActor = async (canisterId: string): Promise<IcrcLedgerActor> => {
	const { identityProvider, principal } = get(authStore);

	if (identityProvider === 'ii' || identityProvider === 'nfid') {
		const agent = getAgentFromCache(principal);

		assertNonNullish(agent, 'Agent is Nullish value');

		return Actor.createActor(icrcLedgerIdlFactory, { agent, canisterId });
	} else if (identityProvider === 'plug') {
		return getIcrcLedgerActorFromPlug(canisterId);
	} else if (identityProvider === 'anonymous') {
		const agent = await getAgent({ identity: anonIdentity });
		return Actor.createActor(icrcLedgerIdlFactory, { agent, canisterId });
	}

	throw new Error('Invalid identity provider');
};
