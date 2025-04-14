/**
 * @fileoverview
 * This file contains tests for the date and time utility functions defined in `date-time.utils.ts`.
 * It covers conversions between days and nanoseconds, timestamp formatting, and relative date calculations.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    daysToNanoseconds,
    nanosecondsToDays,
    formatTimestamp,
    formatBigIntNanoSecTimestamp,
    formatTimestampWithDaysFromNow
} from './date-time.utils';
import type { DateWithRemainingDays } from '$lib/types/staking';

// Constants for testing
const NANOSECONDS_PER_DAY = 24n * 60n * 60n * 1_000_000_000n;

describe('date-time.utils', () => {
    describe('daysToNanoseconds', () => {
        it('should convert 0 days to 0 nanoseconds', () => {
            expect(daysToNanoseconds(0)).toBe(0n);
        });

        it('should convert 1 day to the correct number of nanoseconds', () => {
            expect(daysToNanoseconds(1)).toBe(NANOSECONDS_PER_DAY);
        });

        it('should convert multiple days to the correct number of nanoseconds', () => {
            expect(daysToNanoseconds(10)).toBe(10n * NANOSECONDS_PER_DAY);
        });

        // It should handle non-integer days by effectively truncating (as BigInt conversion does)
        // Although the type is number, passing floats might happen in JS.
        it('should handle non-integer days (truncating)', () => {
            expect(daysToNanoseconds(1.5)).toEqual(NANOSECONDS_PER_DAY); // BigInt(1.5) becomes 1n
        });
    });

    describe('nanosecondsToDays', () => {
        it('should convert 0 nanoseconds to 0 days', () => {
            expect(nanosecondsToDays(0n)).toBe(0);
        });

        it('should convert nanoseconds equivalent to 1 day to 1', () => {
            expect(nanosecondsToDays(NANOSECONDS_PER_DAY)).toBe(1);
        });

        it('should convert nanoseconds equivalent to multiple days correctly', () => {
            expect(nanosecondsToDays(10n * NANOSECONDS_PER_DAY)).toBe(10);
        });

        it('should handle nanoseconds less than a full day (integer division)', () => {
            expect(nanosecondsToDays(NANOSECONDS_PER_DAY / 2n)).toBe(0); // Integer division results in 0
        });

        it('should handle nanoseconds slightly more than a day (integer division)', () => {
            expect(nanosecondsToDays(NANOSECONDS_PER_DAY + 1000n)).toBe(1); // Integer division results in 1
        });
    });

    describe('formatTimestamp', () => {
        it('should format a timestamp correctly (e.g., Unix epoch)', () => {
            // Unix epoch in milliseconds
            const timestamp = 0;
            // Expecting result based on UTC date, common in tests
            expect(formatTimestamp(timestamp)).toBe('1 Jan 1970');
        });

        it('should format a specific date correctly', () => {
            // Specific date: 15th May 2023, 00:00:00 UTC
            const date = new Date(Date.UTC(2023, 4, 15)); // Month is 0-indexed (4 = May)
            const timestamp = date.getTime();
            expect(formatTimestamp(timestamp)).toBe('15 May 2023');
        });

        it('should format a date in a different year correctly', () => {
            const date = new Date(Date.UTC(2024, 11, 31)); // 31st Dec 2024
            const timestamp = date.getTime();
            expect(formatTimestamp(timestamp)).toBe('31 Dec 2024');
        });
    });

    describe('formatBigIntNanoSecTimestamp', () => {
        it('should convert BigInt nanoseconds to milliseconds and format correctly', () => {
            // 1 Jan 1970 00:00:00 UTC in nanoseconds
            const timestampNano = 0n;
            expect(formatBigIntNanoSecTimestamp(timestampNano)).toBe('1 Jan 1970');
        });

        it('should format a specific date provided in nanoseconds', () => {
            // 15th May 2023 00:00:00 UTC
            const date = new Date(Date.UTC(2023, 4, 15));
            const timestampMillis = BigInt(date.getTime());
            const timestampNano = timestampMillis * 1_000_000n;
            expect(formatBigIntNanoSecTimestamp(timestampNano)).toBe('15 May 2023');
        });

        it('should handle large nanosecond values', () => {
            // 31st Dec 2024 00:00:00 UTC
            const date = new Date(Date.UTC(2024, 11, 31));
            const timestampMillis = BigInt(date.getTime());
            const timestampNano = timestampMillis * 1_000_000n;
            expect(formatBigIntNanoSecTimestamp(timestampNano)).toBe('31 Dec 2024');
        });
    });

    describe('formatTimestampWithDaysFromNow', () => {
        // Use fake timers to control 'new Date()'
        beforeEach(() => {
            // Set a fixed "now" date: 10th June 2024, 12:00:00 UTC
            const fakeNow = new Date(Date.UTC(2024, 5, 10, 12, 0, 0)); // Month 5 = June
            vi.useFakeTimers();
            vi.setSystemTime(fakeNow);
        });

        afterEach(() => {
            // Restore real timers after each test
            vi.useRealTimers();
        });

        it('should return the correct formatted date and remaining days for a future timestamp', () => {
            // Target date: 20th June 2024, 00:00:00 UTC (10 days after "now", considering Math.ceil)
            const futureDate = new Date(Date.UTC(2024, 5, 20, 0, 0, 0));
            const futureTimestampMillis = BigInt(futureDate.getTime());
            const futureTimestampNano = futureTimestampMillis * 1_000_000n;

            const result: DateWithRemainingDays = formatTimestampWithDaysFromNow(futureTimestampNano);

            expect(result.date).toBe('20 Jun 2024');
            // Calculation:
            // future = 1718841600000 ms (20 Jun 2024 00:00 UTC)
            // now    = 1718020800000 ms (10 Jun 2024 12:00 UTC)
            // diffMs = 820800000
            // diffDays = ceil(820800000 / (1000 * 60 * 60 * 24)) = ceil(9.5) = 10
            expect(result.remainingDays).toBe(10);
        });

        it('should return 0 remaining days if the timestamp is in the past relative to "now"', () => {
            // Target date: 1st June 2024 (before "now")
            const pastDate = new Date(Date.UTC(2024, 5, 1));
            const pastTimestampMillis = BigInt(pastDate.getTime());
            const pastTimestampNano = pastTimestampMillis * 1_000_000n;

            const result: DateWithRemainingDays = formatTimestampWithDaysFromNow(pastTimestampNano);

            expect(result.date).toBe('1 Jun 2024');
            // Calculation: diff will be negative, Math.ceil will bring it towards 0 or be negative.
            // The function should probably handle this case gracefully, maybe returning 0 or negative.
            // Based on Math.ceil(negative / positive) => negative result, e.g., ceil(-9.5) = -9
            // Let's assume 0 is desired for "past". The current impl gives ceil(negative) = negative days.
            // We'll test the *actual* behavior first. If 0 is desired, the function needs adjustment.
            expect(result.remainingDays).toBeLessThanOrEqual(0); // Test the actual behavior first
            // Actual calculation: diff = -799200000 ms => ceil(-9.25) = -9
            expect(result.remainingDays).toBe(-9);

            // If the requirement is to show 0 for past dates, the test would be:
            // expect(result.remainingDays).toBe(0);
            // And the function would need `Math.max(0, Math.ceil(...))`
        });

        it('should return 1 remaining day if the timestamp is within the next 24 hours from "now"', () => {
            // Target date: 11th June 2024, 11:59:59 UTC (just under 24 hours from "now")
            const nextDayDate = new Date(Date.UTC(2024, 5, 11, 11, 59, 59));
            const nextDayTimestampMillis = BigInt(nextDayDate.getTime());
            const nextDayTimestampNano = nextDayTimestampMillis * 1_000_000n;

            const result: DateWithRemainingDays = formatTimestampWithDaysFromNow(nextDayTimestampNano);

            expect(result.date).toBe('11 Jun 2024');
            // Calculation: diff is just under 24 hours -> ceil(0.something) = 1
            expect(result.remainingDays).toBe(1);
        });

        it('should return correct days even if the future date is in the next year', () => {
            // Target date: 10th Jan 2025
            const futureDate = new Date(Date.UTC(2025, 0, 10)); // Month 0 = Jan
            const futureTimestampMillis = BigInt(futureDate.getTime());
            const futureTimestampNano = futureTimestampMillis * 1_000_000n;

            const result: DateWithRemainingDays = formatTimestampWithDaysFromNow(futureTimestampNano);

            // Calculate expected days manually or using Date difference
            const now = new Date(Date.UTC(2024, 5, 10, 12, 0, 0));
            const diffInMs = futureDate.getTime() - now.getTime();
            const expectedDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24)); // ~213.5 -> 214

            expect(result.date).toBe('10 Jan 2025');
            expect(result.remainingDays).toBe(expectedDays); // Should be 214
        });
    });
}); 