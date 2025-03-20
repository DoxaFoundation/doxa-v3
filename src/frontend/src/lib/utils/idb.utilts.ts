import { browser } from '$app/environment';

/**
 * A helper function to open (and upgrade if necessary) the IndexedDB.
 */
let dbPromise: Promise<IDBDatabase> | null = null;
const dbName = 'doxa-db';
const storeName = 'keyval';
const version = 1;

function openDB(): Promise<IDBDatabase> {
	if (!browser) {
		return Promise.reject(new Error('IndexedDB is only available in the browser environment.'));
	}

	if (dbPromise) return dbPromise;

	dbPromise = new Promise((resolve, reject) => {
		const request = indexedDB.open(dbName, version);

		// Create the object store if it does not exist
		request.onupgradeneeded = () => {
			const db = request.result;
			if (!db.objectStoreNames.contains(storeName)) {
				db.createObjectStore(storeName);
			}
		};

		request.onsuccess = () => {
			resolve(request.result);
		};

		request.onerror = () => {
			console.error('Error opening IndexedDB:', request.error);
			reject(request.error);
		};
	});

	return dbPromise;
}

/**
 * Stores a value in IndexedDB.
 *
 * @param key   The key under which the value is stored.
 * @param value The value to store. It will be JSON-stringified.
 */
export const set = async <T>({ key, value }: { key: string; value: T }): Promise<void> => {
	try {
		const db = await openDB();
		const transaction = db.transaction(storeName, 'readwrite');
		const store = transaction.objectStore(storeName);

		// Store the JSON-stringified value under the key
		store.put(value, key);

		// Wait for the transaction to complete
		await new Promise<void>((resolve, reject) => {
			transaction.oncomplete = () => resolve();
			transaction.onerror = () => reject(transaction.error);
			transaction.onabort = () => reject(transaction.error);
		});
	} catch (err: unknown) {
		console.error(err);
	}
};

/**
 * Retrieves a value from IndexedDB.
 *
 * @param key The key to retrieve.
 * @returns   The parsed value, or undefined if not found.
 */
export const get = async <T>({ key }: { key: string }): Promise<T | undefined> => {
	try {
		const db = await openDB();
		const transaction = db.transaction(storeName, 'readonly');
		const store = transaction.objectStore(storeName);
		const request = store.get(key);

		return await new Promise<T | undefined>((resolve, reject) => {
			request.onsuccess = () => {
				const result = request.result;
				// Check for a non-null/undefined result before parsing
				if (result !== undefined && result !== null) {
					resolve(result);
				} else {
					resolve(undefined);
				}
			};
			request.onerror = () => {
				reject(request.error);
			};
		});
	} catch (err: unknown) {
		console.error(err);
		return undefined;
	}
};

/**
 * Deletes a value from IndexedDB.
 *
 * @param key The key of the value to delete.
 */
export const del = async ({ key }: { key: string }): Promise<void> => {
	try {
		const db = await openDB();
		const transaction = db.transaction(storeName, 'readwrite');
		const store = transaction.objectStore(storeName);
		store.delete(key);

		// Wait for the transaction to complete
		await new Promise<void>((resolve, reject) => {
			transaction.oncomplete = () => resolve();
			transaction.onerror = () => reject(transaction.error);
			transaction.onabort = () => reject(transaction.error);
		});
	} catch (err: unknown) {
		console.error(err);
	}
};
