import { getAgentFromCache } from '$lib/actors/agents.ic';
import { getIcrcLedgerActorFromPlug } from '$lib/actors/actors.plug';
import { assertNonNullish } from '@dfinity/utils';
import { authStore } from '@stores/auth.store';
import { get } from 'svelte/store';
import { Actor } from '@dfinity/agent';
import { icrcLedgerIdlFactory, type IcrcLedgerActor } from '$lib/types/actors';

export const getIcrcLedgerActor = async (canisterId: string): Promise<IcrcLedgerActor> => {
	let { identityProvider, principal } = get(authStore);

	if (identityProvider === 'ii' || identityProvider === 'nfid') {
		const agent = getAgentFromCache(principal);

		assertNonNullish(agent, 'Agent is Nullish value');

		return Actor.createActor(icrcLedgerIdlFactory, { agent, canisterId });
	} else if (identityProvider === 'plug') {
		return getIcrcLedgerActorFromPlug(canisterId);
	}

	throw new Error('Invalid identity provider');
};
