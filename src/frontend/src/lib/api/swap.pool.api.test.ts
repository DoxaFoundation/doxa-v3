/**
 * Tests for the Swap Pool API functions
 * 
 * These tests verify the correct functionality of the Swap Pool API layer,
 * which provides a wrapper around the Swap Pool canister functions.
 * 
 * We mock:
 * - The actor provider function (getSwapPoolActor)
 * - Svelte store for authentication (authStore)
 * 
 * Testing focuses on:
 * - Parameter processing
 * - Actor caching mechanism
 * - Return value handling
 * - Error scenarios
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSwapPoolActor } from '$lib/actors/actors.swap';
import { authStore } from '@stores/auth.store';
import { get } from 'svelte/store';
import * as swapPoolApi from './swap.pool.api';
import { Principal } from '@dfinity/principal';

// Define mock token principals for use in tests
const MOCK_TOKEN0_PRINCIPAL = Principal.fromText("ryjl3-tyaaa-aaaaa-aaaba-cai"); // Example, replace with actual if available
const MOCK_TOKEN1_PRINCIPAL = Principal.fromText("rrkah-fqaaa-aaaaa-aaaaq-cai"); // Example, replace with actual if available

// Mock dependencies
vi.mock('$lib/actors/actors.swap', () => ({
    getSwapPoolActor: vi.fn()
}));

vi.mock('svelte/store', () => ({
    get: vi.fn()
}));

vi.mock('@stores/auth.store', () => ({
    authStore: { subscribe: vi.fn() }
}));

describe('Swap Pool API', () => {
    // Common test data
    const mockPrincipal = { toString: () => 'test-principal' };
    const mockCanisterId = 'test-canister-id';

    // Mock actor methods with appropriate return types
    const mockDeposit = vi.fn();
    const mockDepositFrom = vi.fn();
    const mockGetTokenMeta = vi.fn();
    const mockGetUserUnusedBalance = vi.fn();
    const mockMetadata = vi.fn();
    const mockQuote = vi.fn();
    const mockSwap = vi.fn();
    const mockWithdraw = vi.fn();

    // Mock actor with all required methods
    const mockActor = {
        deposit: mockDeposit,
        depositFrom: mockDepositFrom,
        getTokenMeta: mockGetTokenMeta,
        getUserUnusedBalance: mockGetUserUnusedBalance,
        metadata: mockMetadata,
        quote: mockQuote,
        swap: mockSwap,
        withdraw: mockWithdraw
    };

    beforeEach(() => {
        // Reset all mocks before each test
        vi.clearAllMocks();

        // Setup auth store mock to return a principal
        (get as any).mockReturnValue({ principal: mockPrincipal });

        // Setup actor provider mock to return our mock actor
        (getSwapPoolActor as any).mockResolvedValue(mockActor);
    });

    /**
     * Tests for deposit function
     * 
     * Validates that:
     * - The deposit function correctly calls the Swap Pool actor
     * - Parameters are correctly passed through
     * - Response is properly returned
     */
    describe('deposit', () => {
        const mockDepositResponse = { ok: BigInt(12345) };

        beforeEach(() => {
            mockDeposit.mockResolvedValue(mockDepositResponse);
        });

        it('should call deposit with correct parameters', async () => {
            // Setup test data according to DepositArgs structure
            const depositArgs = {
                token: MOCK_TOKEN0_PRINCIPAL.toText(), // token as string
                amount: BigInt(100),
                fee: BigInt(10000) // fee as bigint
            };

            // Execute function
            const result = await swapPoolApi.deposit({
                canisterId: mockCanisterId,
                ...depositArgs
            });

            // Verify actor method was called with correct args
            expect(mockDeposit).toHaveBeenCalledWith(depositArgs);
            expect(result).toBe(mockDepositResponse);
        });

        it('should handle error response from the canister', async () => {
            // Setup error response
            const errorResponse = { err: { InsufficientBalance: null } };
            mockDeposit.mockResolvedValue(errorResponse);

            // Execute function
            const result = await swapPoolApi.deposit({
                canisterId: mockCanisterId,
                token: MOCK_TOKEN0_PRINCIPAL.toText(), // token as string
                amount: BigInt(1000),
                fee: BigInt(10000) // fee as bigint
            });

            // Verify error is properly returned
            expect(result).toBe(errorResponse);
        });
    });

    /**
     * Tests for depositFrom function
     * 
     * Validates that:
     * - The depositFrom function correctly calls the Swap Pool actor
     * - Parameters are correctly passed through
     */
    describe('depositFrom', () => {
        const mockDepositFromResponse = { ok: BigInt(12345) };

        beforeEach(() => {
            mockDepositFrom.mockResolvedValue(mockDepositFromResponse);
        });

        it('should call depositFrom with correct parameters', async () => {
            // Setup test data
            const depositFromArgs = {
                from: Principal.fromText('ryjl3-tyaaa-aaaaa-aaaba-cai'), // 'from' is specific to depositFrom
                token: MOCK_TOKEN0_PRINCIPAL.toText(), // token as string
                amount: BigInt(100),
                fee: BigInt(10000) // fee as bigint
            };

            // Execute function
            const result = await swapPoolApi.depositFrom({
                canisterId: mockCanisterId,
                ...depositFromArgs
            });

            // Verify actor method was called with correct args
            expect(mockDepositFrom).toHaveBeenCalledWith(depositFromArgs);
            expect(result).toBe(mockDepositFromResponse);
        });
    });

    /**
     * Tests for getTokenMeta function
     * 
     * Validates that:
     * - The getTokenMeta function correctly calls the Swap Pool actor
     * - Response is properly returned with token metadata
     */
    describe('getTokenMeta', () => {
        const mockTokenMetaResponse = {
            token0: [
                ['icrc1:symbol', { Text: 'TKN0' }],
                ['icrc1:name', { Text: 'Token 0' }],
                ['icrc1:decimals', { Nat: BigInt(8) }]
            ],
            token1: [
                ['icrc1:symbol', { Text: 'TKN1' }],
                ['icrc1:name', { Text: 'Token 1' }],
                ['icrc1:decimals', { Nat: BigInt(6) }]
            ],
            token0Fee: [BigInt(10000)],
            token1Fee: [BigInt(5000)]
        };

        beforeEach(() => {
            mockGetTokenMeta.mockResolvedValue(mockTokenMetaResponse);
        });

        it('should call getTokenMeta and return token metadata', async () => {
            // Execute function
            const result = await swapPoolApi.getTokenMeta({
                canisterId: mockCanisterId
            });

            // Verify actor method was called and returned correct data
            expect(mockGetTokenMeta).toHaveBeenCalled();
            expect(result).toBe(mockTokenMetaResponse);
        });
    });

    /**
     * Tests for getUserUnusedBalance function
     * 
     * Validates that:
     * - The getUserUnusedBalance function correctly calls the Swap Pool actor
     * - Principal parameter is properly passed
     * - Response is properly returned
     */
    describe('getUserUnusedBalance', () => {
        const mockBalanceResponse = {
            ok: {
                balance0: BigInt(100),
                balance1: BigInt(200)
            }
        };

        beforeEach(() => {
            mockGetUserUnusedBalance.mockResolvedValue(mockBalanceResponse);
        });

        it('should call getUserUnusedBalance with correct principal', async () => {
            // Setup test data
            const principal = Principal.fromText('ryjl3-tyaaa-aaaaa-aaaba-cai');

            // Execute function
            const result = await swapPoolApi.getUserUnusedBalance({
                canisterId: mockCanisterId,
                principal
            });

            // Verify actor method was called with correct principal
            expect(mockGetUserUnusedBalance).toHaveBeenCalledWith(principal);
            expect(result).toBe(mockBalanceResponse);
        });
    });

    /**
     * Tests for metadata function
     * 
     * Validates that:
     * - The metadata function correctly calls the Swap Pool actor
     * - Response with pool metadata is properly returned
     */
    describe('metadata', () => {
        const mockMetadataResponse = {
            ok: {
                fee: BigInt(30), // 0.3%
                token0: Principal.fromText('ryjl3-tyaaa-aaaaa-aaaba-cai'),
                token1: Principal.fromText('rrkah-fqaaa-aaaaa-aaaaq-cai'),
                decimals0: BigInt(8),
                decimals1: BigInt(6)
            }
        };

        beforeEach(() => {
            mockMetadata.mockResolvedValue(mockMetadataResponse);
        });

        it('should call metadata and return pool metadata', async () => {
            // Execute function
            const result = await swapPoolApi.metadata({
                canisterId: mockCanisterId
            });

            // Verify actor method was called and returned correct data
            expect(mockMetadata).toHaveBeenCalled();
            expect(result).toBe(mockMetadataResponse);
        });
    });

    /**
     * Tests for quote function
     * 
     * Validates that:
     * - The quote function correctly calls the Swap Pool actor
     * - Swap parameters are correctly passed through
     * - Response with quote is properly returned
     */
    describe('quote', () => {
        const mockQuoteResponse = { ok: BigInt(987654) };

        beforeEach(() => {
            mockQuote.mockResolvedValue(mockQuoteResponse);
        });

        it('should call quote with correct parameters', async () => {
            // Setup test data
            const swapArgs = {
                amountIn: BigInt(1000).toString(), // amountIn should be string
                zeroForOne: true,
                amountOutMinimum: "0" // amountOutMinimum is required and should be string
            };

            // Execute function
            const result = await swapPoolApi.quote({
                canisterId: mockCanisterId,
                ...swapArgs
            });

            // Verify actor method was called with correct args
            expect(mockQuote).toHaveBeenCalledWith(swapArgs);
            expect(result).toBe(mockQuoteResponse);
        });
    });

    /**
     * Tests for swap function
     * 
     * Validates that:
     * - The swap function correctly calls the Swap Pool actor
     * - Swap parameters are correctly passed through
     * - Response with swap result is properly returned
     */
    describe('swap', () => {
        const mockSwapResponse = { ok: BigInt(987654) };

        beforeEach(() => {
            mockSwap.mockResolvedValue(mockSwapResponse);
        });

        it('should call swap with correct parameters', async () => {
            // Setup test data
            const swapArgs = {
                amountIn: BigInt(1000).toString(),          // amountIn as string
                amountOutMinimum: BigInt(900).toString(), // amountOutMinimum as string
                zeroForOne: true,
                deadline: BigInt(Date.now() + 60000)    // deadline as bigint
            };

            // Execute function
            const result = await swapPoolApi.swap({
                canisterId: mockCanisterId,
                ...swapArgs
            });

            // Verify actor method was called with correct args
            expect(mockSwap).toHaveBeenCalledWith(swapArgs);
            expect(result).toBe(mockSwapResponse);
        });

        it('should handle error response from the canister', async () => {
            // Setup error response
            const errorResponse = { err: { SlippageTooHigh: null } };
            mockSwap.mockResolvedValue(errorResponse);

            // Execute function with parameters
            const result = await swapPoolApi.swap({
                canisterId: mockCanisterId,
                amountIn: BigInt(1000).toString(),          // amountIn as string
                amountOutMinimum: BigInt(990).toString(), // amountOutMinimum as string
                zeroForOne: true
                // deadline is optional in SwapArgs based on its usage here
            });

            // Verify error is properly returned
            expect(result).toBe(errorResponse);
        });
    });

    /**
     * Tests for withdraw function
     * 
     * Validates that:
     * - The withdraw function correctly calls the Swap Pool actor
     * - Withdraw parameters are correctly passed through
     * - Response with withdraw result is properly returned
     */
    describe('withdraw', () => {
        const mockWithdrawResponse = { ok: BigInt(123) };

        beforeEach(() => {
            mockWithdraw.mockResolvedValue(mockWithdrawResponse);
        });

        it('should call withdraw with correct parameters', async () => {
            // Setup test data
            const withdrawArgs = {
                token: MOCK_TOKEN1_PRINCIPAL.toText(), // token as string
                amount: BigInt(50),
                fee: BigInt(10000) // fee as bigint
            };

            // Execute function
            const result = await swapPoolApi.withdraw({
                canisterId: mockCanisterId,
                ...withdrawArgs
            });

            // Verify actor method was called with correct args
            expect(mockWithdraw).toHaveBeenCalledWith(withdrawArgs);
            expect(result).toBe(mockWithdrawResponse);
        });
    });

    /**
     * Tests for actor caching mechanism
     * 
     * Validates that:
     * - Actors are cached for the same principal and canisterId
     * - New actors are created for different principals or canisterIds
     */
    describe('caching', () => {
        it('should use cached actor for same principal and canisterId', async () => {
            // First call creates and caches the actor
            await swapPoolApi.metadata({
                canisterId: mockCanisterId
            });

            // Second call with same canisterId should use cached actor
            await swapPoolApi.metadata({
                canisterId: mockCanisterId
            });

            // Should be called only once because the actor is reused
            expect(getSwapPoolActor).toHaveBeenCalledTimes(1);
        });

        it('should create new actor for different canisterId', async () => {
            // First call with canisterId1
            await swapPoolApi.metadata({
                canisterId: 'canisterId1'
            });

            // Second call with different canisterId
            await swapPoolApi.metadata({
                canisterId: 'canisterId2'
            });

            // Should be called twice because different canister IDs create different cache keys
            expect(getSwapPoolActor).toHaveBeenCalledTimes(2);
            expect(getSwapPoolActor).toHaveBeenNthCalledWith(1, 'canisterId1');
            expect(getSwapPoolActor).toHaveBeenNthCalledWith(2, 'canisterId2');
        });

        it('should create new actor when auth principal changes', async () => {
            // First call with principal1
            (get as any).mockReturnValue({ principal: { toString: () => 'principal1' } });

            await swapPoolApi.metadata({
                canisterId: mockCanisterId
            });

            // Change the principal
            (get as any).mockReturnValue({ principal: { toString: () => 'principal2' } });

            // Second call with different principal
            await swapPoolApi.metadata({
                canisterId: mockCanisterId
            });

            // Should be called twice because different principals create different cache keys
            expect(getSwapPoolActor).toHaveBeenCalledTimes(2);
        });
    });
}); 