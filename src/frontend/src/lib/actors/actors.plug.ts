import {
	CKUSDC_LEDGER_CANISTER_ID,
	ICP_LEDGER_CANISTER_ID,
	ROOT_CANISTER_ID,
	STABLECOIN_MINTER_CANISTER_ID,
	STAKING_CANISTER_ID,
	DUSD_LEDGER_CANISTER_ID
} from '../constants/app.constants';
import {
	stablecoinMinterIdlFactory,
	stakingCanisterIdlFactory,
	icrcLedgerIdlFactory,
	type Actors,
	type IcrcLedgerActor,
	swapPoolIdlFactory,
	type SwapPoolActor,
	type IcpLedgerActor,
	icpLedgerIdlFactory,
	type RootActor,
	rootCanisterIdlFactory
} from '../types/actors';

// @ts-ignore: next-line
const plug = window?.ic?.plug;

export const getActorsFromPlug = async (): Promise<Actors> => ({
	stablecoinMinter: await plug.createActor({
		canisterId: STABLECOIN_MINTER_CANISTER_ID,
		interfaceFactory: stablecoinMinterIdlFactory
	}),
	ckUSDC: await plug.createActor({
		canisterId: CKUSDC_LEDGER_CANISTER_ID,
		interfaceFactory: icrcLedgerIdlFactory
	}),
	DUSD: await plug.createActor({
		canisterId: DUSD_LEDGER_CANISTER_ID,
		interfaceFactory: icrcLedgerIdlFactory
	}),
	staking: await plug.createActor({
		canisterId: STAKING_CANISTER_ID,
		interfaceFactory: stakingCanisterIdlFactory
	})
});

export const getIcrcLedgerActorFromPlug = async (canisterId: string): Promise<IcrcLedgerActor> => {
	return plug.createActor({
		canisterId,
		interfaceFactory: icrcLedgerIdlFactory
	});
};

export const getSwapPoolActorFromPlug = async (canisterId: string): Promise<SwapPoolActor> => {
	return plug.createActor({
		canisterId,
		interfaceFactory: swapPoolIdlFactory
	});
};

export const getIcpLedgerActorFromPlug = async (): Promise<IcpLedgerActor> => {
	return plug.createActor({
		canisterId: ICP_LEDGER_CANISTER_ID,
		interfaceFactory: icpLedgerIdlFactory
	});
};

export const getRootActorFromPlug = async (): Promise<RootActor> => {
	return plug.createActor({
		canisterId: ROOT_CANISTER_ID,
		interfaceFactory: rootCanisterIdlFactory
	});
};
