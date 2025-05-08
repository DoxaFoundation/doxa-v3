/**
 * Tests for the ICRC Ledger API functions
 * 
 * These tests cover the functionality of the ICRC ledger API layer, which 
 * provides a wrapper around the ICRC ledger canister functions.
 * 
 * We mock:
 * - The actor provider function (getIcrcLedgerActor)
 * - Svelte store for authentication (authStore)
 * 
 * Testing focuses on:
 * - Correct parameter transformation
 * - Proper handling of optional parameters
 * - Actor caching mechanism
 * - Error handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getIcrcLedgerActor } from '$lib/actors/actor.icrc.ledger';
import { authStore } from '@stores/auth.store';
import { get } from 'svelte/store';
import * as icrcLedgerApi from './icrc.ledger.api';
import { Principal } from '@dfinity/principal';

// Mock dependencies
vi.mock('$lib/actors/actor.icrc.ledger', () => ({
    getIcrcLedgerActor: vi.fn()
}));

vi.mock('svelte/store', () => ({
    get: vi.fn()
}));

vi.mock('@stores/auth.store', () => ({
    authStore: { subscribe: vi.fn() }
}));

describe('ICRC Ledger API', () => {
    // Common test data
    const mockPrincipal = { toString: () => 'test-principal' };
    const mockCanisterId = 'test-canister-id';

    // Mock actor methods with appropriate return types
    const mockIcrc1BalanceOf = vi.fn();
    const mockIcrc1Transfer = vi.fn();
    const mockIcrc1Metadata = vi.fn();
    const mockIcrc1Fee = vi.fn();
    const mockIcrc1TotalSupply = vi.fn();
    const mockIcrc2TransferFrom = vi.fn();
    const mockIcrc2Approve = vi.fn();
    const mockIcrc2Allowance = vi.fn();
    const mockIcrc21CanisterCallConsentMessage = vi.fn();

    // Mock actor with all required methods
    const mockActor = {
        icrc1_balance_of: mockIcrc1BalanceOf,
        icrc1_transfer: mockIcrc1Transfer,
        icrc1_metadata: mockIcrc1Metadata,
        icrc1_fee: mockIcrc1Fee,
        icrc1_total_supply: mockIcrc1TotalSupply,
        icrc2_transfer_from: mockIcrc2TransferFrom,
        icrc2_approve: mockIcrc2Approve,
        icrc2_allowance: mockIcrc2Allowance,
        icrc21_canister_call_consent_message: mockIcrc21CanisterCallConsentMessage
    };

    beforeEach(() => {
        // Reset all mocks before each test
        vi.clearAllMocks();

        // Setup auth store mock to return a principal
        (get as any).mockReturnValue({ principal: mockPrincipal });

        // Setup actor provider mock to return our mock actor
        (getIcrcLedgerActor as any).mockResolvedValue(mockActor);
    });

    /**
     * Tests for balance function
     * 
     * Validates that:
     * - The balance function correctly calls the ICRC ledger actor
     * - Parameters are transformed correctly
     * - Optional parameters (subaccount) are handled correctly
     */
    describe('balance', () => {
        const expectedBalance = BigInt(1000);

        beforeEach(() => {
            mockIcrc1BalanceOf.mockResolvedValue(expectedBalance);
        });

        it('should call icrc1_balance_of with correct parameters', async () => {
            // Setup test
            const owner = Principal.fromText('rrkah-fqaaa-aaaaa-aaaaq-cai');

            // Execute function
            const result = await icrcLedgerApi.balance({
                canisterId: mockCanisterId,
                owner
            });

            // Verify results
            expect(mockIcrc1BalanceOf).toHaveBeenCalledWith({
                owner,
                subaccount: []
            });
            expect(result).toBe(expectedBalance);
        });

        it('should handle subaccount correctly when provided', async () => {
            // Setup test with subaccount
            const owner = Principal.fromText('rrkah-fqaaa-aaaaa-aaaaq-cai');
            const subaccount = new Uint8Array(32);

            // Execute function
            await icrcLedgerApi.balance({
                canisterId: mockCanisterId,
                owner,
                subaccount
            });

            // Verify subaccount was correctly passed
            expect(mockIcrc1BalanceOf).toHaveBeenCalledWith({
                owner,
                subaccount: [subaccount]
            });
        });
    });

    /**
     * Tests for transfer function
     * 
     * Validates that:
     * - The transfer function correctly calls the ICRC ledger actor
     * - All optional parameters are handled correctly 
     * - Response from the actor is properly returned
     */
    describe('transfer', () => {
        const mockTransferResult = { Ok: BigInt(12345) };

        beforeEach(() => {
            mockIcrc1Transfer.mockResolvedValue(mockTransferResult);
        });

        it('should call icrc1_transfer with required parameters only', async () => {
            // Setup basic transfer with minimal parameters
            const to = { owner: Principal.fromText('ryjl3-tyaaa-aaaaa-aaaba-cai'), subaccount: [] as [] | [Uint8Array] };
            const amount = BigInt(100);

            // Execute function
            const result = await icrcLedgerApi.transfer({
                canisterId: mockCanisterId,
                to,
                amount
            });

            // Verify parameters and optional arrays are empty
            expect(mockIcrc1Transfer).toHaveBeenCalledWith({
                to,
                amount,
                fee: [],
                memo: [],
                from_subaccount: [],
                created_at_time: []
            });
            expect(result).toBe(mockTransferResult);
        });

        it('should handle all optional parameters when provided', async () => {
            // Setup transfer with all optional parameters
            const to = { owner: Principal.fromText('ryjl3-tyaaa-aaaaa-aaaba-cai'), subaccount: [] as [] | [Uint8Array] };
            const amount = BigInt(100);
            const fee = BigInt(10);
            const memo = new Uint8Array([1, 2, 3]);
            const from_subaccount = new Uint8Array(32);
            const created_at_time = BigInt(Date.now()) * BigInt(1000000);

            // Execute function with all optional parameters
            await icrcLedgerApi.transfer({
                canisterId: mockCanisterId,
                to,
                amount,
                fee,
                memo,
                from_subaccount,
                created_at_time
            });

            // Verify all optional parameters are passed correctly in arrays
            expect(mockIcrc1Transfer).toHaveBeenCalledWith({
                to,
                amount,
                fee: [fee],
                memo: [memo],
                from_subaccount: [from_subaccount],
                created_at_time: [created_at_time]
            });
        });

        it('should handle error responses from the canister', async () => {
            // Setup error response
            const errorResponse = { Err: { InsufficientFunds: null } };
            mockIcrc1Transfer.mockResolvedValue(errorResponse);

            // Execute function
            const result = await icrcLedgerApi.transfer({
                canisterId: mockCanisterId,
                to: { owner: Principal.fromText('ryjl3-tyaaa-aaaaa-aaaba-cai'), subaccount: [] as [] | [Uint8Array] },
                amount: BigInt(1000)
            });

            // Verify error response is correctly passed through
            expect(result).toBe(errorResponse);
        });
    });

    /**
     * Tests for actor caching mechanism
     * 
     * Validates that:
     * - Actors are cached for the same principal and canisterId
     * - New actors are created for different principals or canisterIds
     * - The cache key is correctly formatted
     */
    describe('caching', () => {
        it('should use cached actor for same principal and canisterId', async () => {
            // First call creates and caches the actor
            await icrcLedgerApi.balance({
                canisterId: mockCanisterId,
                owner: Principal.fromText('ryjl3-tyaaa-aaaaa-aaaba-cai')
            });

            // Reset balance function for verification
            mockIcrc1BalanceOf.mockClear();

            // Second call should use the cached actor
            await icrcLedgerApi.balance({
                canisterId: mockCanisterId,
                owner: Principal.fromText('rrkah-fqaaa-aaaaa-aaaaq-cai')
            });

            // Should be called only once because the actor is reused
            expect(getIcrcLedgerActor).toHaveBeenCalledTimes(1);
        });

        it('should create new actor for different canisterId', async () => {
            // First call with canisterId1
            await icrcLedgerApi.balance({
                canisterId: 'canisterId1',
                owner: Principal.fromText('ryjl3-tyaaa-aaaaa-aaaba-cai')
            });

            // Second call with different canisterId
            await icrcLedgerApi.balance({
                canisterId: 'canisterId2',
                owner: Principal.fromText('ryjl3-tyaaa-aaaaa-aaaba-cai')
            });

            // Should be called twice because different canister IDs create different cache keys
            expect(getIcrcLedgerActor).toHaveBeenCalledTimes(2);
            expect(getIcrcLedgerActor).toHaveBeenNthCalledWith(1, 'canisterId1');
            expect(getIcrcLedgerActor).toHaveBeenNthCalledWith(2, 'canisterId2');
        });

        it('should create new actor when auth principal changes', async () => {
            // First call with principal1
            (get as any).mockReturnValue({ principal: { toString: () => 'principal1' } });

            await icrcLedgerApi.balance({
                canisterId: mockCanisterId,
                owner: Principal.fromText('ryjl3-tyaaa-aaaaa-aaaba-cai')
            });

            // Change the principal
            (get as any).mockReturnValue({ principal: { toString: () => 'principal2' } });

            // Second call with different principal
            await icrcLedgerApi.balance({
                canisterId: mockCanisterId,
                owner: Principal.fromText('ryjl3-tyaaa-aaaaa-aaaba-cai')
            });

            // Should be called twice because different principals create different cache keys
            expect(getIcrcLedgerActor).toHaveBeenCalledTimes(2);
        });
    });

    /**
     * Tests for metadata function
     * 
     * Validates that:
     * - The metadata function correctly calls the ICRC ledger actor
     * - Response is properly returned from the actor
     */
    describe('metadata', () => {
        const mockMetadataResponse = [
            ['icrc1:symbol', { Text: 'ICRC' }],
            ['icrc1:name', { Text: 'ICRC Token' }],
            ['icrc1:decimals', { Nat: BigInt(8) }]
        ];

        beforeEach(() => {
            mockIcrc1Metadata.mockResolvedValue(mockMetadataResponse);
        });

        it('should call icrc1_metadata correctly and return response', async () => {
            // Execute function
            const result = await icrcLedgerApi.metadata({
                canisterId: mockCanisterId
            });

            // Verify actor method was called
            expect(mockIcrc1Metadata).toHaveBeenCalled();
            expect(result).toBe(mockMetadataResponse);
        });
    });

    /**
     * Tests for transactionFee function
     * 
     * Validates that:
     * - The transactionFee function correctly calls the ICRC ledger actor
     * - Fee is properly returned from the actor
     */
    describe('transactionFee', () => {
        const mockFee = BigInt(10000);

        beforeEach(() => {
            mockIcrc1Fee.mockResolvedValue(mockFee);
        });

        it('should call icrc1_fee correctly and return fee', async () => {
            // Execute function
            const result = await icrcLedgerApi.transactionFee({
                canisterId: mockCanisterId
            });

            // Verify actor method was called
            expect(mockIcrc1Fee).toHaveBeenCalled();
            expect(result).toBe(mockFee);
        });
    });
}); 