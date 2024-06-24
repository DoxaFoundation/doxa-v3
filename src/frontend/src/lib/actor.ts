import { Actor, HttpAgent, type ActorSubclass, type Identity } from '@dfinity/agent';
import type { _SERVICE as MINTER_SERVICE } from '../../../declarations/stablecoin_minter/stablecoin_minter.did';
import { idlFactory as stablecoinMinterIdlFactory } from '../../../declarations/stablecoin_minter/stablecoin_minter.did.js';
import type { _SERVICE as ICRC_LEDGER_SERVICE } from '@dfinity/ledger-icrc/dist/candid/icrc_ledger';
import { idlFactory as icrcLedgerIdlFactory } from '../../../../node_modules/@dfinity/ledger-icrc/dist/candid/icrc_ledger.idl';

export const getAgent = async (identity: Identity): Promise<HttpAgent> => {
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

export const getStablecoinMinterActor = async (
	identity: Identity
): Promise<ActorSubclass<MINTER_SERVICE>> => {
	const canisterId: string = import.meta.env.VITE_STABLECOIN_MINTER_CANISTER_ID as string;

	const agent = await getAgent(identity);

	return Actor.createActor(stablecoinMinterIdlFactory, { agent, canisterId });
};

const getIcrcActor = async (
	identity: Identity,
	canisterId: string
): Promise<ActorSubclass<ICRC_LEDGER_SERVICE>> => {
	const agent = await getAgent(identity);
	return Actor.createActor(icrcLedgerIdlFactory, { agent, canisterId });
};

export const getCkUsdcActor = async (
	identity: Identity
): Promise<ActorSubclass<ICRC_LEDGER_SERVICE>> => {
	let canisterId = import.meta.env.VITE_CKUSDC_LEDGER_CANISTER_ID as string;
	return await getIcrcActor(identity, canisterId);
};

export const getUsdxActor = async (
	identity: Identity
): Promise<ActorSubclass<ICRC_LEDGER_SERVICE>> => {
	let canisterId = import.meta.env.VITE_USDX_LEDGER_CANISTER_ID as string;
	return await getIcrcActor(identity, canisterId);
};

export const getActors = async (
	identity: Identity
): Promise<{
	stablecoinMinterActor: ActorSubclass<MINTER_SERVICE>;
	ckUsdcActor: ActorSubclass<ICRC_LEDGER_SERVICE>;
	usdxActor: ActorSubclass<ICRC_LEDGER_SERVICE>;
}> => {
	return {
		stablecoinMinterActor: await getStablecoinMinterActor(identity),
		ckUsdcActor: await getCkUsdcActor(identity),
		usdxActor: await getUsdxActor(identity)
	};
};
