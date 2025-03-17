import { assertNonNullish } from '@dfinity/utils';
import { LedgerMetadata } from '@states/ledger-metadata.svelte';

/**
 * Converts a bigint value with 6 decimal places to a JavaScript number.
 * @param value - The bigint value to convert (with 6 implied decimal places)
 * @returns The equivalent JavaScript number with proper decimal representation
 */
export function from6Decimals(value: bigint): number {
	return Number(value) / 1000000;
}

/**
 * Converts a JavaScript number to a bigint with 6 decimal places.
 * @param value - The number to convert
 * @returns A bigint representation with 6 implied decimal places
 */
export function to6Decimals(value: number): bigint {
	return BigInt(value * 1000000);
}

/**
 * Truncates a decimal number to a specified number of decimal places without rounding.
 * @param num - The number to truncate
 * @param places - The number of decimal places to keep
 * @returns The truncated number with the specified decimal precision
 */
export function truncateDecimal(num: number, places: number) {
	const multiplier = Math.pow(10, places);
	return Math.trunc(num * multiplier) / multiplier;
}

/**
 * Converts a bigint value based on the token's decimal places to a JavaScript number.
 * @param value - The bigint value to convert
 * @param canisterId - The ID of the token canister to determine decimal places
 * @returns The equivalent JavaScript number with proper decimal representation
 */
export function fromBigIntDecimals(value: bigint, canisterId: string): number {
	const { decimals } = LedgerMetadata[canisterId];

	assertNonNullish(decimals, 'Decimals not found');

	return Number(value) / 10 ** decimals;
}

/**
 * Converts a JavaScript number to a bigint based on the token's decimal places.
 * @param value - The number to convert
 * @param canisterId - The ID of the token canister to determine decimal places
 * @returns A bigint representation with the token's implied decimal places
 */
export function toBigIntDecimals(value: number, canisterId: string) {
	const { decimals } = LedgerMetadata[canisterId];

	assertNonNullish(decimals, 'Decimals not found');

	return BigInt(Math.trunc(value * Math.pow(10, decimals)));
}

/**
 * Converts a number with token's decimal places to a JavaScript number.
 * @param value - The number to convert
 * @param canisterId - The ID of the token canister to determine decimal places
 * @returns The equivalent JavaScript number with proper decimal representation
 */
export function fromDecimals(value: number, canisterId: string): number {
	const { decimals } = LedgerMetadata[canisterId];

	assertNonNullish(decimals, 'Decimals not found');

	return value / 10 ** decimals;
}
