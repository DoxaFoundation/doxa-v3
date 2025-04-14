/**
 * @fileoverview
 * This file contains tests for the assertion utility functions defined in `assert.utils.ts`.
 * It primarily tests the `assert` function to ensure it behaves correctly under different conditions.
 */

import { describe, it, expect } from 'vitest';
import { assert } from './assert.utils';

describe('assert.utils', () => {
    describe('assert', () => {
        it('should not throw an error if the condition is true', () => {
            const condition = true;
            const message = 'This should not throw';

            // Expecting the function not to throw an error
            expect(() => assert(condition, message)).not.toThrow();
        });

        it('should throw an error with the correct message if the condition is false', () => {
            const condition = false;
            const message = 'This is the expected error message';
            const expectedErrorMessage = `Assertion failed: ${message}`;

            // Expecting the function to throw an error with a specific message
            expect(() => assert(condition, message)).toThrow(expectedErrorMessage);
        });

        it('should handle different truthy values correctly', () => {
            expect(() => assert(1 > 0, 'Truthy condition 1')).not.toThrow();
            expect(() => assert('hello' as any, 'Truthy condition 2')).not.toThrow(); // Using 'as any' for non-boolean truthy
            expect(() => assert({} as any, 'Truthy condition 3')).not.toThrow();    // Using 'as any' for non-boolean truthy
        });

        it('should handle different falsy values correctly', () => {
            const message = 'Falsy condition';
            const expectedErrorMessage = `Assertion failed: ${message}`;
            expect(() => assert(0 < -1, message)).toThrow(expectedErrorMessage);
            expect(() => assert(0 as any, message)).toThrow(expectedErrorMessage); // Using 'as any' for non-boolean falsy
            expect(() => assert('' as any, message)).toThrow(expectedErrorMessage); // Using 'as any' for non-boolean falsy
            expect(() => assert(null as any, message)).toThrow(expectedErrorMessage); // Using 'as any' for non-boolean falsy
            expect(() => assert(undefined as any, message)).toThrow(expectedErrorMessage); // Using 'as any' for non-boolean falsy
        });
    });
}); 