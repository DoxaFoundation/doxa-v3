import { getAgent, getAgentFromCache } from '$lib/actors/agents.ic';
import { getIcpLedgerActorFromPlug } from '$lib/actors/actors.plug';
import { assertNonNullish } from '@dfinity/utils';
import { authStore } from '@stores/auth.store';
import { get } from 'svelte/store';
import { Actor } from '@dfinity/agent';
import { icpLedgerIdlFactory, type IcpLedgerActor } from '$lib/types/actors';
import { anonIdentity } from '$lib/connection/anonymous.connection';
import { ICP_LEDGER_CANISTER_ID } from '@constants/app.constants';

export const getIcpLedgerActor = async (): Promise<IcpLedgerActor> => {
	const { identityProvider, principal } = get(authStore);

	const canisterId = ICP_LEDGER_CANISTER_ID;

	if (identityProvider === 'ii' || identityProvider === 'nfid') {
		const agent = getAgentFromCache(principal);

		assertNonNullish(agent, 'Agent is Nullish value');

		return Actor.createActor(icpLedgerIdlFactory, { agent, canisterId });
	} else if (identityProvider === 'plug') {
		return getIcpLedgerActorFromPlug();
	} else if (identityProvider === 'anonymous') {
		const agent = await getAgent({ identity: anonIdentity });
		return Actor.createActor(icpLedgerIdlFactory, { agent, canisterId });
	}

	throw new Error('Invalid identity provider');
};
