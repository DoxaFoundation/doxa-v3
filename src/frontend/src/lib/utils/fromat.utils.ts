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
	const metadata = LedgerMetadata[canisterId];
	// 1. Explicitly check for valid metadata and decimals first.
	if (!metadata || typeof metadata.decimals !== 'number') {
		throw new TypeError(`Invalid metadata or decimals for canisterId: ${canisterId}`);
	}
	const { decimals } = metadata;

	// --- Truncation via String Manipulation ---
	let numStr = number.toString();

	// Handle scientific notation input from toString()
	if (numStr.includes('e')) {
		// Convert to fixed decimal string with sufficient precision
		// Determine required precision: need at least 'decimals' plus the magnitude of the exponent
		const exponent = parseInt(numStr.split('e')[1], 10);
		// Use toFixed with enough places (e.g., decimals + abs(exponent) + safety buffer)
		// Or simpler: just use a large fixed number if exponent is negative (small number)
		// Let's use a fixed large number for simplicity for small numbers.
		// For large numbers (positive exponent), toString might already be precise enough, 
		// but toFixed can also work if needed.
		if (exponent < 0) {
			numStr = number.toFixed(Math.max(decimals, Math.abs(exponent)) + 1); // Ensure enough decimals
		}
		// else: Large numbers in scientific notation might need different handling if they occur
		// but typically toString() is sufficient for integers part. Let's assume this for now.
	}

	const decimalPointIndex = numStr.indexOf('.');
	let truncatedStr: string;

	if (decimalPointIndex === -1) {
		// Input is an integer
		truncatedStr = numStr;
		// If decimals > 0, we need to add the decimal point and zeros for formatting later
		if (decimals > 0) {
			truncatedStr += '.'.padEnd(decimals + 1, '0');
		}
	} else {
		// Input has decimal part
		const integerPart = numStr.substring(0, decimalPointIndex);
		const decimalPart = numStr.substring(decimalPointIndex + 1);
		// Keep only 'decimals' number of digits after the point
		const truncatedDecimalPart = decimalPart.slice(0, decimals);

		// Reconstruct the string representation of the truncated number
		if (decimals === 0) {
			truncatedStr = integerPart; // Truncate to integer
		} else {
			// Pad with zeros if truncated part is shorter than required decimals
			const paddedDecimalPart = truncatedDecimalPart.padEnd(decimals, '0');
			truncatedStr = integerPart + '.' + paddedDecimalPart;
		}
	}

	// --- Formatting ---
	// Now `truncatedStr` holds the correctly truncated value as a string, with necessary trailing zeros.

	// Apply regex to remove unnecessary trailing zeros (e.g., "1.20" -> "1.2", "1.00" -> "1")
	// unless decimals is 0 (e.g. "100" should stay "100")
	let finalStr = truncatedStr;
	if (decimals > 0) {
		finalStr = finalStr.replace(/(\.\d*?[1-9])0+$/, '$1').replace(/\.0+$/, ''); // Handle removing '.0' correctly
	}


	// Add thousand separators
	let [intPart, decimalPart] = finalStr.split('.');
	intPart = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, "'");

	// Handle the case of "-0" potentially resulting from truncation/formatting
	if (intPart === '-0' && !decimalPart) {
		return '0';
	}

	return decimalPart !== undefined ? `${intPart}.${decimalPart}` : intPart;
}

/**
 * Formats a number to 2 decimal places if it's less than 1, otherwise 0 decimal places.
 *
 * @param number - The number to format
 * @returns A formatted string representation of the number
 */
export function formatUsdValue(number: number): string {
	const decimals = number < 1 ? 6 : 2;

	// Explicitly round the number *before* calling toFixed to bypass potential environment issues.
	const factor = Math.pow(10, decimals);
	const roundedNumber = Math.round(number * factor) / factor;

	// Get a fixed string representation with the desired decimal places.
	let fixedStr = roundedNumber.toFixed(decimals);

	// Remove unnecessary trailing zeros and a trailing decimal point if present.
	fixedStr = fixedStr.replace(/(\.\d*?[1-9])0+$/, '$1').replace(/\.0+$/, '');

	// Add thousand separators to integer part by splitting the number on the decimal point.
	let [intPart, decimalPart] = fixedStr.split('.');
	intPart = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, "'");

	return decimalPart ? `${intPart}.${decimalPart}` : intPart;
}

/**
 * Formats a raw number with thousand separators.
 *
 * @param number - The number to format
 * @returns A formatted string representation of the number
 */
export function formatRawNumber(number: number): string {
	// Add thousand separators to integer part by splitting the number on the decimal point.
	let [intPart, decimalPart] = number.toString().split('.');
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
