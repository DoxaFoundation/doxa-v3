import { Actor, type Identity } from '@dfinity/agent';
import {
	stablecoinMinterIdlFactory,
	icrcLedgerIdlFactory,
	type StablecoinMinterActor,
	type IcrcLedgerActor,
	type StakingActor,
	stakingCanisterIdlFactory,
	type Actors
} from '$lib/types/actors';
import {
	CKUSDC_LEDGER_CANISTER_ID,
	STABLECOIN_MINTER_CANISTER_ID,
	STAKING_CANISTER_ID,
	USDX_LEDGER_CANISTER_ID
} from '@constants/app.constants';
import { getAgent } from './agents.ic';

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

export const getUsdxActor = async (identity: Identity): Promise<IcrcLedgerActor> => {
	return await getIcrcActor(identity, USDX_LEDGER_CANISTER_ID);
};

export const getStakingActor = async (identity: Identity): Promise<StakingActor> => {
	const agent = await getAgent({ identity });

	return Actor.createActor(stakingCanisterIdlFactory, { agent, canisterId: STAKING_CANISTER_ID });
};

export const getActors = async (identity: Identity): Promise<Actors> => ({
	stablecoinMinter: await getStablecoinMinterActor(identity),
	ckUSDC: await getCkUsdcActor(identity),
	USDx: await getUsdxActor(identity),
	staking: await getStakingActor(identity)
});
