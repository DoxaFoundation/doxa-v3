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
