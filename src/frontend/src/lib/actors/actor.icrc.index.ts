import { getAgent } from '$lib/actors/agents.ic';
import { anonIdentity } from '$lib/connection/anonymous.connection';
import { IcrcIndexNgCanister } from '@dfinity/ledger-icrc';
import { Principal } from '@dfinity/principal';

export const getIcrcIndexNgCanister = async (canisterId: string): Promise<IcrcIndexNgCanister> => {
	const agent = await getAgent({ identity: anonIdentity });

	return IcrcIndexNgCanister.create({
		agent,
		canisterId: Principal.fromText(canisterId)
	});
};
