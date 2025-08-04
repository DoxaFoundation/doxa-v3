import type { TimestampAndDateTime } from '$lib/types/transactions';
import { formatLocalDate } from '@utils/date-time.utils';

export function memoToHex(input: [] | [Uint8Array | number[]]): string | undefined {
	if (input.length === 0) return undefined;

	const data = input[0];
	const len = data.length;
	const hexChars = new Array(len * 2);

	// Lookup table for hex values
	const hexTable = '0123456789abcdef';

	for (let i = 0, j = 0; i < len; i++) {
		const byte = data[i] & 0xff;
		hexChars[j++] = hexTable[byte >>> 4];
		hexChars[j++] = hexTable[byte & 0xf];
	}

	return hexChars.join('');
}
