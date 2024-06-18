import { idlFactory } from '../../../declarations/stablecoin_minter';

import type { _SERVICE } from '../../../declarations/stablecoin_minter/service.did';
import { Actor, HttpAgent, type ActorSubclass, type Identity } from '@dfinity/agent';

const getAgent = async (identity: Identity): Promise<HttpAgent> => {
	// const host = import.meta.env.DEV ? 'http://localhost:8080/' : 'https://icp0.io';
	const host = import.meta.env.VITE_HOST;
	const agent: HttpAgent = new HttpAgent({ identity, host });

	// if (import.meta.env.DEV) {
	// 	await agent.fetchRootKey();
	// }
	if (import.meta.env.VITE_DFX_NETWORK === 'local') {
		await agent.fetchRootKey();
	}

	return agent;
};

export const getStablecoinMinter = async (identity: Identity): Promise<ActorSubclass<_SERVICE>> => {
	const canisterId: string = import.meta.env.VITE_STABLECOIN_MINTER_CANISTER_ID as string;

	const agent = await getAgent(identity);

	return Actor.createActor(idlFactory, { agent, canisterId });
};
