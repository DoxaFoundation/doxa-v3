/**
 * @fileoverview
 * This file contains tests for the ICRC service functions defined in `icrc.service.ts`.
 * ICRC is the Internet Computer Request for Comments token standard (similar to ERC-20 in Ethereum).
 * These tests verify the token transfer functionality.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { transfer } from './icrc.service';
import { IcrcTransferError, toTransferArg } from '@dfinity/ledger-icrc';
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
    const mockTransferParams = {
        token: mockToken,
        to: 'to-account',
        amount: 100n,
        memo: new Uint8Array(),
        fee: 10n
    };

    // Mock the icrc1_transfer canister method
    const mockIcrc1Transfer = vi.fn();

    beforeEach(() => {
        // Reset all mocks before each test to avoid interference
        vi.clearAllMocks();

        // Setup the auth store to return a mock actor with the icrc1_transfer method
        // Fix: Use vi.mocked(get) instead of get.mockReturnValue
        vi.mocked(get).mockReturnValue({
            [mockToken]: {
                icrc1_transfer: mockIcrc1Transfer
            }
        });
    });

    describe('transfer', () => {
        // Test case: Successful token transfer
        it('should transfer tokens successfully', async () => {
            // Setup: Simulate a successful transfer response with a block index
            const blockIndex = 42n;
            mockIcrc1Transfer.mockResolvedValue({ Ok: blockIndex });

            // Execute: Call the transfer function with mock parameters
            // This test verifies that when we call transfer with valid parameters,
            // it correctly processes the request and returns the block index
            const result = await transfer(mockTransferParams as any); // Fix: Use type assertion

            // Verify: Check all expected function calls and the return value
            expect(get).toHaveBeenCalledWith(authStore);
            expect(toTransferArg).toHaveBeenCalledWith({
                to: mockTransferParams.to,
                amount: mockTransferParams.amount,
                memo: mockTransferParams.memo,
                fee: mockTransferParams.fee
            });
            expect(mockIcrc1Transfer).toHaveBeenCalled();
            expect(result).toBe(blockIndex);
        });

        // Test case: Failed transfer with an error from the canister
        it('should throw IcrcTransferError when transfer fails', async () => {
            // Setup: Simulate a transfer failure with InsufficientFunds error
            const errorType = { InsufficientFunds: null };
            mockIcrc1Transfer.mockResolvedValue({ Err: errorType });

            // Execute and Verify: Ensure the transfer function throws an error
            // This test checks that when the canister returns an error,
            // our service properly converts it to an IcrcTransferError
            await expect(transfer(mockTransferParams as any)).rejects.toThrow(); // Fix: Use type assertion

            // Verify all expected function calls
            expect(get).toHaveBeenCalledWith(authStore);
            expect(toTransferArg).toHaveBeenCalled();
            expect(mockIcrc1Transfer).toHaveBeenCalled();
            expect(IcrcTransferError).toHaveBeenCalledWith({
                errorType: errorType,
                msg: 'Failed to transfer'
            });
        });

        // Test case: Network or execution errors handling
        it('should handle network errors', async () => {
            // Setup: Simulate a network error during transfer
            const error = new Error('Network error');
            mockIcrc1Transfer.mockRejectedValue(error);

            // Execute and Verify: Ensure the original error is propagated
            // This test verifies that when a network error occurs,
            // our service passes through the original error without modification
            await expect(transfer(mockTransferParams as any)).rejects.toThrow(error); // Fix: Use type assertion

            // Verify all expected function calls
            expect(get).toHaveBeenCalledWith(authStore);
            expect(toTransferArg).toHaveBeenCalled();
            expect(mockIcrc1Transfer).toHaveBeenCalled();
        });
    });
}); 