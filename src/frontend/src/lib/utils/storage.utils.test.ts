/**
 * @fileoverview
 * This file contains tests for the localStorage utility functions defined in `storage.utils.ts`.
 * It tests the `set`, `get`, and `del` operations using a mocked localStorage environment.
 *
 * @vitest-environment jsdom // Provides a basic localStorage mock
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { set, get, del } from './storage.utils';
import { nonNullish } from '@dfinity/utils'; // Import the actual function

// Mock the $app/environment module
vi.mock('$app/environment', () => ({
    browser: true // Simulate browser environment for the 'get' function logic
}));

// Although jsdom provides localStorage, we can spy on its methods
// to ensure our functions interact with it correctly.
describe('storage.utils', () => {
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
    let setItemSpy: ReturnType<typeof vi.spyOn>;
    let getItemSpy: ReturnType<typeof vi.spyOn>;
    let removeItemSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        // Reset mocks and spies
        vi.clearAllMocks();
        consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

        // Clear localStorage provided by jsdom
        localStorage.clear();

        // Spy on localStorage methods
        setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
        getItemSpy = vi.spyOn(Storage.prototype, 'getItem');
        removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem');
    });

    afterEach(() => {
        consoleErrorSpy.mockRestore();
        setItemSpy.mockRestore();
        getItemSpy.mockRestore();
        removeItemSpy.mockRestore();
    });

    describe('set', () => {
        it('should stringify value and call localStorage.setItem', () => {
            const key = 'setKey';
            const value = { data: 'test', count: 1 };
            const expectedStringifiedValue = JSON.stringify(value);

            set({ key, value });

            expect(setItemSpy).toHaveBeenCalledTimes(1);
            expect(setItemSpy).toHaveBeenCalledWith(key, expectedStringifiedValue);
            // Also check the actual value in the jsdom localStorage
            expect(localStorage.getItem(key)).toBe(expectedStringifiedValue);
        });

        it('should catch errors during setItem and log them', () => {
            const key = 'setErrorKey';
            const value = 'value';
            const setError = new Error('setItem failed');
            setItemSpy.mockImplementationOnce(() => { throw setError; });

            set({ key, value });

            expect(setItemSpy).toHaveBeenCalledTimes(1);
            expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
            expect(consoleErrorSpy).toHaveBeenCalledWith(setError);
        });

        it('should handle setting different data types', () => {
            const keyStr = 'typeKeyStr'; const valStr = 'a string';
            const keyNum = 'typeKeyNum'; const valNum = 123;
            const keyBool = 'typeKeyBool'; const valBool = true;
            const keyNull = 'typeKeyNull'; const valNull = null;

            set({ key: keyStr, value: valStr });
            expect(localStorage.getItem(keyStr)).toBe(JSON.stringify(valStr));

            set({ key: keyNum, value: valNum });
            expect(localStorage.getItem(keyNum)).toBe(JSON.stringify(valNum));

            set({ key: keyBool, value: valBool });
            expect(localStorage.getItem(keyBool)).toBe(JSON.stringify(valBool));

            set({ key: keyNull, value: valNull });
            expect(localStorage.getItem(keyNull)).toBe(JSON.stringify(valNull)); // "null"
        });
    });

    describe('get', () => {
        it('should call localStorage.getItem and parse the value', () => {
            const key = 'getKey';
            const value = { message: 'retrieved' };
            localStorage.setItem(key, JSON.stringify(value)); // Setup localStorage directly

            const retrievedValue = get<typeof value>({ key });

            expect(getItemSpy).toHaveBeenCalledTimes(1);
            expect(getItemSpy).toHaveBeenCalledWith(key);
            expect(retrievedValue).toEqual(value);
        });

        it('should return undefined if the key does not exist', () => {
            const key = 'getNonExistentKey';
            const retrievedValue = get<string>({ key });

            expect(getItemSpy).toHaveBeenCalledTimes(1);
            expect(getItemSpy).toHaveBeenCalledWith(key);
            expect(retrievedValue).toBeUndefined();
        });

        it('should return undefined if the stored value is null or invalid JSON after retrieval', () => {
            const keyNull = 'getNullKey';
            localStorage.setItem(keyNull, 'null'); // Stored as the string "null"
            const retrievedNull = get<null>({ key: keyNull });
            expect(retrievedNull).toBeNull(); // JSON.parse('null') is null

            const keyUndefinedStr = 'getUndefinedStrKey';
            // localStorage cannot store actual undefined, getItem returns null if not found.
            // Let's test invalid JSON
            const keyInvalidJson = 'getInvalidJsonKey';
            localStorage.setItem(keyInvalidJson, '{ invalid JSON');
            const retrievedInvalid = get<object>({ key: keyInvalidJson });
            expect(retrievedInvalid).toBeUndefined();
            expect(consoleErrorSpy).toHaveBeenCalledTimes(1); // JSON.parse error logged

            // Test case where nonNullish returns false (though parse happens first)
            // getItem returning null is the main path to undefined here.
        });

        it('should handle getting different stored data types', () => {
            const keyStr = 'gettypeKeyStr'; const valStr = 'a string';
            const keyNum = 'gettypeKeyNum'; const valNum = 123;
            const keyBool = 'gettypeKeyBool'; const valBool = true;
            const keyObj = 'gettypeKeyObj'; const valObj = { a: 1 };

            localStorage.setItem(keyStr, JSON.stringify(valStr));
            expect(get<string>({ key: keyStr })).toBe(valStr);

            localStorage.setItem(keyNum, JSON.stringify(valNum));
            expect(get<number>({ key: keyNum })).toBe(valNum);

            localStorage.setItem(keyBool, JSON.stringify(valBool));
            expect(get<boolean>({ key: keyBool })).toBe(valBool);

            localStorage.setItem(keyObj, JSON.stringify(valObj));
            expect(get<object>({ key: keyObj })).toEqual(valObj);
        });

        it('should catch errors during getItem or parsing and log them, returning undefined', () => {
            const key = 'getErrorKey';
            const getError = new Error('getItem failed');
            getItemSpy.mockImplementationOnce(() => { throw getError; });

            const retrievedValue = get<string>({ key });

            expect(getItemSpy).toHaveBeenCalledTimes(1);
            expect(retrievedValue).toBeUndefined();
            expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
            expect(consoleErrorSpy).toHaveBeenCalledWith(getError);
        });
    });

    describe('del', () => {
        it('should call localStorage.removeItem for an existing key', () => {
            const key = 'delKey';
            const value = 'to be deleted';
            localStorage.setItem(key, JSON.stringify(value));

            del({ key });

            expect(removeItemSpy).toHaveBeenCalledTimes(1);
            expect(removeItemSpy).toHaveBeenCalledWith(key);
            // Verify item is actually removed
            expect(localStorage.getItem(key)).toBeNull();
        });

        it('should call localStorage.removeItem even if the key does not exist', () => {
            const key = 'delNonExistentKey';

            del({ key });

            expect(removeItemSpy).toHaveBeenCalledTimes(1);
            expect(removeItemSpy).toHaveBeenCalledWith(key);
            expect(consoleErrorSpy).not.toHaveBeenCalled(); // No error expected
        });

        it('should catch errors during removeItem and log them', () => {
            const key = 'delErrorKey';
            const delError = new Error('removeItem failed');
            removeItemSpy.mockImplementationOnce(() => { throw delError; });

            // Set item first so it exists
            localStorage.setItem(key, '"data"');

            del({ key });

            expect(removeItemSpy).toHaveBeenCalledTimes(1);
            expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
            expect(consoleErrorSpy).toHaveBeenCalledWith(delError);
            // Check if item might still be there if removeItem failed before actual removal
            // This depends on the mock's behavior, but typically the operation fails.
        });
    });
}); 