import { getIcrcLedgerActor } from '$lib/actors/actor.icrc.ledger';
import type { IcrcLedgerActor } from '$lib/types/actors';
import type { CanisterApiFunctionParams, IcrcTokenMetadataResponse } from '$lib/types/api';
import type {
	ApproveParams,
	IcrcAccount,
	TransferFromParams,
	TransferParams
} from '@dfinity/ledger-icrc';
import type {
	Allowance,
	AllowanceArgs,
	ApproveResult,
	icrc21_consent_message_request,
	TransferFromResult,
	TransferResult
} from '@dfinity/ledger-icrc/dist/candid/icrc_ledger';
import { authStore } from '@stores/auth.store';
import { get } from 'svelte/store';

const ledgerCanisterCache = new Map<string, IcrcLedgerActor>();

export const metadata = async ({
	canisterId
}: CanisterApiFunctionParams): Promise<IcrcTokenMetadataResponse> => {
	const { icrc1_metadata } = await icrcLedgerCanister({ canisterId });

	return icrc1_metadata();
};

export const transactionFee = async ({
	canisterId
}: CanisterApiFunctionParams): Promise<bigint> => {
	const { icrc1_fee } = await icrcLedgerCanister({ canisterId });

	return icrc1_fee();
};

export const balance = async ({
	canisterId,
	owner,
	subaccount
}: CanisterApiFunctionParams<IcrcAccount>): Promise<bigint> => {
	const { icrc1_balance_of } = await icrcLedgerCanister({ canisterId });

	return icrc1_balance_of({ owner, subaccount: subaccount ? [subaccount] : [] });
};

export const transfer = async ({
	canisterId,
	to,
	fee,
	memo,
	from_subaccount,
	created_at_time,
	amount
}: CanisterApiFunctionParams<TransferParams>): Promise<TransferResult> => {
	const { icrc1_transfer } = await icrcLedgerCanister({ canisterId });

	return icrc1_transfer({
		to,
		fee: fee ? [fee] : [],
		memo: memo ? [memo] : [],
		from_subaccount: from_subaccount ? [from_subaccount] : [],
		created_at_time: created_at_time ? [created_at_time] : [],
		amount
	});
};

export const totalTokensSupply = async ({
	canisterId
}: CanisterApiFunctionParams): Promise<bigint> => {
	const { icrc1_total_supply } = await icrcLedgerCanister({ canisterId });

	return icrc1_total_supply();
};

export const transferFrom = async ({
	canisterId,
	from,
	to,
	fee,
	spender_subaccount,
	memo,
	created_at_time,
	amount
}: CanisterApiFunctionParams<TransferFromParams>): Promise<TransferFromResult> => {
	const { icrc2_transfer_from } = await icrcLedgerCanister({ canisterId });

	return icrc2_transfer_from({
		to,
		from,
		fee: fee ? [fee] : [],
		spender_subaccount: spender_subaccount ? [spender_subaccount] : [],
		memo: memo ? [memo] : [],
		created_at_time: created_at_time ? [created_at_time] : [],
		amount
	});
};

export const approve = async ({
	canisterId,
	spender,
	amount,
	expires_at,
	expected_allowance,
	from_subaccount,
	fee,
	memo,
	created_at_time
}: CanisterApiFunctionParams<ApproveParams>): Promise<ApproveResult> => {
	const { icrc2_approve } = await icrcLedgerCanister({ canisterId });

	return icrc2_approve({
		spender,
		amount,
		expires_at: expires_at ? [expires_at] : [],
		expected_allowance: expected_allowance ? [expected_allowance] : [],
		from_subaccount: from_subaccount ? [from_subaccount] : [],
		fee: fee ? [fee] : [],
		memo: memo ? [memo] : [],
		created_at_time: created_at_time ? [created_at_time] : []
	});
};

export const allowance = async ({
	canisterId,
	account,
	spender
}: CanisterApiFunctionParams<AllowanceArgs>): Promise<Allowance> => {
	const { icrc2_allowance } = await icrcLedgerCanister({ canisterId });

	return icrc2_allowance({
		account,
		spender
	});
};

export const consentMessage = async ({
	canisterId,
	...arg
}: CanisterApiFunctionParams<icrc21_consent_message_request>) => {
	const { icrc21_canister_call_consent_message } = await icrcLedgerCanister({ canisterId });

	return icrc21_canister_call_consent_message(arg);
};

const icrcLedgerCanister = async ({
	canisterId
}: CanisterApiFunctionParams): Promise<IcrcLedgerActor> => {
	let { principal } = get(authStore);

	const cacheKey = `${principal}_${canisterId}`;

	// If a canister instance exists for the key, return it.
	if (ledgerCanisterCache.has(cacheKey)) {
		return ledgerCanisterCache.get(cacheKey)!;
	}

	// Otherwise, create a new instance and store it in the cache.
	const icrcLedgerInstance = await getIcrcLedgerActor(canisterId);

	ledgerCanisterCache.set(cacheKey, icrcLedgerInstance);
	return icrcLedgerInstance;
};
