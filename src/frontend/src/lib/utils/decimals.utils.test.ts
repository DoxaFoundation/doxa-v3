/**
 * @fileoverview
 * This file contains tests for the decimal conversion and manipulation utility functions
 * defined in `decimals.utils.ts`. It covers functions that handle fixed decimals (like 6)
 * and functions that dynamically use token-specific decimals obtained from the LedgerMetadata state.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    from6Decimals,
    to6Decimals,
    truncateDecimal,
    fromBigIntDecimals,
    toBigIntDecimals,
    fromDecimals
} from './decimals.utils';
import { LedgerMetadata } from '@states/ledger-metadata.svelte'; // We will mock this state
import { assertNonNullish } from '@dfinity/utils'; // We will mock this function

// Mock the LedgerMetadata state/store
// Provide mock data for different canister IDs and their decimal counts
vi.mock('@states/ledger-metadata.svelte', () => ({
    LedgerMetadata: {
        canister_token_8: { decimals: 8 },
        canister_token_6: { decimals: 6 },
        canister_token_0: { decimals: 0 },
        // Add canister with nullish decimals to test assertion
        canister_token_null: { decimals: null },
        canister_token_undefined: { decimals: undefined },
        // Canister completely missing
    }
}));

// Mock the assertNonNullish function from @dfinity/utils
// We want the original behavior (throwing an error on null/undefined) for assertion tests,
// but we might want to just check if it's called or suppress errors in success cases if needed.
// A simple way is to mock it to throw directly if input is nullish.
vi.mock('@dfinity/utils', async (importOriginal) => {
    const original = await importOriginal<typeof import('@dfinity/utils')>();
    return {
        ...original, // Keep other exports if any
        assertNonNullish: vi.fn((value, message) => {
            if (value === null || value === undefined) {
                throw new Error(message || 'Value cannot be null or undefined');
            }
        })
    };
});


describe('decimals.utils', () => {

    beforeEach(() => {
        // Reset mocks before each test if they maintain state (like call counts)
        vi.clearAllMocks();

        // Re-setup the mock for assertNonNullish if needed, though the factory should handle it.
        // For functions that use assertNonNullish, we'll re-mock the implementation per test if needed.
    });

    describe('from6Decimals', () => {
        it('should convert 0 bigint to 0 number', () => {
            expect(from6Decimals(0n)).toBe(0);
        });

        it('should convert 1_000_000n (6 decimals) to 1', () => {
            expect(from6Decimals(1_000_000n)).toBe(1);
        });

        it('should convert 1_234_567n (6 decimals) to 1.234567', () => {
            expect(from6Decimals(1_234_567n)).toBe(1.234567);
        });

        it('should handle smaller values', () => {
            expect(from6Decimals(1n)).toBe(0.000001);
        });
    });

    describe('to6Decimals', () => {
        it('should convert 0 number to 0 bigint', () => {
            expect(to6Decimals(0)).toBe(0n);
        });

        it('should convert 1 number to 1_000_000n (6 decimals)', () => {
            expect(to6Decimals(1)).toBe(1_000_000n);
        });

        it('should convert 1.234567 number to 1_234_567n (6 decimals)', () => {
            // Be careful with floating point precision issues
            expect(to6Decimals(1.234567)).toBe(1_234_567n);
        });

        it('should handle numbers with more decimals (truncation expected by BigInt conversion)', () => {
            // BigInt(1.2345678 * 1000000) = BigInt(1234567.8) = 1234567n
            expect(to6Decimals(1.2345678)).toBe(1_234_567n);
        });

        it('should handle small fractions', () => {
            expect(to6Decimals(0.000001)).toBe(1n);
        });
    });

    describe('truncateDecimal', () => {
        it('should truncate a number to the specified decimal places', () => {
            expect(truncateDecimal(1.234567, 3)).toBe(1.234);
        });

        it('should not round the number', () => {
            expect(truncateDecimal(1.9876, 1)).toBe(1.9);
        });

        it('should handle truncation to 0 decimal places', () => {
            expect(truncateDecimal(5.678, 0)).toBe(5);
        });

        it('should handle numbers with fewer decimals than requested places', () => {
            expect(truncateDecimal(1.2, 4)).toBe(1.2);
        });

        it('should handle integers', () => {
            expect(truncateDecimal(10, 2)).toBe(10);
        });

        it('should handle negative numbers', () => {
            expect(truncateDecimal(-1.2345, 2)).toBe(-1.23);
        });
    });

    describe('fromBigIntDecimals', () => {
        it('should convert bigint using 8 decimals', () => {
            const value = 123456789n; // Represents 1.23456789
            const canisterId = 'canister_token_8';
            expect(fromBigIntDecimals(value, canisterId)).toBe(1.23456789);
        });

        it('should convert bigint using 6 decimals', () => {
            const value = 1234567n; // Represents 1.234567
            const canisterId = 'canister_token_6';
            expect(fromBigIntDecimals(value, canisterId)).toBe(1.234567);
        });

        it('should convert bigint using 0 decimals', () => {
            const value = 123n; // Represents 123
            const canisterId = 'canister_token_0';
            expect(fromBigIntDecimals(value, canisterId)).toBe(123);
        });

        it('should handle 0 value', () => {
            expect(fromBigIntDecimals(0n, 'canister_token_8')).toBe(0);
        });

        it('should throw error if decimals metadata is null', () => {
            const value = 100n;
            const canisterId = 'canister_token_null';
            // Check that the mocked assertNonNullish throws
            expect(() => fromBigIntDecimals(value, canisterId)).toThrow();
            expect(assertNonNullish).toHaveBeenCalledWith(null, expect.any(String));
        });

        it('should throw error if decimals metadata is undefined', () => {
            const value = 100n;
            const canisterId = 'canister_token_undefined';
            expect(() => fromBigIntDecimals(value, canisterId)).toThrow();
            expect(assertNonNullish).toHaveBeenCalledWith(undefined, expect.any(String));
        });

        it('should throw error if canisterId metadata does not exist', () => {
            // This tests if accessing LedgerMetadata['missing_id'].decimals throws appropriately
            // It might throw a TypeError before assertNonNullish is even called.
            const value = 100n;
            const canisterId = 'missing_id';
            // We expect an error, likely TypeError cannot read 'decimals' of undefined
            expect(() => fromBigIntDecimals(value, canisterId)).toThrow();
        });
    });

    describe('toBigIntDecimals', () => {
        it('should convert number to bigint using 8 decimals', () => {
            const value = 1.23456789;
            const canisterId = 'canister_token_8';
            expect(toBigIntDecimals(value, canisterId)).toBe(123456789n);
        });

        it('should convert number to bigint using 6 decimals', () => {
            const value = 1.234567;
            const canisterId = 'canister_token_6';
            expect(toBigIntDecimals(value, canisterId)).toBe(1234567n);
        });

        it('should convert number to bigint using 0 decimals', () => {
            const value = 123.45; // Should truncate to 123
            const canisterId = 'canister_token_0';
            expect(toBigIntDecimals(value, canisterId)).toBe(123n);
        });

        it('should handle 0 value', () => {
            expect(toBigIntDecimals(0, 'canister_token_8')).toBe(0n);
        });

        it('should truncate input value before converting', () => {
            const value = 1.23456789123; // More than 8 decimals
            const canisterId = 'canister_token_8';
            // Math.trunc(1.23456789123 * 10^8) = Math.trunc(123456789.123) = 123456789
            expect(toBigIntDecimals(value, canisterId)).toBe(123456789n);
        });

        it('should throw error if decimals metadata is null', () => {
            const value = 1.23;
            const canisterId = 'canister_token_null';
            expect(() => toBigIntDecimals(value, canisterId)).toThrow();
            expect(assertNonNullish).toHaveBeenCalledWith(null, expect.any(String));
        });

        it('should throw error if decimals metadata is undefined', () => {
            const value = 1.23;
            const canisterId = 'canister_token_undefined';
            expect(() => toBigIntDecimals(value, canisterId)).toThrow();
            expect(assertNonNullish).toHaveBeenCalledWith(undefined, expect.any(String));
        });

        it('should throw error if canisterId metadata does not exist', () => {
            const value = 1.23;
            const canisterId = 'missing_id';
            expect(() => toBigIntDecimals(value, canisterId)).toThrow();
        });
    });

    describe('fromDecimals', () => {
        // This function seems similar to fromBigIntDecimals but takes a number.
        // Assuming 'value' is a number that already represents the smallest unit (like satoshis).
        it('should convert number using 8 decimals', () => {
            const value = 123456789; // Represents 1.23456789
            const canisterId = 'canister_token_8';
            expect(fromDecimals(value, canisterId)).toBe(1.23456789);
        });

        it('should convert number using 6 decimals', () => {
            const value = 1234567; // Represents 1.234567
            const canisterId = 'canister_token_6';
            expect(fromDecimals(value, canisterId)).toBe(1.234567);
        });

        it('should convert number using 0 decimals', () => {
            const value = 123; // Represents 123
            const canisterId = 'canister_token_0';
            expect(fromDecimals(value, canisterId)).toBe(123);
        });

        it('should handle 0 value', () => {
            expect(fromDecimals(0, 'canister_token_8')).toBe(0);
        });

        it('should throw error if decimals metadata is null', () => {
            const value = 100;
            const canisterId = 'canister_token_null';
            expect(() => fromDecimals(value, canisterId)).toThrow();
            expect(assertNonNullish).toHaveBeenCalledWith(null, expect.any(String));
        });

        it('should throw error if decimals metadata is undefined', () => {
            const value = 100;
            const canisterId = 'canister_token_undefined';
            expect(() => fromDecimals(value, canisterId)).toThrow();
            expect(assertNonNullish).toHaveBeenCalledWith(undefined, expect.any(String));
        });

        it('should throw error if canisterId metadata does not exist', () => {
            const value = 100;
            const canisterId = 'missing_id';
            expect(() => fromDecimals(value, canisterId)).toThrow();
        });
    });
}); 