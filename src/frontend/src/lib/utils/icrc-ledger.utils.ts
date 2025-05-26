import {
	CKBTC_LEDGER_CANISTER_ID,
	CKETH_LEDGER_CANISTER_ID,
	CKUSDC_LEDGER_CANISTER_ID,
	CKUSDT_LEDGER_CANISTER_ID,
	ICP_LEDGER_CANISTER_ID,
	USDX_LEDGER_CANISTER_ID
} from '@constants/app.constants';
import { CKETH_INDEX_CANISTER_ID, CKUSDT_INDEX_CANISTER_ID } from '@constants/icrc-index.constants';
import { CKBTC_INDEX_CANISTER_ID } from '@constants/icrc-index.constants';
import { ICP_INDEX_CANISTER_ID } from '@constants/icrc-index.constants';
import { CKUSDC_INDEX_CANISTER_ID } from '@constants/icrc-index.constants';
import { USDX_INDEX_CANISTER_ID } from '@constants/icrc-index.constants';
import { assertNonNullish } from '@dfinity/utils';
import { LedgerMetadata } from '@states/ledger-metadata.svelte';

export const getIcrcLedgerCanisterIds = () => [
	USDX_LEDGER_CANISTER_ID,
	CKUSDC_LEDGER_CANISTER_ID,
	ICP_LEDGER_CANISTER_ID,
	CKBTC_LEDGER_CANISTER_ID,
	CKETH_LEDGER_CANISTER_ID,
	CKUSDT_LEDGER_CANISTER_ID
];

console.log('canistersss', getIcrcLedgerCanisterIds());

export const getIcrcIndexCanisterIds = () => [
	USDX_INDEX_CANISTER_ID,
	CKUSDC_INDEX_CANISTER_ID,
	CKBTC_INDEX_CANISTER_ID,
	CKETH_INDEX_CANISTER_ID,
	CKUSDT_INDEX_CANISTER_ID
];

export const getIcrcLedgerAndIndexCanisterIds = (): { ledger_id: string; index_id: string }[] => [
	{
		ledger_id: USDX_LEDGER_CANISTER_ID,
		index_id: USDX_INDEX_CANISTER_ID
	},
	{
		ledger_id: CKUSDC_LEDGER_CANISTER_ID,
		index_id: CKUSDC_INDEX_CANISTER_ID
	},
	{
		ledger_id: CKBTC_LEDGER_CANISTER_ID,
		index_id: CKBTC_INDEX_CANISTER_ID
	},
	{
		ledger_id: CKETH_LEDGER_CANISTER_ID,
		index_id: CKETH_INDEX_CANISTER_ID
	},
	{
		ledger_id: CKUSDT_LEDGER_CANISTER_ID,
		index_id: CKUSDT_INDEX_CANISTER_ID
	}
];

/**
 *
 * @param ledgerId
 * @returns fee in Decimals
 */
export const getFeeWithDecimals = (ledgerId: string): number => {
	const { fee } = LedgerMetadata[ledgerId];
	assertNonNullish(fee, `${ledgerId} Fee not found`);
	return fee;
};

/**
 *
 * @param ledgerId
 * @returns fee in number without decimals
 */
export const getFee = (ledgerId: string): number => {
	const { fee, decimals } = LedgerMetadata[ledgerId];

	assertNonNullish(fee, `${ledgerId} Fee not found`);
	assertNonNullish(decimals, 'Decimals not found');

	return fee / 10 ** decimals;
};
