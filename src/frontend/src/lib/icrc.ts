import type { Identity } from '@dfinity/agent';
import { getAgent } from './actor';
import { IcrcLedgerCanister } from '@dfinity/ledger-icrc';
import { Principal } from '@dfinity/principal';

export const getIcrcActor = async (
	identity: Identity,
	canisterId: string
): Promise<IcrcLedgerCanister> => {
	const agent = await getAgent(identity);
	return IcrcLedgerCanister.create({ agent, canisterId: Principal.fromText(canisterId) });
};

export const getCkUsdcActor = async (identity: Identity): Promise<IcrcLedgerCanister> => {
	let canisterId = import.meta.env.VITE_CKUSDC_LEDGER_CANISTER_ID as string;
	return await getIcrcActor(identity, canisterId);
};

export const getUsdxActor = async (identity: Identity): Promise<IcrcLedgerCanister> => {
	let canisterId = import.meta.env.VITE_USDX_LEDGER_CANISTER_ID as string;
	return await getIcrcActor(identity, canisterId);
};
