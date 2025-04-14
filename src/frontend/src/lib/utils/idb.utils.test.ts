/**
 * @fileoverview
 * This file contains tests for the IndexedDB utility functions defined in `idb.utils.ts`.
 * It tests the `set`, `get`, and `del` operations using a mocked IndexedDB environment.
 *
 * @vitest-environment jsdom  // Or ensure fake-indexeddb/auto is loaded in setup
 * @requires fake-indexeddb  // This library is needed for these tests to run
 */

import 'fake-indexeddb/auto';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
// Assuming the actual filename is idb.utilts.ts
import { set, get, del } from './idb.utilts';
// Requires fake-indexeddb setup (e.g., import 'fake-indexeddb/auto' in test setup file)

// Mock the $app/environment module
vi.mock('$app/environment', () => ({
    browser: true // Simulate browser environment
}));

const dbName = 'doxa-db'; // As defined in the module

describe('idb.utils', () => {
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(async () => {
        // Reset mocks
        vi.clearAllMocks();
        consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { }); // Suppress console errors

        // Ensure a clean state for fake-indexeddb before each test
        // Close any existing connection if dbPromise was cached (tricky to access directly)
        // Easiest is often to just delete the database
        const request = indexedDB.deleteDatabase(dbName);
        await new Promise<void>((resolve, reject) => {
            request.onsuccess = () => resolve();
            request.onerror = (e) => {
                console.warn('Error deleting fake DB before test:', request.error);
                resolve(); // Resolve anyway to continue tests
            };
            request.onblocked = () => {
                console.warn('Fake DB delete blocked before test. Trying to force close.');
                // Attempt to force close, might require more complex handling if dbPromise isn't reset
                resolve();
            };
        });
        // Reset the internal dbPromise cache by potentially clearing module cache if Vitest supports it easily,
        // or by ensuring tests don't rely on state across calls if possible.
        // For now, we assume deleting the DB is sufficient for fake-indexeddb isolation.
    });

    afterEach(() => {
        consoleErrorSpy.mockRestore();
        // You could potentially delete the DB after each test too if needed
    });

    it('should set and get a string value', async () => {
        const key = 'testStringKey';
        const value = 'Hello IndexedDB!';

        await set({ key, value });
        const retrievedValue = await get<string>({ key });

        expect(retrievedValue).toBe(value);
    });

    it('should set and get a number value', async () => {
        const key = 'testNumberKey';
        const value = 123.456;

        await set({ key, value });
        const retrievedValue = await get<number>({ key });

        expect(retrievedValue).toBe(value);
    });

    it('should set and get an object value', async () => {
        const key = 'testObjectKey';
        const value = { name: 'Test Object', id: 1, active: true };

        await set({ key, value });
        const retrievedValue = await get<typeof value>({ key });

        expect(retrievedValue).toEqual(value);
    });

    it('should set and get an array value', async () => {
        const key = 'testArrayKey';
        const value = [1, 'two', { three: 3 }, null];

        await set({ key, value });
        const retrievedValue = await get<typeof value>({ key });

        expect(retrievedValue).toEqual(value);
    });

    it('should return undefined when getting a non-existent key', async () => {
        const key = 'nonExistentKey';
        const retrievedValue = await get<string>({ key });

        expect(retrievedValue).toBeUndefined();
    });

    it('should overwrite an existing value when setting the same key', async () => {
        const key = 'overwriteKey';
        const initialValue = 'Initial';
        const newValue = 'Overwritten';

        await set({ key, value: initialValue });
        const retrievedInitial = await get<string>({ key });
        expect(retrievedInitial).toBe(initialValue);

        await set({ key, value: newValue });
        const retrievedNew = await get<string>({ key });
        expect(retrievedNew).toBe(newValue);
    });

    it('should delete an existing value', async () => {
        const key = 'deleteKey';
        const value = 'To be deleted';

        await set({ key, value });
        const retrievedBeforeDelete = await get<string>({ key });
        expect(retrievedBeforeDelete).toBe(value);

        await del({ key });
        const retrievedAfterDelete = await get<string>({ key });
        expect(retrievedAfterDelete).toBeUndefined();
    });

    it('should handle deleting a non-existent key gracefully', async () => {
        const key = 'nonExistentDeleteKey';

        // Ensure it doesn't exist
        const retrievedBeforeDelete = await get<string>({ key });
        expect(retrievedBeforeDelete).toBeUndefined();

        // Attempt to delete
        await expect(del({ key })).resolves.toBeUndefined(); // Should complete without error

        // Verify it still doesn't exist
        const retrievedAfterDelete = await get<string>({ key });
        expect(retrievedAfterDelete).toBeUndefined();
        expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should handle multiple operations sequentially', async () => {
        const key1 = 'multiKey1';
        const value1 = { count: 1 };
        const key2 = 'multiKey2';
        const value2 = 'Second Value';

        await set({ key: key1, value: value1 });
        await set({ key: key2, value: value2 });

        const retrieved1 = await get<typeof value1>({ key: key1 });
        const retrieved2 = await get<string>({ key: key2 });
        expect(retrieved1).toEqual(value1);
        expect(retrieved2).toEqual(value2);

        await del({ key: key1 });
        const retrieved1AfterDel = await get<typeof value1>({ key: key1 });
        const retrieved2AfterDel = await get<string>({ key: key2 });
        expect(retrieved1AfterDel).toBeUndefined();
        expect(retrieved2AfterDel).toEqual(value2); // Should still exist
    });

    // Note: Testing specific IndexedDB error conditions (like disk full, quota exceeded)
    // is difficult with fake-indexeddb. We mainly test the success paths and basic logic.
    // The internal error handling (console.error) is partially tested by checking the spy.
}); 