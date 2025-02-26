import { LedgerMetadata } from '@states/ledger-metadata.svelte';
import { from6Decimals } from './decimals.utils';

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

export function displayBalanceInFormat(balance: bigint, canisterId: string): string {
	return formatNumber(from6Decimals(balance), canisterId);
}
