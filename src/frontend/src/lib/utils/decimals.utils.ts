export function from6Decimals(value: bigint): number {
	return Number(value) / 1000000;
}

export function to6Decimals(value: number): bigint {
	return BigInt(value * 1000000);
}
