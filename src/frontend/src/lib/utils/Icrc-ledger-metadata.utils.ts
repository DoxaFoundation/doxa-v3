import { type IcrcTokenMetadataResponse } from '$lib/types/api';
import { IcrcMetadataResponseEntries } from '@dfinity/ledger-icrc';
import type { MetadataValue } from '@dfinity/ledger-icrc/dist/candid/icrc_ledger';

/**
 * The expected token metadata shape.
 */
export interface ICRCLedgerMetadata {
	symbol: string;
	name: string;
	decimals: number;
	fee: number;
	logo: string;
}

/**
 * Converts a MetadataValue into a string.
 * For a Text value, returns the text directly.
 * For a Blob value, decodes it as a UTF-8 string.
 * For numeric types (Nat or Int), converts them to string.
 */
function convertMetadataValueToString(value: MetadataValue): string {
	if ('Text' in value) {
		return value.Text;
	} else if ('Blob' in value) {
		if (value.Blob instanceof Uint8Array) {
			return new TextDecoder().decode(value.Blob);
		} else if (Array.isArray(value.Blob)) {
			return new TextDecoder().decode(new Uint8Array(value.Blob));
		}
	} else if ('Nat' in value) {
		return value.Nat.toString();
	} else if ('Int' in value) {
		return value.Int.toString();
	}
	throw new Error('Unsupported metadata value type for string conversion.');
}

/**
 * Converts a MetadataValue into a number.
 * For numeric types (Nat or Int) the conversion is direct.
 * If a Text value is encountered, it attempts to parse it as a number.
 */
function convertMetadataValueToNumber(value: MetadataValue): number {
	if ('Nat' in value) {
		return Number(value.Nat);
	} else if ('Int' in value) {
		return Number(value.Int);
	} else if ('Text' in value) {
		const parsed = Number(value.Text);
		if (isNaN(parsed)) {
			throw new Error('Invalid numeric string in metadata value.');
		}
		return parsed;
	}
	throw new Error('Unsupported metadata value type for number conversion.');
}

/**
 * Parses an IcrcTokenMetadataResponse into a well-structured TokenMetadata object.
 *
 * @param metadata - The raw metadata response array.
 * @returns An object containing the token's symbol, name, decimals, fee, and logo.
 * @throws If any of the expected fields are missing.
 */
export function parseIcrcTokenMetadata(
	metadata: IcrcTokenMetadataResponse,
	canisterId: string
): ICRCLedgerMetadata {
	// Use a partial object to collect fields as we parse them.
	const tokenMetadata: Partial<ICRCLedgerMetadata> = {};

	for (const [key, value] of metadata) {
		switch (key) {
			case IcrcMetadataResponseEntries.SYMBOL:
				tokenMetadata.symbol = convertMetadataValueToString(value);
				break;
			case IcrcMetadataResponseEntries.NAME:
				tokenMetadata.name = convertMetadataValueToString(value);
				break;
			case IcrcMetadataResponseEntries.DECIMALS:
				tokenMetadata.decimals = convertMetadataValueToNumber(value);
				break;
			case IcrcMetadataResponseEntries.FEE:
				tokenMetadata.fee = convertMetadataValueToNumber(value);
				break;
			case IcrcMetadataResponseEntries.LOGO:
				tokenMetadata.logo = convertMetadataValueToString(value);
				break;
			default:
				console.warn(`Unrecognized metadata key: ${key}`);
		}
	}

	if (tokenMetadata.logo === undefined) {
		tokenMetadata.logo = `/images/${canisterId}.svg`;
	}

	// Ensure all required fields are present
	if (
		tokenMetadata.symbol === undefined ||
		tokenMetadata.name === undefined ||
		tokenMetadata.decimals === undefined ||
		tokenMetadata.fee === undefined ||
		tokenMetadata.logo === undefined
	) {
		throw new Error('Missing required token metadata fields.');
	}

	return tokenMetadata as ICRCLedgerMetadata;
}
