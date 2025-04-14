/**
 * @fileoverview
 * This file contains tests for the formatting utility functions defined in `fromat.utils.ts`.
 * It covers functions for formatting numbers based on token decimals, USD values, raw numbers,
 * and BigInt balances, including truncation, rounding, trailing zero removal, and thousand separators.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    formatNumber,
    formatUsdValue,
    formatRawNumber,
    displayBigIntBalanceInFormat
} from './fromat.utils'; // Note: using the actual filename 'fromat.utils.ts'
import { LedgerMetadata } from '@states/ledger-metadata.svelte'; // Mocked state
import { fromBigIntDecimals } from './decimals.utils'; // Dependency used by displayBigIntBalanceInFormat

// Mock the LedgerMetadata state/store (Same mock data as in decimals.utils.test.ts)
vi.mock('@states/ledger-metadata.svelte', () => ({
    LedgerMetadata: {
        token_8_decimals: { decimals: 8 },
        token_6_decimals: { decimals: 6 },
        token_2_decimals: { decimals: 2 },
        token_0_decimals: { decimals: 0 },
        token_missing: {} // To test missing decimals property
        // Canister completely missing will be tested implicitly
    }
}));

// Mock the fromBigIntDecimals function from decimals.utils
// We need this because displayBigIntBalanceInFormat calls it.
// We can mock its behavior based on expected inputs/outputs,
// especially since it also depends on the LedgerMetadata mock.
vi.mock('./decimals.utils', async (importOriginal) => {
    const actual = await importOriginal<typeof import('./decimals.utils')>();
    // Simple mock: assumes LedgerMetadata mock is available and returns number based on it.
    // This avoids needing the assertNonNullish mock directly here again.
    return {
        ...actual, // Keep other exports from decimals.utils if needed
        fromBigIntDecimals: vi.fn((value: bigint, canisterId: string): number => {
            const meta = LedgerMetadata[canisterId];
            if (!meta || typeof meta.decimals !== 'number') {
                // Simulate the error or return NaN/specific value if needed for tests
                // For simplicity, we'll rely on formatNumber throwing if decimals are bad.
                // Let's refine: mimic the original function's dependency on decimals.
                if (!meta || meta.decimals === null || meta.decimals === undefined) {
                    throw new Error('Mock Decimals not found for ' + canisterId);
                }
                return Number(value) / 10 ** meta.decimals;
            }
            const decimals = meta.decimals;
            return Number(value) / 10 ** decimals;
        })
    };
});


describe('fromat.utils', () => {

    beforeEach(() => {
        // Reset call counts for mocks if necessary
        vi.clearAllMocks();
    });

    describe('formatNumber', () => {
        const canister8 = 'token_8_decimals'; // 8 decimals
        const canister2 = 'token_2_decimals'; // 2 decimals
        const canister0 = 'token_0_decimals'; // 0 decimals

        it('should truncate and format with 8 decimals correctly', () => {
            // Truncation test (1.234567895 should become 1.23456789)
            expect(formatNumber(1.234567895, canister8)).toBe('1.23456789');
            // Thousand separators
            expect(formatNumber(12345.6789, canister8)).toBe("12'345.6789");
            // Remove trailing zeros
            expect(formatNumber(123.45000000, canister8)).toBe('123.45');
            // Integer case
            expect(formatNumber(123456789, canister8)).toBe("123'456'789");
            // Number that becomes integer after truncation/cleaning
            expect(formatNumber(5.000000001, canister8)).toBe('5');
            // Small number
            expect(formatNumber(0.00000001, canister8)).toBe('0.00000001');
            expect(formatNumber(0.00000000, canister8)).toBe('0');
        });

        it('should truncate and format with 2 decimals correctly', () => {
            expect(formatNumber(123.456, canister2)).toBe('123.45'); // Truncation
            expect(formatNumber(987654.32, canister2)).toBe("987'654.32"); // Separators
            expect(formatNumber(100.00, canister2)).toBe('100'); // Remove trailing .00
            expect(formatNumber(50.10, canister2)).toBe('50.1'); // Remove one trailing 0
            expect(formatNumber(0.01, canister2)).toBe('0.01');
            expect(formatNumber(0.00, canister2)).toBe('0');
        });

        it('should truncate and format with 0 decimals correctly', () => {
            expect(formatNumber(123.456, canister0)).toBe('123'); // Truncation
            expect(formatNumber(987654321, canister0)).toBe("987'654'321"); // Separators
            expect(formatNumber(100.00, canister0)).toBe('100');
            expect(formatNumber(0.9, canister0)).toBe('0');
        });

        it('should handle zero', () => {
            expect(formatNumber(0, canister8)).toBe('0');
            expect(formatNumber(0, canister0)).toBe('0');
        });

        it('should handle negative numbers', () => {
            expect(formatNumber(-12345.6789, canister8)).toBe("-12'345.6789");
            expect(formatNumber(-1.2345, canister2)).toBe('-1.23'); // Truncation
            expect(formatNumber(-5000, canister0)).toBe("-5'000");
        });

        it('should throw error if canister metadata or decimals are missing', () => {
            // Directly missing canister
            expect(() => formatNumber(100, 'non_existent_canister')).toThrow();
            // Canister exists, but decimals property is missing
            expect(() => formatNumber(100, 'token_missing')).toThrow(); // TypeError: Cannot read properties of undefined (reading 'pow') or similar
        });
    });

    describe('formatUsdValue', () => {
        // Reminder: Uses number.toFixed() which rounds, not truncates.
        // Decimals: 6 if < 1, else 2

        it('should format numbers < 1 using 6 decimals (rounded) and cleanup', () => {
            expect(formatUsdValue(0.1234567)).toBe('0.123457'); // Rounds up, 6 places
            expect(formatUsdValue(0.9876543)).toBe('0.987654'); // Rounds down, 6 places
            expect(formatUsdValue(0.100000)).toBe('0.1'); // Remove trailing zeros
            expect(formatUsdValue(0.000001)).toBe('0.000001');
            expect(formatUsdValue(0)).toBe('0'); // Uses 6 decimals initially -> '0.000000' -> '0'
        });

        it('should format numbers >= 1 using 2 decimals (rounded) and cleanup', () => {
            expect(formatUsdValue(1)).toBe('1'); // 1.toFixed(2) -> '1.00' -> '1'
            expect(formatUsdValue(1.234)).toBe('1.23'); // Rounds down
            expect(formatUsdValue(1.987)).toBe('1.99'); // Rounds up
            expect(formatUsdValue(12345.678)).toBe("12'345.68"); // Rounds up, adds separators
            expect(formatUsdValue(5000.00)).toBe("5'000"); // Removes trailing .00
            expect(formatUsdValue(5000.10)).toBe("5'000.1"); // Removes one trailing 0
        });

        it('should handle negative numbers', () => {
            expect(formatUsdValue(-0.1234567)).toBe('-0.123457'); // < 1 rule applies based on absolute value? No, based on the number itself. -0.1 < 1.
            expect(formatUsdValue(-1)).toBe('-1');
            expect(formatUsdValue(-1.234)).toBe('-1.23');
            expect(formatUsdValue(-12345.678)).toBe("-12'345.68");
        });

        it('should handle boundaries around 1', () => {
            expect(formatUsdValue(0.9999999)).toBe('1'); // 0.9999999 < 1 -> 6 decimals -> 1.000000 -> '1'
            expect(formatUsdValue(1.0000001)).toBe('1'); // >= 1 -> 2 decimals -> 1.00 -> '1'
        });
    });

    describe('formatRawNumber', () => {
        it('should add thousand separators to integers', () => {
            expect(formatRawNumber(1234567)).toBe("1'234'567");
        });

        it('should add thousand separators to the integer part of decimals', () => {
            expect(formatRawNumber(12345.6789)).toBe("12'345.6789");
        });

        it('should not add separators to numbers < 1000', () => {
            expect(formatRawNumber(999)).toBe('999');
            expect(formatRawNumber(100.50)).toBe('100.50');
        });

        it('should handle zero', () => {
            expect(formatRawNumber(0)).toBe('0');
            expect(formatRawNumber(0.123)).toBe('0.123');
        });

        it('should handle negative numbers', () => {
            expect(formatRawNumber(-1234567)).toBe("-1'234'567");
            expect(formatRawNumber(-12345.6789)).toBe("-12'345.6789");
            expect(formatRawNumber(-999)).toBe('-999');
        });
    });

    describe('displayBigIntBalanceInFormat', () => {
        // This relies on the mocks for LedgerMetadata and fromBigIntDecimals,
        // and the actual implementation of formatNumber.

        const canister8 = 'token_8_decimals'; // 8 decimals
        const canister2 = 'token_2_decimals'; // 2 decimals
        const canister0 = 'token_0_decimals'; // 0 decimals

        it('should format bigint with 8 decimals correctly', () => {
            const balance = 1234567891234n; // Represents 12345.67891234
            // fromBigIntDecimals -> 12345.67891234
            // formatNumber (truncates to 8) -> 12345.67891234 -> adds separators
            expect(displayBigIntBalanceInFormat(balance, canister8)).toBe("12'345.67891234");

            const balanceZero = 0n;
            expect(displayBigIntBalanceInFormat(balanceZero, canister8)).toBe('0');

            const balanceSmall = 1n; // 0.00000001
            expect(displayBigIntBalanceInFormat(balanceSmall, canister8)).toBe('0.00000001');
        });

        it('should format bigint with 2 decimals correctly', () => {
            const balance = 1234567n; // Represents 12345.67
            // fromBigIntDecimals -> 12345.67
            // formatNumber (truncates to 2) -> 12345.67 -> adds separators
            expect(displayBigIntBalanceInFormat(balance, canister2)).toBe("12'345.67");

            const balanceTrunc = 123456789n; // Represents 1234567.89
            // fromBigIntDecimals -> 1234567.89
            // formatNumber (truncates to 2) -> 1234567.89 -> adds separators
            expect(displayBigIntBalanceInFormat(balanceTrunc, canister2)).toBe("1'234'567.89"); // Should truncate to 1234567.89
        });

        it('should format bigint with 0 decimals correctly', () => {
            const balance = 1234567n; // Represents 1234567
            // fromBigIntDecimals -> 1234567
            // formatNumber (truncates to 0) -> 1234567 -> adds separators
            expect(displayBigIntBalanceInFormat(balance, canister0)).toBe("1'234'567");

            const balanceWithDecimalPart = 123n; // Represents 123
            // fromBigIntDecimals -> 123
            // formatNumber -> 123
            expect(displayBigIntBalanceInFormat(balanceWithDecimalPart, canister0)).toBe('123');
        });

        it('should throw if underlying functions throw due to missing metadata', () => {
            const balance = 100n;
            // Should throw inside the mocked fromBigIntDecimals or formatNumber
            expect(() => displayBigIntBalanceInFormat(balance, 'non_existent_canister')).toThrow();
            expect(() => displayBigIntBalanceInFormat(balance, 'token_missing')).toThrow();
        });
    });
}); 