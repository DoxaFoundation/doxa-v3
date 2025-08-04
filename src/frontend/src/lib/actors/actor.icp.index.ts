import { getAgent } from '$lib/actors/agents.ic';
import { anonIdentity } from '$lib/connection/anonymous.connection';
import { ICP_INDEX_CANISTER_ID } from '@constants/icrc-index.constants';
import { IndexCanister } from '@dfinity/ledger-icp';
import { Principal } from '@dfinity/principal';

export const getIcpIndexCanister = async (): Promise<IndexCanister> => {
	const agent = await getAgent({ identity: anonIdentity });

	return IndexCanister.create({
		agent,
		canisterId: Principal.fromText(ICP_INDEX_CANISTER_ID)
	});
};
