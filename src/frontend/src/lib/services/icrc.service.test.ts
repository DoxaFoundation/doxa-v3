/**
 * @fileoverview
 * This file contains tests for the ICRC service functions defined in `icrc.service.ts`.
 * ICRC is the Internet Computer Request for Comments token standard (similar to ERC-20 in Ethereum).
 * These tests verify the token transfer functionality.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { transfer } from './icrc.service';
import { IcrcTransferError, toTransferArg } from '@dfinity/ledger-icrc';
// Import TransferArg from the correct declarations file
import type { TransferArg } from '@declarations/icp_ledger/icp_ledger.did'; // Adjusted path
import { Principal } from '@dfinity/principal'; // Import Principal
import { authStore } from '@stores/auth.store';
import { get } from 'svelte/store';

// Mock dependencies
// Mock ledger-icrc module functions to isolate the service being tested
vi.mock('@dfinity/ledger-icrc', () => ({
    // Mock toTransferArg to return the input directly for easier testing
    toTransferArg: vi.fn(input => input),
    // Mock IcrcTransferError constructor for error handling tests

    IcrcTransferError: vi.fn(function (this: { errorType: any; msg: string }, params: { errorType: any; msg: string }) {
        this.errorType = params.errorType;
        this.msg = params.msg;
    })
}));

// Mock auth store to control the canister actor instances during tests
vi.mock('@stores/auth.store', () => ({
    authStore: {
        subscribe: vi.fn()
    }
}));

// Mock svelte store's get function to provide controlled access to the auth store
// Also mock 'writable' as it might be used internally by dependencies like svelte-sonner
vi.mock('svelte/store', async () => {
    // Basic writable store mock implementation with types
    const writableMock = <T>(initialValue: T) => {
        let value: T = initialValue;
        const subscribers = new Set<(value: T) => void>();
        return {
            subscribe: (run: (value: T) => void): (() => void) => {
                subscribers.add(run);
                run(value);
                // Return unsubscribe function
                return () => subscribers.delete(run);
            },
            set: (newValue: T): void => {
                value = newValue;
                subscribers.forEach((run) => run(value));
            },
            update: (updater: (value: T) => T): void => {
                value = updater(value);
                subscribers.forEach((run) => run(value));
            },
        };
    }

    return {
        get: vi.fn(),
        writable: vi.fn(writableMock), // Use the typed mock function
    };
});

describe('icrc.service', () => {
    // Setup test data
    const mockToken = 'USDx' as const; // Fix: Use 'USDx' instead of 'USDX' and make it a literal type
    // Define default block index at the describe scope
    const defaultBlockIndex = 42n; // Example block index
    // Keep mock params simple as needed by the service function call
    const mockTransferParams = {
        token: mockToken,
        to: { owner: Principal.fromText('aaaaa-aa'), subaccount: [] }, // Use [] for absent subaccount
        amount: 100n,
        memo: new Uint8Array(), // Service likely expects Uint8Array
        fee: 10n // Service likely expects bigint
    };

    // Define the expected type for the mocked authStore value within the describe scope
    // Revert to simpler function signature type
    type MockedIcrcTransferFn = (args: TransferArg) => Promise<{ Ok: bigint } | { Err: any }>;
    type MockAuthStoreValue = {
        [key in typeof mockToken]: {
            icrc1_transfer: MockedIcrcTransferFn;
        };
    };

    beforeEach(() => {
        vi.clearAllMocks();

        // Setup the auth store to return a mock actor with a default successful icrc1_transfer implementation
        vi.mocked(get).mockReturnValue({
            [mockToken]: {
                // Use vi.fn() and ensure implementation signature matches type
                icrc1_transfer: vi.fn().mockImplementation(async (args: TransferArg): Promise<{ Ok: bigint } | { Err: any }> => {
                    console.log('Mock icrc1_transfer called with:', args);
                    // Default success response matching backend structure
                    return { Ok: defaultBlockIndex };
                })
            }
        } as MockAuthStoreValue); // Cast the returned object to ensure type alignment
    });

    describe('transfer', () => {
        // Test case: Successful token transfer
        it('should transfer tokens successfully', async () => {
            // const blockIndex = 42n; 
            // mockIcrc1Transfer.mockResolvedValue({ Ok: blockIndex }); // No longer needed, default mock returns success

            // Execute: Call the transfer function with parameters matching its signature
            const result = await transfer({
                token: mockTransferParams.token,
                to: mockTransferParams.to as any, // Use type assertion to bypass linter error
                amount: mockTransferParams.amount,
                memo: mockTransferParams.memo,
                fee: mockTransferParams.fee
            });

            // Verify: Check all expected function calls and the return value
            expect(get).toHaveBeenCalledWith(authStore);
            // Verify toTransferArg was called with expected structure (use objectContaining for 'to')
            expect(toTransferArg).toHaveBeenCalledWith(expect.objectContaining({
                to: mockTransferParams.to, // Check the overall 'to' object structure
                amount: mockTransferParams.amount,
                memo: mockTransferParams.memo,
                fee: mockTransferParams.fee
            }));
            // Add type assertion to resolve 'unknown' type error
            expect((vi.mocked(get)(authStore) as MockAuthStoreValue)[mockToken].icrc1_transfer).toHaveBeenCalled();
            // Check if the result matches the default block index
            expect(result).toBe(defaultBlockIndex);
        });

        // Test case: Failed transfer with an error from the canister
        it('should throw IcrcTransferError when transfer fails', async () => {
            // Setup: Simulate a transfer failure with InsufficientFunds error
            const errorType = { InsufficientFunds: { balance: 0n } }; // Add balance field
            // Override default implementation for this test, using 'as any' to bypass type error
            const mockActor = vi.mocked(get)(authStore) as MockAuthStoreValue;
            (mockActor[mockToken].icrc1_transfer as any).mockResolvedValue({ Err: errorType });


            // Execute and Verify: Ensure the transfer function throws an error
            await expect(transfer({
                token: mockTransferParams.token,
                to: mockTransferParams.to as any, // Use type assertion to bypass linter error
                amount: mockTransferParams.amount,
                memo: mockTransferParams.memo,
                fee: mockTransferParams.fee
            })).rejects.toThrow(IcrcTransferError);

            // Verify all expected function calls
            expect(get).toHaveBeenCalledWith(authStore);
            expect(toTransferArg).toHaveBeenCalled();
            // Add type assertion
            expect((vi.mocked(get)(authStore) as MockAuthStoreValue)[mockToken].icrc1_transfer).toHaveBeenCalled();
            expect(IcrcTransferError).toHaveBeenCalledWith({
                errorType: errorType,
                msg: 'Failed to transfer'
            });
        });

        // Test case: Network or execution errors handling
        it('should handle network errors', async () => {
            // Setup: Simulate a network error during transfer
            const error = new Error('Network error');
            // Override default implementation for this test, using 'as any' to bypass type error
            const mockActor = vi.mocked(get)(authStore) as MockAuthStoreValue;
            (mockActor[mockToken].icrc1_transfer as any).mockRejectedValue(error);

            // Execute and Verify: Ensure the original error is propagated
            await expect(transfer({
                token: mockTransferParams.token,
                to: mockTransferParams.to as any, // Use type assertion to bypass linter error
                amount: mockTransferParams.amount,
                memo: mockTransferParams.memo,
                fee: mockTransferParams.fee
            })).rejects.toThrow(error);
        });
    });
}); 