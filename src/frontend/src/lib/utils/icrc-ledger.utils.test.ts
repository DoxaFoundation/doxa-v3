/**
 * @fileoverview
 * This file contains tests for the ICRC ledger utility functions defined in `icrc-ledger.utils.ts`.
 * It tests functions for retrieving ledger IDs and fetching fee information, ensuring correct interaction
 * with the LedgerMetadata state and proper handling of missing data.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    getIcrcLedgerCanisterIds,
    getFeeWithDecimals,
    getFee
} from './icrc-ledger.utils';
import { LedgerMetadata } from '@states/ledger-metadata.svelte'; // Mocked state
import { assertNonNullish } from '@dfinity/utils'; // Mocked function
import * as AppConstants from '@constants/app.constants'; // Import actual constants

// Mock the LedgerMetadata state/store
vi.mock('@states/ledger-metadata.svelte', () => ({
    LedgerMetadata: {
        'icp-id': { fee: 10000, decimals: 8 },
        'ckbtc-id': { fee: 500, decimals: 8 },
        'cketh-id': { fee: 2000, decimals: 18 }, // High decimal count
        'usdx-id': { fee: 0, decimals: 6 }, // Zero fee
        'token-zero-decimals': { fee: 100, decimals: 0 },
        'token-missing-fee': { decimals: 8 },
        'token-missing-decimals': { fee: 20000 },
        'token-null-fee': { fee: null, decimals: 8 },
        'token-null-decimals': { fee: 30000, decimals: null },
        // 'missing-canister' is implicitly tested
    }
}));

// Mock the assertNonNullish function from @dfinity/utils
vi.mock('@dfinity/utils', async (importOriginal) => {
    const original = await importOriginal<typeof import('@dfinity/utils')>();
    return {
        ...original,
        assertNonNullish: vi.fn((value, message) => {
            if (value === null || value === undefined) {
                throw new Error(message || 'Value cannot be null or undefined');
            }
        })
    };
});

// Mock the constants just to ensure the test doesn't rely on their actual values changing
// and to verify getIcrcLedgerCanisterIds returns the expected structure.
vi.mock('@constants/app.constants', () => ({
    USDX_LEDGER_CANISTER_ID: 'usdx-id',
    CKUSDC_LEDGER_CANISTER_ID: 'ckusdc-id', // This one is not in the mocked LedgerMetadata
    ICP_LEDGER_CANISTER_ID: 'icp-id',
    CKBTC_LEDGER_CANISTER_ID: 'ckbtc-id',
    CKETH_LEDGER_CANISTER_ID: 'cketh-id',
    CKUSDT_LEDGER_CANISTER_ID: 'ckusdt-id' // This one is not in the mocked LedgerMetadata
}));

describe('icrc-ledger.utils', () => {

    beforeEach(() => {
        // Reset mocks before each test
        vi.clearAllMocks();
    });

    describe('getIcrcLedgerCanisterIds', () => {
        it('should return an array of the expected canister ID constants', () => {
            const ids = getIcrcLedgerCanisterIds();
            expect(Array.isArray(ids)).toBe(true);
            // Check if it returns the constants defined in the mock
            // Order matters here based on the implementation.
            expect(ids).toEqual([
                AppConstants.USDX_LEDGER_CANISTER_ID, // usdx-id
                AppConstants.CKUSDC_LEDGER_CANISTER_ID, // ckusdc-id
                AppConstants.ICP_LEDGER_CANISTER_ID, // icp-id
                AppConstants.CKBTC_LEDGER_CANISTER_ID, // ckbtc-id
                AppConstants.CKETH_LEDGER_CANISTER_ID, // cketh-id
                AppConstants.CKUSDT_LEDGER_CANISTER_ID // ckusdt-id
            ]);
        });
    });

    describe('getFeeWithDecimals', () => {
        it('should return the raw fee amount from metadata for a valid ledger ID', () => {
            const ledgerId = 'icp-id';
            const expectedFee = 10000; // Raw fee from mock
            expect(getFeeWithDecimals(ledgerId)).toBe(expectedFee);
            expect(assertNonNullish).toHaveBeenCalledWith(expectedFee, expect.stringContaining('Fee not found'));
        });

        it('should return 0 if the raw fee in metadata is 0', () => {
            const ledgerId = 'usdx-id';
            const expectedFee = 0;
            expect(getFeeWithDecimals(ledgerId)).toBe(expectedFee);
            expect(assertNonNullish).toHaveBeenCalledWith(expectedFee, expect.stringContaining('Fee not found'));
        });

        it('should throw error via assertNonNullish if fee is missing in metadata', () => {
            const ledgerId = 'token-missing-fee';
            expect(() => getFeeWithDecimals(ledgerId)).toThrowError(/Fee not found/);
            expect(assertNonNullish).toHaveBeenCalledWith(undefined, expect.stringContaining('Fee not found'));
        });

        it('should throw error via assertNonNullish if fee is null in metadata', () => {
            const ledgerId = 'token-null-fee';
            expect(() => getFeeWithDecimals(ledgerId)).toThrowError(/Fee not found/);
            expect(assertNonNullish).toHaveBeenCalledWith(null, expect.stringContaining('Fee not found'));
        });

        it('should throw error if the ledger ID is not found in metadata', () => {
            const ledgerId = 'non_existent_token';
            expect(() => getFeeWithDecimals(ledgerId)).toThrow();
        });
    });

    describe('getFee', () => {
        it('should calculate and return the fee in standard units for a valid ledger ID', () => {
            const ledgerId = 'icp-id'; // fee: 10000, decimals: 8
            const expectedFee = 10000 / (10 ** 8); // 0.0001
            expect(getFee(ledgerId)).toBe(expectedFee);
            // Check assertNonNullish calls
            expect(assertNonNullish).toHaveBeenCalledWith(10000, expect.stringContaining('Fee not found'));
            expect(assertNonNullish).toHaveBeenCalledWith(8, 'Decimals not found');
        });

        it('should handle high decimal counts correctly', () => {
            const ledgerId = 'cketh-id'; // fee: 2000, decimals: 18
            const expectedFee = 2000 / (10 ** 18); // 2e-15
            expect(getFee(ledgerId)).toBe(expectedFee);
            expect(assertNonNullish).toHaveBeenCalledWith(2000, expect.stringContaining('Fee not found'));
            expect(assertNonNullish).toHaveBeenCalledWith(18, 'Decimals not found');
        });

        it('should return the correct fee if decimals are 0', () => {
            const ledgerId = 'token-zero-decimals'; // fee: 100, decimals: 0
            const expectedFee = 100 / (10 ** 0); // 100 / 1 = 100
            expect(getFee(ledgerId)).toBe(expectedFee);
            expect(assertNonNullish).toHaveBeenCalledWith(100, expect.stringContaining('Fee not found'));
            expect(assertNonNullish).toHaveBeenCalledWith(0, 'Decimals not found');
        });

        it('should return 0 if the fee is 0', () => {
            const ledgerId = 'usdx-id'; // fee: 0, decimals: 6
            const expectedFee = 0 / (10 ** 6); // 0
            expect(getFee(ledgerId)).toBe(expectedFee);
            expect(assertNonNullish).toHaveBeenCalledWith(0, expect.stringContaining('Fee not found'));
            expect(assertNonNullish).toHaveBeenCalledWith(6, 'Decimals not found');
        });

        it('should throw error via assertNonNullish if fee is missing', () => {
            const ledgerId = 'token-missing-fee';
            expect(() => getFee(ledgerId)).toThrowError(/Fee not found/);
            expect(assertNonNullish).toHaveBeenCalledWith(undefined, expect.stringContaining('Fee not found'));
            // assertNonNullish for decimals might not be called if the fee check fails first
        });

        it('should throw error via assertNonNullish if fee is null', () => {
            const ledgerId = 'token-null-fee';
            expect(() => getFee(ledgerId)).toThrowError(/Fee not found/);
            expect(assertNonNullish).toHaveBeenCalledWith(null, expect.stringContaining('Fee not found'));
        });

        it('should throw error via assertNonNullish if decimals are missing', () => {
            const ledgerId = 'token-missing-decimals'; // fee: 20000 exists
            expect(() => getFee(ledgerId)).toThrow('Decimals not found');
            // assertNonNullish for fee would have been called
            expect(assertNonNullish).toHaveBeenCalledWith(20000, expect.stringContaining('Fee not found'));
            // assertNonNullish for decimals would be called with undefined
            expect(assertNonNullish).toHaveBeenCalledWith(undefined, 'Decimals not found');
        });

        it('should throw error via assertNonNullish if decimals are null', () => {
            const ledgerId = 'token-null-decimals'; // fee: 30000 exists
            expect(() => getFee(ledgerId)).toThrow('Decimals not found');
            expect(assertNonNullish).toHaveBeenCalledWith(30000, expect.stringContaining('Fee not found'));
            expect(assertNonNullish).toHaveBeenCalledWith(null, 'Decimals not found');
        });

        it('should throw error if the ledger ID is not found in metadata', () => {
            const ledgerId = 'missing-canister';
            // Will throw TypeError when accessing LedgerMetadata['missing-canister'].fee
            expect(() => getFee(ledgerId)).toThrow();
        });
    });
});
