import { AnonymousIdentity, type Identity } from '@dfinity/agent';
import { getAgent } from './actor';
import { IcrcIndexNgCanister, IcrcLedgerCanister } from '@dfinity/ledger-icrc';
import { Principal } from '@dfinity/principal';

export const getIcrcActor = async (
	identity: Identity,
	canisterId: string
): Promise<IcrcLedgerCanister> => {
	const agent = await getAgent(identity);
	return IcrcLedgerCanister.create({ agent, canisterId: Principal.fromText(canisterId) });
};

export const getCkUsdcActor = async (identity: Identity): Promise<IcrcLedgerCanister> => {
	const canisterId = import.meta.env.VITE_CKUSDC_LEDGER_CANISTER_ID as string;
	return await getIcrcActor(identity, canisterId);
};

export const getUsdxActor = async (identity: Identity): Promise<IcrcLedgerCanister> => {
	const canisterId = import.meta.env.VITE_USDX_LEDGER_CANISTER_ID as string;
	return await getIcrcActor(identity, canisterId);
};

export const getIcrcIndexNgActor = async (
	identity: Identity,
	canisterId: string
): Promise<IcrcIndexNgCanister> => {
	const agent = await getAgent(identity);
	return IcrcIndexNgCanister.create({ agent, canisterId: Principal.fromText(canisterId) });
};

export const getUsdxIndexActor = async (): Promise<IcrcIndexNgCanister> => {
	const canisterId = import.meta.env.VITE_USDX_INDEX_CANISTER_ID as string;

	return await getIcrcIndexNgActor(new AnonymousIdentity(), canisterId);
};

export const getCkUsdcIndexActor = async (): Promise<IcrcIndexNgCanister> => {
	const canisterId = import.meta.env.VITE_CKUSDC_INDEX_CANISTER_ID as string;

	return await getIcrcIndexNgActor(new AnonymousIdentity(), canisterId);
};
