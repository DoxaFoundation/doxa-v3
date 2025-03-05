import { LedgerMetadata } from '@states/ledger-metadata.svelte';
import { from6Decimals, fromBigIntDecimals } from './decimals.utils';

/**
 * Formats a number according to the token's decimal places with proper formatting.
 * Features:
 * - Truncates (not rounds) to the token's decimal precision
 * - Removes trailing zeros after the decimal point
 * - Adds thousand separators (') to the integer part
 *
 * @param number - The number to format
 * @param canisterId - The ID of the token canister to determine decimal places
 * @returns A formatted string representation of the number
 */
export function formatNumber(number: number, canisterId: string): string {
	const { decimals } = LedgerMetadata[canisterId];

	// Truncate the number so that we don't round it
	const factor = Math.pow(10, decimals);
	const truncated = Math.floor(number * factor) / factor;

	// Get a fixed string representation with the desired decimal places.
	let fixedStr = truncated.toFixed(decimals);

	// Remove unnecessary trailing zeros and a trailing decimal point if present.
	fixedStr = fixedStr.replace(/(\.\d*?[1-9])0+$/, '$1').replace(/\.0+$/, '');

	// Add thousand separators to integer part by splitting the number on the decimal point.
	let [intPart, decimalPart] = fixedStr.split('.');
	intPart = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, "'");

	return decimalPart ? `${intPart}.${decimalPart}` : intPart;
}

/**
 * Converts a bigint balance to a formatted string representation.
 * Uses the token's decimal places from the ledger metadata.
 *
 * @param balance - The bigint balance to display
 * @param canisterId - The ID of the token canister
 * @returns A formatted string representation of the balance
 */
export function displayBigIntBalanceInFormat(balance: bigint, canisterId: string): string {
	return formatNumber(fromBigIntDecimals(balance, canisterId), canisterId);
}
