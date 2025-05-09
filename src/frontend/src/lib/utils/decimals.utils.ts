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
	// Use Math.trunc before BigInt to handle inputs with > 6 decimals
	return BigInt(Math.trunc(value * 1000000));
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
export function toBigIntDecimals(value: number, canisterId: string): bigint {
	const metadata = LedgerMetadata[canisterId];
	assertNonNullish(metadata, `Metadata not found for ${canisterId}`);
	const { decimals } = metadata;
	assertNonNullish(decimals, `Decimals not found for ${canisterId}`);

	let numStr = value.toString();

	// Handle scientific notation input from toString()
	if (numStr.includes('e')) {
		const exponent = parseInt(numStr.split('e')[1], 10);
		if (exponent < 0) {
			// Use toFixed to get a non-scientific notation string
			// Need enough precision to cover decimals and the exponent shift
			numStr = value.toFixed(Math.max(decimals, Math.abs(exponent)) + 1);
		}
		// Positive exponent cases might be large integers, toString is usually fine.
	}

	const parts = numStr.split('.');
	const integerPart = parts[0];
	let decimalPart = parts[1] || '';

	// Take the required number of decimal digits (truncation)
	const neededDecimalDigits = decimalPart.slice(0, decimals);

	// Pad with zeros if we took fewer digits than required
	const paddedDecimalDigits = neededDecimalDigits.padEnd(decimals, '0');

	// Concatenate integer part and the adjusted decimal part
	// Handle negative sign: if integerPart is "-0", result should be based on decimal part
	let combinedStr = (integerPart === '-0' || integerPart === '0') && value < 0
		? '-' + paddedDecimalDigits
		: integerPart + paddedDecimalDigits;

	// Remove leading '-' if it was '-0' and decimalpart makes it positive or zero
	if (integerPart === '-0' && !paddedDecimalDigits.match(/[^0]/)) {
		combinedStr = '0'
	}

	// Ensure the string is not empty or just '-' before converting
	if (combinedStr === '' || combinedStr === '-') {
		return 0n;
	}

	return BigInt(combinedStr);
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
