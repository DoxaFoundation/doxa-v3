/**
 * @fileoverview
 * This file contains tests for the ledger service functions defined in `ledger.service.ts`.
 * 
 * Purpose:
 * - Tests the functionality of ledger-related operations like token transfers
 * - Validates the behavior of handleTransferResponse for successful and failed transfers
 * - Verifies that transferToken correctly handles different account types (ICRC and ICP)
 * - Ensures proper error handling during transfer operations
 * - Checks that the service displays appropriate toast notifications
 * - Confirms balance updates are triggered after successful transfers
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleTransferResponse, transferToken } from './ledger.service';
import { updateBalance } from '@states/ledger-balance.svelte';
import { LedgerMetadata } from '@states/ledger-metadata.svelte';
import { toBigIntDecimals } from '@utils/decimals.utils';
import { toast } from 'svelte-sonner';
import { transferICP } from '$lib/api/icp.ledger.api';
import { transfer } from '$lib/api/icrc.ledger.api';
import type { ResultSuccess } from '$lib/types/utils';

// Mock dependencies - creating fake versions of imported modules for testing
vi.mock('@states/ledger-balance.svelte', () => ({
    // Mock updateBalance function to return a resolved promise with undefined
    updateBalance: vi.fn().mockResolvedValue(undefined)
}));

vi.mock('@utils/decimals.utils', () => ({
    // Mock toBigIntDecimals to convert amount to BigInt with 8 decimal places
    // For example: 10 becomes 1000000000n (10 * 10^8)
    toBigIntDecimals: vi.fn().mockImplementation((amount) => BigInt(amount * 100000000))
}));

vi.mock('svelte-sonner', () => ({
    // Mock toast notifications with loading, success and error functions
    // Each returns 'toast-id' which is used to update the same toast later
    toast: {
        loading: vi.fn().mockReturnValue('toast-id'),
        success: vi.fn().mockReturnValue('toast-id'),
        error: vi.fn().mockReturnValue('toast-id')
    }
}));

vi.mock('$lib/api/icp.ledger.api', () => ({
    // Mock transferICP function for ICP token transfers
    transferICP: vi.fn()
}));

vi.mock('$lib/api/icrc.ledger.api', () => ({
    // Mock transfer function for ICRC token transfers
    transfer: vi.fn()
}));

describe('ledger.service', () => {
    // Setup before each test
    beforeEach(() => {
        // Reset all mocks before each test to avoid interference
        vi.clearAllMocks();
        // Prevent console errors from showing in test output
        vi.spyOn(console, 'error').mockImplementation(() => { });

        // Manually set properties on the imported LedgerMetadata object
        // Clear previous values first in case of persistence across tests
        for (const key in LedgerMetadata) {
            delete LedgerMetadata[key];
        }
        LedgerMetadata['ledger-123'] = {
            fee: 10000,
            symbol: 'USDX',
            name: 'USDX Ledger',
            decimals: 8,
            logo: 'usdx.png'
        };
        LedgerMetadata['icp-ledger'] = {
            fee: 10000,
            symbol: 'ICP',
            name: 'ICP Ledger',
            decimals: 8,
            logo: 'icp.png'
        };
    });

    describe('handleTransferResponse', () => {
        // Test data for all tests in this group
        const amount = 10;
        const symbol = 'USDX';
        const ledgerId = 'ledger-123';

        it('should handle successful transfer response', async () => {
            // Create a successful response object with a block index
            const response = { Ok: 42n };

            // Call the function we're testing with the success response
            const result = await handleTransferResponse(response, amount, symbol, ledgerId);

            // Verify success toast was shown with correct message
            expect(toast.success).toHaveBeenCalledWith(`${amount} ${symbol} sent successfully.`, { id: undefined });
            // Verify balance was updated for the correct ledger
            expect(updateBalance).toHaveBeenCalledWith(ledgerId);
            // Verify function returned success result
            expect(result).toEqual({ success: true });
        });

        it('should handle failed transfer response', async () => {
            // Create an error response object (fixing the type to match TransferError)
            const response = { Err: { InsufficientFunds: { balance: BigInt(5) } } };

            // Call the function we're testing with the error response
            const result = await handleTransferResponse(response, amount, symbol, ledgerId);

            // Verify error was logged to console
            expect(console.error).toHaveBeenCalledWith(`Failed to send ${amount} ${symbol}.`, response);
            // Verify error toast was shown with correct message
            expect(toast.error).toHaveBeenCalledWith(`Failed to send ${amount} ${symbol}.`, { id: undefined });
            // Verify function returned error result
            expect(result).toEqual({ success: false, err: response });
        });
    });

    describe('transferToken', () => {
        // Test data for all tests in this group
        const amount = 10;
        // Create a mock ICRC account with owner and subaccount
        const icrcAccount = {
            owner: {
                toUint8Array: () => new Uint8Array([0xaa, 0xbb, 0xcc]),
                _arr: new Uint8Array(),
                _isPrincipal: true,
                isAnonymous: () => false,
                toHex: () => "",
                toText: () => "",
                toString: () => "",
                toJSON: () => "",
                compareTo: () => 0
            },
            subaccount: new Uint8Array([0x11, 0x22, 0x33])
        };
        // Create a mock ICP account with toUint8Array method
        const icpAccount = {
            toUint8Array: vi.fn().mockReturnValue(new Uint8Array(32)),
            bytes: new Uint8Array(),
            toHex: () => "",
            toNumbers: () => [],
            toAccountIdentifierHash: () => ""
        };

        it('should transfer ICRC tokens successfully', async () => {
            const ledgerId = 'ledger-123';
            // Create a successful response object
            const successResponse = { Ok: 42n };

            // Setup mock to return success response
            vi.mocked(transfer).mockResolvedValue(successResponse);

            // Call the function we're testing
            const result = await transferToken(amount, icrcAccount as any, ledgerId);

            // Verify loading toast was shown
            expect(toast.loading).toHaveBeenCalledWith(`Sending ${amount} USDX...`);
            // Verify transfer was called with correct parameters
            expect(transfer).toHaveBeenCalledWith({
                canisterId: ledgerId,
                to: {
                    owner: icrcAccount.owner,
                    subaccount: [icrcAccount.subaccount]
                },
                amount: toBigIntDecimals(amount, ledgerId)
            });
            // Verify success toast was shown
            expect(toast.success).toHaveBeenCalledWith(`${amount} USDX sent successfully.`, { id: 'toast-id' });
            // Verify balance was updated
            expect(updateBalance).toHaveBeenCalledWith(ledgerId);
            // Verify function returned success result
            expect(result).toEqual({ success: true });
        });

        it('should transfer ICRC tokens with no subaccount', async () => {
            const ledgerId = 'ledger-123';
            const successResponse = { Ok: 42n };
            // Create account with only owner, no subaccount
            const accountWithNoSubaccount = {
                owner: {
                    toUint8Array: () => new Uint8Array([0xaa, 0xbb, 0xcc]),
                    _arr: new Uint8Array(),
                    _isPrincipal: true,
                    isAnonymous: () => false,
                    toHex: () => "",
                    toText: () => "",
                    toString: () => "",
                    toJSON: () => "",
                    compareTo: () => 0
                }
            };

            // Setup mock to return success response
            vi.mocked(transfer).mockResolvedValue(successResponse);

            // Call the function we're testing
            await transferToken(amount, accountWithNoSubaccount as any, ledgerId);

            // Verify transfer was called with empty subaccount array
            expect(transfer).toHaveBeenCalledWith({
                canisterId: ledgerId,
                to: {
                    owner: accountWithNoSubaccount.owner,
                    subaccount: []
                },
                amount: toBigIntDecimals(amount, ledgerId)
            });
        });

        it('should transfer ICP tokens successfully', async () => {
            const ledgerId = 'icp-ledger';
            const successResponse = { Ok: 42n };

            // Setup mock to return success response
            vi.mocked(transferICP).mockResolvedValue(successResponse);

            // Call the function we're testing
            const result = await transferToken(amount, icpAccount as any, ledgerId);

            // Verify loading toast was shown
            expect(toast.loading).toHaveBeenCalledWith(`Sending ${amount} ICP...`);
            // Verify transferICP was called with correct parameters
            expect(transferICP).toHaveBeenCalledWith({
                to: icpAccount.toUint8Array(),
                memo: BigInt(0),
                created_at_time: [],
                fee: { e8s: BigInt(10000) },
                from_subaccount: [],
                amount: { e8s: toBigIntDecimals(amount, ledgerId) }
            });
            // Verify function returned success result
            expect(result).toEqual({ success: true });
        });

        it('should handle failed ICRC token transfer', async () => {
            const ledgerId = 'ledger-123';
            // Create an error response object (fixing the type)
            const errorResponse = { Err: { InsufficientFunds: { balance: BigInt(5) } } };

            // Setup mock to return error response
            vi.mocked(transfer).mockResolvedValue(errorResponse);

            // Call the function we're testing
            const result = await transferToken(amount, icrcAccount as any, ledgerId);

            // Verify error toast was shown
            expect(toast.error).toHaveBeenCalledWith(`Failed to send ${amount} USDX.`, { id: 'toast-id' });
            // Verify function returned error result
            expect(result).toEqual({ success: false, err: errorResponse });
        });

        it('should handle exceptions during transfer', async () => {
            const ledgerId = 'ledger-123';
            // Create a test error
            const error = new Error('Network error');

            // Setup mock to throw error
            vi.mocked(transfer).mockRejectedValue(error);

            // Call the function we're testing
            const result = await transferToken(amount, icrcAccount as any, ledgerId);

            // Verify error was logged to console
            expect(console.error).toHaveBeenCalledWith(error);
            // Verify error toast was shown
            expect(toast.error).toHaveBeenCalledWith('Something went wrong while transferring token.', { id: 'toast-id' });
            // Verify function returned error result
            expect(result).toEqual({ success: false, err: error });
        });
    });
}); 