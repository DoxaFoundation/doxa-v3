import {
	CKBTC_LEDGER_CANISTER_ID,
	CKETH_LEDGER_CANISTER_ID,
	CKUSDC_LEDGER_CANISTER_ID,
	CKUSDT_LEDGER_CANISTER_ID,
	ICP_LEDGER_CANISTER_ID,
	USDX_LEDGER_CANISTER_ID
} from '@constants/app.constants';
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
