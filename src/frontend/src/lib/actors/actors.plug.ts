import {
	CKUSDC_LEDGER_CANISTER_ID,
	STABLECOIN_MINTER_CANISTER_ID,
	STAKING_CANISTER_ID,
	USDX_LEDGER_CANISTER_ID
} from '../constants/app.constants';
import {
	stablecoinMinterIdlFactory,
	stakingCanisterIdlFactory,
	icrcLedgerIdlFactory,
	type Actors,
	type IcrcLedgerActor,
	swapPoolIdlFactory,
	type SwapPoolActor
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
	USDx: await plug.createActor({
		canisterId: USDX_LEDGER_CANISTER_ID,
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
