/**
 * @fileoverview
 * This file contains tests for the ICRC ledger metadata parsing utility functions defined in `Icrc-ledger-metadata.utils.ts`.
 * It tests the helper functions for converting metadata values and the main parsing function `parseIcrcTokenMetadata`
 * with various valid and invalid metadata structures.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { parseIcrcTokenMetadata } from './Icrc-ledger-metadata.utils';
import type { ICRCLedgerMetadata } from './Icrc-ledger-metadata.utils'; // Import the interface too
import { IcrcMetadataResponseEntries } from '@dfinity/ledger-icrc';
import type { MetadataValue } from '@dfinity/ledger-icrc/dist/candid/icrc_ledger';
import type { IcrcTokenMetadataResponse } from '$lib/types/api';

// Helper to create MetadataValue objects easily for tests
const Text = (value: string): MetadataValue => ({ Text: value });
const Nat = (value: bigint): MetadataValue => ({ Nat: value });
const Int = (value: bigint): MetadataValue => ({ Int: value });
const Blob = (value: Uint8Array): MetadataValue => ({ Blob: value });
const BlobFromArray = (value: number[]): MetadataValue => ({ Blob: Uint8Array.from(value) });

// Use TextEncoder for creating blobs from strings
const textEncoder = new TextDecoder();
const textDecoder = new TextDecoder();

describe('Icrc-ledger-metadata.utils', () => {
    // Individual helper functions are not exported, so we test them implicitly via parseIcrcTokenMetadata.
    // We focus on testing the main exported function `parseIcrcTokenMetadata`.

    describe('parseIcrcTokenMetadata', () => {
        let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
        const canisterId = 'test-canister-id';

        beforeEach(() => {
            consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => { }); // Suppress warnings during test
        });

        afterEach(() => {
            consoleWarnSpy.mockRestore();
        });

        it('should parse metadata with all fields correctly (standard types)', () => {
            const metadata: IcrcTokenMetadataResponse = [
                [IcrcMetadataResponseEntries.SYMBOL, Text('TST')],
                [IcrcMetadataResponseEntries.NAME, Text('Test Token')],
                [IcrcMetadataResponseEntries.DECIMALS, Nat(8n)],
                [IcrcMetadataResponseEntries.FEE, Nat(10000n)],
                [IcrcMetadataResponseEntries.LOGO, Text('logo.png')]
            ];

            const expected: ICRCLedgerMetadata = {
                symbol: 'TST',
                name: 'Test Token',
                decimals: 8,
                fee: 10000,
                logo: 'logo.png'
            };

            expect(parseIcrcTokenMetadata(metadata, canisterId)).toEqual(expected);
        });

        it('should parse metadata with alternative valid types (Text for numbers, Blob for strings)', () => {
            const logoBlob = new TextEncoder().encode('<svg>...</svg>');
            const metadata: IcrcTokenMetadataResponse = [
                [IcrcMetadataResponseEntries.SYMBOL, Blob(new TextEncoder().encode('BLB'))],
                [IcrcMetadataResponseEntries.NAME, Text('Blob Name')],
                [IcrcMetadataResponseEntries.DECIMALS, Text('6')], // Decimals as text
                [IcrcMetadataResponseEntries.FEE, Int(-5000n)], // Fee as Int (though typically Nat)
                [IcrcMetadataResponseEntries.LOGO, Blob(logoBlob)] // Logo as blob
            ];

            const expected: ICRCLedgerMetadata = {
                symbol: 'BLB',
                name: 'Blob Name',
                decimals: 6,
                fee: -5000, // Handles Int correctly
                logo: '<svg>...</svg>' // Decodes blob
            };

            expect(parseIcrcTokenMetadata(metadata, canisterId)).toEqual(expected);
        });

        it('should generate a default logo if the logo field is missing', () => {
            const metadata: IcrcTokenMetadataResponse = [
                [IcrcMetadataResponseEntries.SYMBOL, Text('NLG')],
                [IcrcMetadataResponseEntries.NAME, Text('No Logo Given')],
                [IcrcMetadataResponseEntries.DECIMALS, Nat(8n)],
                [IcrcMetadataResponseEntries.FEE, Nat(1000n)]
                // LOGO is missing
            ];

            const expectedLogo = `/images/${canisterId}.svg`;
            const result = parseIcrcTokenMetadata(metadata, canisterId);

            expect(result.symbol).toBe('NLG');
            expect(result.name).toBe('No Logo Given');
            expect(result.decimals).toBe(8);
            expect(result.fee).toBe(1000);
            expect(result.logo).toBe(expectedLogo);
        });

        it('should throw an error if SYMBOL field is missing', () => {
            const metadata: IcrcTokenMetadataResponse = [
                // SYMBOL missing
                [IcrcMetadataResponseEntries.NAME, Text('Test Token')],
                [IcrcMetadataResponseEntries.DECIMALS, Nat(8n)],
                [IcrcMetadataResponseEntries.FEE, Nat(10000n)],
                [IcrcMetadataResponseEntries.LOGO, Text('logo.png')]
            ];
            expect(() => parseIcrcTokenMetadata(metadata, canisterId))
                .toThrow('Missing required token metadata fields.');
        });

        it('should throw an error if NAME field is missing', () => {
            const metadata: IcrcTokenMetadataResponse = [
                [IcrcMetadataResponseEntries.SYMBOL, Text('TST')],
                // NAME missing
                [IcrcMetadataResponseEntries.DECIMALS, Nat(8n)],
                [IcrcMetadataResponseEntries.FEE, Nat(10000n)],
                [IcrcMetadataResponseEntries.LOGO, Text('logo.png')]
            ];
            expect(() => parseIcrcTokenMetadata(metadata, canisterId))
                .toThrow('Missing required token metadata fields.');
        });

        it('should throw an error if DECIMALS field is missing', () => {
            const metadata: IcrcTokenMetadataResponse = [
                [IcrcMetadataResponseEntries.SYMBOL, Text('TST')],
                [IcrcMetadataResponseEntries.NAME, Text('Test Token')],
                // DECIMALS missing
                [IcrcMetadataResponseEntries.FEE, Nat(10000n)],
                [IcrcMetadataResponseEntries.LOGO, Text('logo.png')]
            ];
            expect(() => parseIcrcTokenMetadata(metadata, canisterId))
                .toThrow('Missing required token metadata fields.');
        });

        it('should throw an error if FEE field is missing', () => {
            const metadata: IcrcTokenMetadataResponse = [
                [IcrcMetadataResponseEntries.SYMBOL, Text('TST')],
                [IcrcMetadataResponseEntries.NAME, Text('Test Token')],
                [IcrcMetadataResponseEntries.DECIMALS, Nat(8n)],
                // FEE missing
                [IcrcMetadataResponseEntries.LOGO, Text('logo.png')]
            ];
            expect(() => parseIcrcTokenMetadata(metadata, canisterId))
                .toThrow('Missing required token metadata fields.');
        });

        // Note: Missing LOGO is handled by default, so it won't throw the "Missing required fields" error unless default generation also fails (unlikely).

        it('should throw an error if DECIMALS value is not a valid number type', () => {
            const metadata: IcrcTokenMetadataResponse = [
                [IcrcMetadataResponseEntries.SYMBOL, Text('TST')],
                [IcrcMetadataResponseEntries.NAME, Text('Test Token')],
                [IcrcMetadataResponseEntries.DECIMALS, Text('eight')], // Invalid text for number
                [IcrcMetadataResponseEntries.FEE, Nat(10000n)],
                [IcrcMetadataResponseEntries.LOGO, Text('logo.png')]
            ];
            // Error comes from convertMetadataValueToNumber helper
            expect(() => parseIcrcTokenMetadata(metadata, canisterId))
                .toThrow('Invalid numeric string in metadata value.');
        });

        it('should throw an error if FEE value is not a valid number type', () => {
            const metadata: IcrcTokenMetadataResponse = [
                [IcrcMetadataResponseEntries.SYMBOL, Text('TST')],
                [IcrcMetadataResponseEntries.NAME, Text('Test Token')],
                [IcrcMetadataResponseEntries.DECIMALS, Nat(8n)],
                [IcrcMetadataResponseEntries.FEE, Blob(new Uint8Array([1, 2]))], // Invalid type for number
                [IcrcMetadataResponseEntries.LOGO, Text('logo.png')]
            ];
            // Error comes from convertMetadataValueToNumber helper
            expect(() => parseIcrcTokenMetadata(metadata, canisterId))
                .toThrow('Unsupported metadata value type for number conversion.');
        });

        it('should throw an error if SYMBOL value is not a valid string type', () => {
            const metadata: IcrcTokenMetadataResponse = [
                [IcrcMetadataResponseEntries.SYMBOL, { BadType: true } as any], // Invalid type
                [IcrcMetadataResponseEntries.NAME, Text('Test Token')],
                [IcrcMetadataResponseEntries.DECIMALS, Nat(8n)],
                [IcrcMetadataResponseEntries.FEE, Nat(10000n)],
                [IcrcMetadataResponseEntries.LOGO, Text('logo.png')]
            ];
            // Error comes from convertMetadataValueToString helper
            expect(() => parseIcrcTokenMetadata(metadata, canisterId))
                .toThrow('Unsupported metadata value type for string conversion.');
        });

        it('should handle empty metadata array', () => {
            const metadata: IcrcTokenMetadataResponse = [];
            // Will throw because all fields are missing
            expect(() => parseIcrcTokenMetadata(metadata, canisterId))
                .toThrow('Missing required token metadata fields.');
        });

        it('should ignore and warn about unrecognized metadata keys', () => {
            const metadata: IcrcTokenMetadataResponse = [
                [IcrcMetadataResponseEntries.SYMBOL, Text('TST')],
                [IcrcMetadataResponseEntries.NAME, Text('Test Token')],
                [IcrcMetadataResponseEntries.DECIMALS, Nat(8n)],
                [IcrcMetadataResponseEntries.FEE, Nat(10000n)],
                [IcrcMetadataResponseEntries.LOGO, Text('logo.png')],
                ['some:other:key', Text('extra value')],
                ['another_unknown_key', Nat(123n)]
            ];

            const expected: ICRCLedgerMetadata = {
                symbol: 'TST',
                name: 'Test Token',
                decimals: 8,
                fee: 10000,
                logo: 'logo.png'
            };

            // Parsing should succeed
            expect(parseIcrcTokenMetadata(metadata, canisterId)).toEqual(expected);

            // Check that warnings were logged
            expect(consoleWarnSpy).toHaveBeenCalledTimes(2);
            expect(consoleWarnSpy).toHaveBeenCalledWith('Unrecognized metadata key: some:other:key');
            expect(consoleWarnSpy).toHaveBeenCalledWith('Unrecognized metadata key: another_unknown_key');
        });

    });
}); 