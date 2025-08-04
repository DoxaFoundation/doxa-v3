import { Actor, type Identity } from '@dfinity/agent';
import {
	stablecoinMinterIdlFactory,
	icrcLedgerIdlFactory,
	type StablecoinMinterActor,
	type IcrcLedgerActor,
	type StakingActor,
	stakingCanisterIdlFactory,
	type Actors,
	type UtilityActor,
	utilityIdlFactory
} from '$lib/types/actors';
import {
	CKUSDC_LEDGER_CANISTER_ID,
	STABLECOIN_MINTER_CANISTER_ID,
	STAKING_CANISTER_ID,
	DUSD_LEDGER_CANISTER_ID,
	UTILITY_CANISTER_ID
} from '@constants/app.constants';
import { getAgent } from './agents.ic';
import { anonIdentity } from '$lib/connection/anonymous.connection';

export const getStablecoinMinterActor = async (
	identity: Identity
): Promise<StablecoinMinterActor> => {
	const agent = await getAgent({ identity });

	return Actor.createActor(stablecoinMinterIdlFactory, {
		agent,
		canisterId: STABLECOIN_MINTER_CANISTER_ID
	});
};

const getIcrcActor = async (identity: Identity, canisterId: string): Promise<IcrcLedgerActor> => {
	const agent = await getAgent({ identity });

	return Actor.createActor(icrcLedgerIdlFactory, { agent, canisterId });
};

export const getCkUsdcActor = async (identity: Identity): Promise<IcrcLedgerActor> => {
	return await getIcrcActor(identity, CKUSDC_LEDGER_CANISTER_ID);
};

export const getDUSDActor = async (identity: Identity): Promise<IcrcLedgerActor> => {
	return await getIcrcActor(identity, DUSD_LEDGER_CANISTER_ID);
};

export const getStakingActor = async (identity: Identity): Promise<StakingActor> => {
	const agent = await getAgent({ identity });

	return Actor.createActor(stakingCanisterIdlFactory, { agent, canisterId: STAKING_CANISTER_ID });
};

export const getActors = async (identity: Identity): Promise<Actors> => ({
	stablecoinMinter: await getStablecoinMinterActor(identity),
	ckUSDC: await getCkUsdcActor(identity),
	DUSD: await getDUSDActor(identity),
	staking: await getStakingActor(identity)
});

export const getUtilityActor = async (): Promise<UtilityActor> => {
	const agent = await getAgent({ identity: anonIdentity });

	return Actor.createActor(utilityIdlFactory, { agent, canisterId: UTILITY_CANISTER_ID });
};
