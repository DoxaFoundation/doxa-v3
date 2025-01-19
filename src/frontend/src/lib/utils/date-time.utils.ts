// Function to convert days to nanoseconds
export const daysToNanoseconds = (days: number): bigint => {
	const nanosecondsPerDay = 24n * 60n * 60n * 1_000_000_000n;
	return BigInt(days) * nanosecondsPerDay;
};

// Function to convert nanoseconds to days
export const nanosecondsToDays = (nanoseconds: bigint): number => {
	const nanosecondsPerDay = 24n * 60n * 60n * 1_000_000_000n;
	return Number(nanoseconds / nanosecondsPerDay);
};
