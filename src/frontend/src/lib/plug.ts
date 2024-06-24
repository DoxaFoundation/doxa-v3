import type { ActorSubclass } from '@dfinity/agent';
import type { _SERVICE as MINTER_SERVICE } from '../../../declarations/stablecoin_minter/stablecoin_minter.did';
import { idlFactory as stablecoinMinterIdlFactory } from '../../../declarations/stablecoin_minter/stablecoin_minter.did.js';
import type { _SERVICE as ICRC_LEDGER_SERVICE } from '@dfinity/ledger-icrc/dist/candid/icrc_ledger';
import { idlFactory as icrcLedgerIdlFactory } from '../../../../node_modules/@dfinity/ledger-icrc/dist/candid/icrc_ledger.idl';

// @ts-ignore: next-line
const plug = window?.ic?.plug;

export const getActorsFromPlug = async (): Promise<{
	stablecoinMinterActor: ActorSubclass<MINTER_SERVICE>;
	ckUsdcActor: ActorSubclass<ICRC_LEDGER_SERVICE>;
	usdxActor: ActorSubclass<ICRC_LEDGER_SERVICE>;
}> => {
	let stablecoinMinterActor: ActorSubclass<MINTER_SERVICE> = await plug.createActor({
		canisterId: import.meta.env.VITE_STABLECOIN_MINTER_CANISTER_ID as string,
		interfaceFactory: stablecoinMinterIdlFactory
	});
	let ckUsdcActor: ActorSubclass<ICRC_LEDGER_SERVICE> = await plug.createActor({
		canisterId: import.meta.env.VITE_CKUSDC_LEDGER_CANISTER_ID as string,
		interfaceFactory: icrcLedgerIdlFactory
	});
	let usdxActor: ActorSubclass<ICRC_LEDGER_SERVICE> = await plug.createActor({
		canisterId: import.meta.env.VITE_USDX_LEDGER_CANISTER_ID as string,
		interfaceFactory: icrcLedgerIdlFactory
	});

	return {
		stablecoinMinterActor,
		ckUsdcActor,
		usdxActor
	};
};
