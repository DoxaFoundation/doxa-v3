import type { DateWithRemainingDays } from '$lib/types/staking';

// Function to convert days to nanoseconds
export const daysToNanoseconds = (days: number): bigint => {
	const nanosecondsPerDay = 24n * 60n * 60n * 1_000_000_000n;
	// Use Math.trunc to ensure an integer value before BigInt conversion
	return BigInt(Math.trunc(days)) * nanosecondsPerDay;
};

// Function to convert nanoseconds to days
export const nanosecondsToDays = (nanoseconds: bigint): number => {
	const nanosecondsPerDay = 24n * 60n * 60n * 1_000_000_000n;
	return Number(nanoseconds / nanosecondsPerDay);
};

export function formatTimestamp(timestamp: number): string {
	const date = new Date(timestamp);

	// const months = [
	//   "January",
	//   "February",
	//   "March",
	//   "April",
	//   "May",
	//   "June",
	//   "July",
	//   "August",
	//   "September",
	//   "October",
	//   "November",
	//   "December",
	// ];
	const months = [
		'Jan',
		'Feb',
		'Mar',
		'Apr',
		'May',
		'Jun',
		'Jul',
		'Aug',
		'Sep',
		'Oct',
		'Nov',
		'Dec'
	];

	const month = months[date.getMonth()];
	const year = date.getFullYear();

	return `${date.getDate()} ${month} ${year}`;
}

export const formatBigIntNanoSecTimestamp = (timestamp: bigint): string => {
	const millisec = Number(timestamp) / 1_000_000;
	return formatTimestamp(millisec);
};

export const formatTimestampWithDaysFromNow = (timestamp: bigint): DateWithRemainingDays => {
	const future = Number(timestamp) / 1_000_000;
	const now = new Date();

	const diffInMs = future - now.getTime();
	const diffInDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));

	return {
		date: formatTimestamp(future),
		remainingDays: diffInDays
	};
};
//days remaining
