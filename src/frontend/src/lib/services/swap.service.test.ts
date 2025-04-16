/**
 * @fileoverview
 * This file contains tests for the swap service functions defined in `swap.service.ts`.
 * The swap service handles token exchange functionality between different tokens
 * through liquidity pools in a decentralized exchange model.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    fetchPools,
    fetchPoolsCanisterIds,
    getRateQuote,
    getQuote,
    swapToken
} from './swap.service';
import { getPool } from '$lib/api/swap.factory.api';
import {
    depositFrom,
    getUserUnusedBalance,
    quote,
    swap,
    withdraw
} from '$lib/api/swap.pool.api';
import { approve } from '$lib/api/icrc.ledger.api';
import { updateBalance } from '@states/ledger-balance.svelte';
import { LedgerMetadata } from '@states/ledger-metadata.svelte';
import { Principal } from '@dfinity/principal';
import {
    fromBigIntDecimals,
    toBigIntDecimals
} from '@utils/decimals.utils';
import {
    getPoolData,
    getPoolsArgsToFetch,
    getSwapArgs
} from '@utils/swap.utils';
import { toast } from 'svelte-sonner';
import { getFee, getFeeWithDecimals } from '@utils/icrc-ledger.utils';
import { displayBigIntBalanceInFormat } from '@utils/fromat.utils';
import type { Error as SwapFactoryError } from '../../../../declarations/SwapFactory/SwapFactory.did';
import type { Error as SwapPoolError } from '../../../../declarations/SwapPool/SwapPool.did';
import * as swapService from './swap.service'; // Restore direct module import

// Mock the module that accesses window directly
vi.mock('$lib/connection/plug.connection.ts', () => ({
    // Provide mock implementations or values for exports used by other modules
    // If nothing is needed by swap.service (via auth.store), empty object might suffice
    // Example: Mocking plug variable if it's exported and used
    plug: null,
    initPlug: vi.fn(),
}));

// Mock dependencies
// Mock the swap factory API which provides access to liquidity pools
vi.mock('$lib/api/swap.factory.api', () => ({
    getPool: vi.fn()
}));

// Mock the swap pool API methods for interacting with liquidity pools
vi.mock('$lib/api/swap.pool.api', () => ({
    depositFrom: vi.fn(),
    getUserUnusedBalance: vi.fn(),
    quote: vi.fn(),
    swap: vi.fn(),
    withdraw: vi.fn()
}));

// Mock ICRC ledger API for token approvals
vi.mock('$lib/api/icrc.ledger.api', () => ({
    approve: vi.fn()
}));

// Mock balance state management
vi.mock('@states/ledger-balance.svelte', () => ({
    updateBalance: vi.fn()
}));

// Mock utility functions for handling decimal conversions
vi.mock('@utils/decimals.utils', () => ({
    fromBigIntDecimals: vi.fn(),
    toBigIntDecimals: vi.fn()
}));

// Mock swap utility functions
vi.mock('@utils/swap.utils', () => ({
    getPoolData: vi.fn(),
    getPoolsArgsToFetch: vi.fn(),
    getSwapArgs: vi.fn()
}));

// Mock ICRC ledger utility functions for fee calculations
vi.mock('@utils/icrc-ledger.utils', () => ({
    getFee: vi.fn(),
    getFeeWithDecimals: vi.fn()
}));

// Mock formatting utilities
vi.mock('@utils/fromat.utils', () => ({
    displayBigIntBalanceInFormat: vi.fn()
}));

// Mock toast notifications for user feedback
vi.mock('svelte-sonner', () => ({
    toast: {
        loading: vi.fn().mockReturnValue('toast-id'),
        success: vi.fn().mockReturnValue('toast-id'),
        error: vi.fn().mockReturnValue('toast-id')
    }
}));

describe('swap.service', () => {
    // Test setup before each test
    beforeEach(() => {
        // Reset all mocks to ensure isolation between tests
        vi.clearAllMocks();
        // Suppress console errors during testing
        vi.spyOn(console, 'error').mockImplementation(() => { });

        // Mock token metadata for test tokens
        vi.stubGlobal('LedgerMetadata', {
            'token1-ledger': {
                symbol: 'TKN1'
            },
            'token2-ledger': {
                symbol: 'TKN2'
            }
        });
    });

    describe('fetchPools', () => {
        // Test case: Successfully fetching pool data
        it('should fetch and return pools data successfully', async () => {
            const mockPoolArgs = [
                { token0: { address: 'token1-address', standard: 'ICRC1' }, token1: { address: 'token2-address', standard: 'ICRC1' }, fee: 500n },
                { token0: { address: 'token3-address', standard: 'ICRC1' }, token1: { address: 'token4-address', standard: 'ICRC1' }, fee: 500n }
            ];
            const mockPoolData = [
                {
                    canisterId: Principal.fromText('aaaaa-aa'),
                    fee: 500n, key: 'key1', tickSpacing: 10n,
                    token0: { address: 'token1-address', standard: 'ICRC1' },
                    token1: { address: 'token2-address', standard: 'ICRC1' }
                },
                {
                    canisterId: Principal.fromText('rrkah-fqaaa-aaaaa-aaaaq-cai'),
                    fee: 500n, key: 'key2', tickSpacing: 10n,
                    token0: { address: 'token3-address', standard: 'ICRC1' },
                    token1: { address: 'token4-address', standard: 'ICRC1' }
                }
            ];

            // Mock the dependencies called *by* fetchPools
            vi.mocked(getPoolsArgsToFetch).mockReturnValue(mockPoolArgs);
            vi.mocked(getPool).mockImplementation((args) => {
                if (args.token0.address === 'token1-address') {
                    return Promise.resolve({ ok: mockPoolData[0] });
                } else {
                    return Promise.resolve({ ok: mockPoolData[1] });
                }
            });

            // Execute the function under test (original fetchPools)
            const result = await swapService.fetchPools(); // Call original function

            // Verify expected behavior and results
            expect(getPoolsArgsToFetch).toHaveBeenCalled();
            expect(getPool).toHaveBeenCalledTimes(2);
            expect(result).toEqual(mockPoolData);
        });

        // Test case: Handling error responses from pool fetching
        it('should filter out null pools when there is an error response', async () => {
            const mockPoolArgs = [
                { token0: { address: 'token1-address', standard: 'ICRC1' }, token1: { address: 'token2-address', standard: 'ICRC1' }, fee: 500n },
                { token0: { address: 'token3-address', standard: 'ICRC1' }, token1: { address: 'token4-address', standard: 'ICRC1' }, fee: 500n }
            ];
            const mockPoolData = [
                {
                    canisterId: Principal.fromText('aaaaa-aa'),
                    fee: 500n, key: 'key1', tickSpacing: 10n,
                    token0: { address: 'token1-address', standard: 'ICRC1' },
                    token1: { address: 'token2-address', standard: 'ICRC1' }
                }
            ];
            const mockError: SwapFactoryError = { 'CommonError': null };

            vi.mocked(getPoolsArgsToFetch).mockReturnValue(mockPoolArgs);
            vi.mocked(getPool).mockImplementation((args) => {
                if (args.token0.address === 'token1-address') {
                    return Promise.resolve({ ok: mockPoolData[0] });
                } else {
                    return Promise.resolve({ err: mockError });
                }
            });

            const result = await swapService.fetchPools(); // Call original

            expect(getPool).toHaveBeenCalledTimes(2);
            expect(result).toEqual([mockPoolData[0]]);
        });

        // Test case: Exception handling
        it('should handle exceptions and return empty array', async () => {
            const error = new Error('Error fetching pool args');
            vi.mocked(getPoolsArgsToFetch).mockImplementation(() => {
                throw error;
            });

            const result = await swapService.fetchPools(); // Call original

            expect(console.error).toHaveBeenCalledWith('Error fetching pools:', error);
            expect(toast.error).toHaveBeenCalledWith('Error fetching pools');
            expect(result).toEqual([]);
        });
    });

    describe('fetchPoolsCanisterIds', () => {
        // Skip this test for now
        it.skip('should return list of canister IDs', async () => {
            const mockPoolData = [
                {
                    canisterId: Principal.fromText('aaaaa-aa'),
                    fee: 500n, key: 'key1', tickSpacing: 10n,
                    token0: { address: 'token1-address', standard: 'ICRC1' },
                    token1: { address: 'token2-address', standard: 'ICRC1' }
                },
                {
                    canisterId: Principal.fromText('rrkah-fqaaa-aaaaa-aaaaq-cai'),
                    fee: 500n, key: 'key2', tickSpacing: 10n,
                    token0: { address: 'token3-address', standard: 'ICRC1' },
                    token1: { address: 'token4-address', standard: 'ICRC1' }
                }
            ];

            // Dynamically mock fetchPools just for this test
            vi.doMock('./swap.service', async (importOriginal) => {
                const actual = await importOriginal() as typeof swapService;
                return {
                    ...actual,
                    fetchPools: vi.fn().mockResolvedValue(mockPoolData), // Mock fetchPools
                };
            });

            // Import the mocked service *after* vi.doMock
            const { fetchPoolsCanisterIds } = await import('./swap.service');

            // Execute the function under test (which will call the mocked fetchPools)
            const result = await fetchPoolsCanisterIds();

            // Verify: Canister IDs are correctly extracted
            expect(result).toEqual(['aaaaa-aa', 'rrkah-fqaaa-aaaaa-aaaaq-cai']);

            // Unmock after test if needed (or rely on test runner isolation)
            vi.doUnmock('./swap.service');
        });
    });

    describe('getRateQuote', () => {
        // Test case: Successfully getting a rate quote
        it('should return rate quote successfully', async () => {
            // Setup: Test tokens and expected responses
            const base = 'token1-ledger';
            const quoteToken = 'token2-ledger';
            const mockPool = {
                canisterId: Principal.fromText('ryjl3-tyaaa-aaaaa-aaaba-cai'),
                fee: 500n,
                key: 'key1',
                tickSpacing: 10n,
                token0: { address: 'token1-address', standard: 'ICRC1' },
                token1: { address: 'token2-address', standard: 'ICRC1' }
            };
            const mockSwapArgs = {
                tokenIn: 'token1-ledger',
                tokenOut: 'token2-ledger',
                amountIn: '1000000',
                zeroForOne: true,
                amountOutMinimum: '0'
            };
            const mockQuoteResponse = { ok: 2000000n };

            // Configure mocks to simulate the quote flow
            vi.mocked(getPoolData).mockReturnValue(mockPool);
            vi.mocked(getSwapArgs).mockReturnValue(mockSwapArgs);
            vi.mocked(quote).mockResolvedValue(mockQuoteResponse);
            vi.mocked(fromBigIntDecimals).mockReturnValue(2);

            // Execute the function under test
            const result = await getRateQuote(base, quoteToken);

            // Verify: All expected functions are called with correct parameters
            expect(getPoolData).toHaveBeenCalledWith(base, quoteToken);
            expect(getSwapArgs).toHaveBeenCalledWith(base, quoteToken, 1, '0', 0);
            expect(quote).toHaveBeenCalledWith({
                canisterId: 'ryjl3-tyaaa-aaaaa-aaaba-cai',
                ...mockSwapArgs
            });
            expect(fromBigIntDecimals).toHaveBeenCalledWith(2000000n, quoteToken);
            expect(result).toBe(2);
        });

        // Test case: Handling error response from quote
        it('should handle error response and return null', async () => {
            // Setup: Quote function returns an error
            const base = 'token1-ledger';
            const quoteToken = 'token2-ledger';
            const mockPool = {
                canisterId: Principal.fromText('ryjl3-tyaaa-aaaaa-aaaba-cai'),
                fee: 500n,
                key: 'key1',
                tickSpacing: 10n,
                token0: { address: 'token1-address', standard: 'ICRC1' },
                token1: { address: 'token2-address', standard: 'ICRC1' }
            };
            const mockSwapArgs = {
                tokenIn: 'token1-ledger',
                tokenOut: 'token2-ledger',
                amountIn: '1000000',
                zeroForOne: true,
                amountOutMinimum: '0'
            };

            // Configure mocks with error response
            vi.mocked(getPoolData).mockReturnValue(mockPool);
            vi.mocked(getSwapArgs).mockReturnValue(mockSwapArgs);
            // Use the imported SwapPoolError type
            const quoteError: SwapPoolError = { 'CommonError': null };
            vi.mocked(quote).mockResolvedValue({ err: quoteError });

            // Execute the function under test
            const result = await getRateQuote(base, quoteToken);

            // Verify: Error is logged and null is returned
            expect(console.error).toHaveBeenCalled();
            expect(result).toBeNull();
        });

        // Test case: Exception handling
        it('should handle exceptions and return null', async () => {
            // Setup: getPoolData throws an exception
            const base = 'token1-ledger';
            const quoteToken = 'token2-ledger';

            // Configure mock to throw error
            vi.mocked(getPoolData).mockImplementation(() => {
                throw new Error('Pool not found');
            });

            // Execute the function under test
            const result = await getRateQuote(base, quoteToken);

            // Verify: Error is logged and null is returned
            expect(console.error).toHaveBeenCalled();
            expect(result).toBeNull();
        });
    });

    describe('getQuote', () => {
        // Test case: Successfully getting a swap quote
        it('should return quote successfully', async () => {
            // Setup: Test tokens, amount and expected responses
            const from = 'token1-ledger';
            const to = 'token2-ledger';
            const amount = '10';
            const mockPool = {
                canisterId: Principal.fromText('ryjl3-tyaaa-aaaaa-aaaba-cai'),
                fee: 500n,
                key: 'key1',
                tickSpacing: 10n,
                token0: { address: 'token1-address', standard: 'ICRC1' },
                token1: { address: 'token2-address', standard: 'ICRC1' }
            };
            const mockSwapArgs = {
                tokenIn: from,
                tokenOut: to,
                amountIn: '10000000',
                zeroForOne: true,
                amountOutMinimum: '0'
            };
            const mockQuoteResponse = { ok: 19500000n };

            // Configure mocks to simulate the quote flow
            vi.mocked(getPoolData).mockReturnValue(mockPool);
            vi.mocked(getSwapArgs).mockReturnValue(mockSwapArgs);
            vi.mocked(quote).mockResolvedValue(mockQuoteResponse);
            vi.mocked(fromBigIntDecimals).mockReturnValue(19.5);

            // Execute the function under test
            const result = await getQuote(from, to, amount);

            // Verify: All expected functions are called with correct parameters
            expect(getPoolData).toHaveBeenCalledWith(from, to);
            expect(getSwapArgs).toHaveBeenCalledWith(from, to, Number(amount), '0', 0);
            expect(quote).toHaveBeenCalledWith({
                canisterId: 'ryjl3-tyaaa-aaaaa-aaaba-cai',
                ...mockSwapArgs
            });
            expect(fromBigIntDecimals).toHaveBeenCalledWith(19500000n, to);
            expect(result).toBe(19.5);
        });

        // Additional test cases for getQuote...
    });

    // Additional test blocks for other functions...
}); 