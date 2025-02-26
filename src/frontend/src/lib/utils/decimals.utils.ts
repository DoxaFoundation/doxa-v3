import { assertNonNullish } from '@dfinity/utils';
import { LedgerMetadata } from '@states/ledger-metadata.svelte';

export function from6Decimals(value: bigint): number {
	return Number(value) / 1000000;
}

export function to6Decimals(value: number): bigint {
	return BigInt(value * 1000000);
}

export function truncateDecimal(num: number, places: number) {
	const multiplier = Math.pow(10, places);
	return Math.trunc(num * multiplier) / multiplier;
}

export function fromBigIntDecimals(value: bigint, canisterId: string) {
	const { decimals } = LedgerMetadata[canisterId];

	assertNonNullish(decimals, 'Decimals not found');

	return Number(value) / 10 ** decimals;
}

export function toBigIntDecimals(value: number, canisterId: string) {
	const { decimals } = LedgerMetadata[canisterId];

	assertNonNullish(decimals, 'Decimals not found');

	return BigInt(value * 10 ** decimals);
}
