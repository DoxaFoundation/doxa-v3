/**
 * @fileoverview
 * This file contains tests for the swap utility functions defined in `swap.utils.ts`.
 * It covers pool argument generation, token sorting, key generation, state interaction (mocked),
 * argument preparation for swap calls, and price impact calculations.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    getPoolsArgsToFetch,
    sortToken,
    getPoolKeyStoreKey,
    isPoolExists,
    getPoolData,
    getSwapArgs,
    calculateAmountOutMinimum,
    toStringDecimals,
    calculatePriceImpact, // Testing one of the identical functions
    calculatePriceImpact2
} from './swap.utils';
import { poolsMap } from '@states/swap-pool-data.svelte'; // Mocked Map
import { LedgerMetadata } from '@states/ledger-metadata.svelte'; // Mocked state
import { assertNonNullish } from '@dfinity/utils'; // Mocked function
import { assert } from './assert.utils'; // Mocked function
import * as AppConstants from '$lib/constants/app.constants'; // Mocked constants
import type { GetPoolArgs, PoolData } from '@declarations/SwapFactory/SwapFactory.did';
import type { SwapArgs } from '@declarations/SwapPool/SwapPool.did';
import { Principal } from '@dfinity/principal'; // Import Principal


// --- Mocks Setup ---

// Mock Constants
vi.mock('$lib/constants/app.constants', () => ({
    ICP_LEDGER_CANISTER_ID: 'icp-id',
    USDX_LEDGER_CANISTER_ID: 'usdx-id',
    CKUSDC_LEDGER_CANISTER_ID: 'ckusdc-id',
    CKBTC_LEDGER_CANISTER_ID: 'ckbtc-id',
    CKETH_LEDGER_CANISTER_ID: 'cketh-id',
    CKUSDT_LEDGER_CANISTER_ID: 'ckusdt-id'
}));

// Mock LedgerMetadata state
vi.mock('@states/ledger-metadata.svelte', () => ({
    LedgerMetadata: {
        'icp-id': { fee: 10000, decimals: 8, name: 'ICP', symbol: 'ICP' },
        'usdx-id': { fee: 0, decimals: 6, name: 'USDx', symbol: 'USDX' },
        'ckbtc-id': { fee: 500, decimals: 8, name: 'ckBTC', symbol: 'CKBTC' },
        'cketh-id': { fee: 2000, decimals: 18, name: 'ckETH', symbol: 'CKETH' },
        // Add other tokens if needed for specific tests
    }
}));

// Mock poolsMap state - Manage state and controls within the factory
vi.mock('@states/swap-pool-data.svelte', () => {
    const internalMockPoolsMap = new Map<string, PoolData>(); // Map inside factory
    return {
        poolsMap: internalMockPoolsMap, // Export the map
        // Export control functions as part of the mocked module
        __clearMockPoolsMap: () => internalMockPoolsMap.clear(),
        __setMockPoolsMap: (key: string, value: PoolData) => internalMockPoolsMap.set(key, value)
    };
});

// Mock @dfinity/utils
vi.mock('@dfinity/utils', async (importOriginal) => {
    const original = await importOriginal<typeof import('@dfinity/utils')>();
    return {
        ...original,
        assertNonNullish: vi.fn((value, message) => {
            if (value === null || value === undefined) {
                throw new Error(message || 'Value cannot be null or undefined');
            }
        })
    };
});

// Mock local assert utils
vi.mock('./assert.utils', () => ({
    assert: vi.fn((condition: boolean, message: string) => {
        if (!condition) {
            throw new Error(`Assertion failed: ${message}`);
        }
    })
}));

// --- Tests ---

// Import the mocked module to access its exports (including controls)
import * as SwapPoolDataState from '@states/swap-pool-data.svelte';

describe.skip('swap.utils', () => {

    beforeEach(() => {
        // Reset mocks and state before each test
        vi.clearAllMocks();
        // Use type assertion to access mocked functions
        (SwapPoolDataState as any).__clearMockPoolsMap();

        // Setup default pool data for relevant tests via helper
        const key1 = getPoolKeyStoreKey('usdx-id', 'icp-id');
        const mockPool: PoolData = {
            canisterId: Principal.fromText('ryjl3-tyaaa-aaaaa-aaaba-cai'),
            fee: 3000n,
            key: key1,
            tickSpacing: 60n,
            token0: { address: 'icp-id', standard: 'ICP' },
            token1: { address: 'usdx-id', standard: 'ICRC2' },
        };
        // Use type assertion to access mocked functions
        (SwapPoolDataState as any).__setMockPoolsMap(key1, mockPool);
    });

    describe('getPoolsArgsToFetch', () => {
        it('should return the predefined array of GetPoolArgs', () => {
            const args = getPoolsArgsToFetch();
            expect(Array.isArray(args)).toBe(true);
            expect(args.length).toBe(15); // Based on the implementation

            // Check structure of the first element as an example
            expect(args[0]).toEqual({
                token0: { address: AppConstants.USDX_LEDGER_CANISTER_ID, standard: 'ICRC2' },
                token1: { address: AppConstants.ICP_LEDGER_CANISTER_ID, standard: 'ICP' },
                fee: 3000n
            });
            // Check structure of another element
            expect(args[10]).toEqual({ // ckUSDC <-> ckETH
                token0: { address: AppConstants.CKETH_LEDGER_CANISTER_ID, standard: 'ICRC2' },
                token1: { address: AppConstants.CKUSDC_LEDGER_CANISTER_ID, standard: 'ICRC2' },
                fee: 3000n
            });
        });
    });

    describe('sortToken', () => {
        it('should sort tokens correctly when tokenX > tokenY', () => {
            expect(sortToken('usdx-id', 'icp-id')).toEqual(['icp-id', 'usdx-id']);
        });
        it('should sort tokens correctly when tokenY > tokenX', () => {
            expect(sortToken('ckbtc-id', 'cketh-id')).toEqual(['ckbtc-id', 'cketh-id']);
        });
        it('should return the same order if already sorted', () => {
            expect(sortToken('icp-id', 'usdx-id')).toEqual(['icp-id', 'usdx-id']);
        });
    });

    describe('getPoolKeyStoreKey', () => {
        it('should generate the correct key regardless of token order', () => {
            const expectedKey = 'icp-id_usdx-id_3000';
            expect(getPoolKeyStoreKey('usdx-id', 'icp-id')).toBe(expectedKey);
            expect(getPoolKeyStoreKey('icp-id', 'usdx-id')).toBe(expectedKey);
        });
    });

    describe('isPoolExists', () => {
        it('should return true if pool data exists in poolsMap', () => {
            // Pool added in beforeEach
            expect(isPoolExists('usdx-id', 'icp-id')).toBe(true);
            expect(isPoolExists('icp-id', 'usdx-id')).toBe(true); // Order shouldn't matter
        });
        it('should return false if pool data does not exist in poolsMap', () => {
            expect(isPoolExists('ckbtc-id', 'icp-id')).toBe(false);
        });
    });

    describe('getPoolData', () => {
        it('should return pool data if it exists in poolsMap', () => {
            const poolData = getPoolData('usdx-id', 'icp-id');
            expect(poolData).toBeDefined();
            // Use canisterId instead of poolId
            expect(poolData?.canisterId.toString()).toBe('ryjl3-tyaaa-aaaaa-aaaba-cai');
            expect(assertNonNullish).toHaveBeenCalledWith(poolData, expect.any(String));
        });

        it('should throw error via assertNonNullish if pool data does not exist', () => {
            const tokenX = 'ckbtc-id';
            const tokenY = 'icp-id';
            // Construct expected error message part
            const expectedMsgPart = `Swap Pool not found for ${LedgerMetadata[tokenX]?.name} and ${LedgerMetadata[tokenY]?.name}`;

            expect(() => getPoolData(tokenX, tokenY)).toThrow(expectedMsgPart);
            expect(assertNonNullish).toHaveBeenCalledWith(undefined, expect.stringContaining(expectedMsgPart));
        });
    });

    describe('toStringDecimals', () => {
        it('should convert number to string with correct decimals (ICP)', () => {
            // ICP: 8 decimals
            expect(toStringDecimals(1.23456789, 'icp-id')).toBe('123456789');
            expect(toStringDecimals(100, 'icp-id')).toBe('10000000000');
            expect(toStringDecimals(0.0001, 'icp-id')).toBe('10000');
            // Should truncate extra decimals
            expect(toStringDecimals(1.23456789999, 'icp-id')).toBe('123456789');
            expect(toStringDecimals(0, 'icp-id')).toBe('0');
        });

        it('should convert number to string with correct decimals (USDx)', () => {
            // USDx: 6 decimals
            expect(toStringDecimals(1.234567, 'usdx-id')).toBe('1234567');
            expect(toStringDecimals(50.5, 'usdx-id')).toBe('50500000');
            expect(toStringDecimals(0, 'usdx-id')).toBe('0');
        });

        it('should throw error via assertNonNullish if decimals are missing', () => {
            expect(() => toStringDecimals(10, 'non-existent-id')).toThrow('Decimals not found');
            expect(assertNonNullish).toHaveBeenCalledWith(undefined, 'Decimals not found');
        });
    });

    describe('calculateAmountOutMinimum', () => {
        // This depends on toStringDecimals, which depends on LedgerMetadata mock
        it('should calculate minimum amount out correctly (ICP target, 8 decimals)', () => {
            const amount = '100.5'; // Quoted amount
            const slippage = 0.5; // 0.5%
            const factor = 1 - slippage / 100; // 0.995
            const minAmountNum = Number(amount) * factor; // 100.5 * 0.995 = 100.00 // Error in comment: 100.5 * 0.995 = 100.0 - corrected: 100.4975
            const expectedString = '100497500'; // 100.4975 with 8 decimals, truncated

            expect(calculateAmountOutMinimum('icp-id', amount, slippage)).toBe(expectedString);
        });

        it('should calculate minimum amount out correctly (USDx target, 6 decimals)', () => {
            const amount = '50';
            const slippage = 1; // 1%
            const factor = 0.99;
            const minAmountNum = 50 * 0.99; // 49.5
            const expectedString = '49500000'; // 49.5 with 6 decimals

            expect(calculateAmountOutMinimum('usdx-id', amount, slippage)).toBe(expectedString);
        });

        it('should handle zero slippage', () => {
            const amount = '123.45';
            const slippage = 0;
            const expectedString = '123450000'; // 123.45 with 6 decimals (USDx)

            expect(calculateAmountOutMinimum('usdx-id', amount, slippage)).toBe(expectedString);
        });

        it('should throw if underlying toStringDecimals throws', () => {
            expect(() => calculateAmountOutMinimum('non-existent-id', '100', 0.5))
                .toThrow('Decimals not found');
        });
    });

    describe('getSwapArgs', () => {
        // Depends on sortToken, assert, toStringDecimals, calculateAmountOutMinimum
        const amountIn = 10; // e.g., 10 USDx
        const quoteAmount = '1.23'; // e.g., received 1.23 ICP quote
        const slippage = 0.5;
        const fromToken = 'usdx-id'; // 6 decimals
        const toToken = 'icp-id'; // 8 decimals

        it('should generate correct SwapArgs when swapping token1 for token0 (zeroForOne = false)', () => {
            // Swap USDx (token1 based on sort) for ICP (token0 based on sort)
            // sorted: [icp-id, usdx-id] -> token0=icp, token1=usdx
            // We are sending USDx (token1) to get ICP (token0) -> zeroForOne should be false
            const args = getSwapArgs(fromToken, toToken, amountIn, quoteAmount, slippage);

            // amountIn (USDx, 6 decimals)
            const expectedAmountInStr = '10000000'; // 10 * 10^6
            // amountOutMinimum (ICP, 8 decimals) for 1.23 quote and 0.5% slippage
            const minAmountNum = 1.23 * (1 - 0.005); // 1.22385
            const expectedAmountOutMinStr = '12238500'; // 1.22385 * 10^8 truncated

            expect(args.amountIn).toBe(expectedAmountInStr);
            expect(args.zeroForOne).toBe(false); // swapping token1 (USDx) for token0 (ICP)
            expect(args.amountOutMinimum).toBe(expectedAmountOutMinStr);
            expect(assert).toHaveBeenCalledWith(true, 'cannot swap the same token'); // Called with true
        });

        it('should generate correct SwapArgs when swapping token0 for token1 (zeroForOne = true)', () => {
            // Swap ICP (token0 based on sort) for USDx (token1 based on sort)
            // sorted: [icp-id, usdx-id] -> token0=icp, token1=usdx
            // We are sending ICP (token0) to get USDx (token1) -> zeroForOne should be true
            const fromTokenICP = 'icp-id';
            const toTokenUSDx = 'usdx-id';
            const amountInICP = 2.5;
            const quoteAmountUSDx = '30.5';
            const slippage = 1.0;

            const args = getSwapArgs(fromTokenICP, toTokenUSDx, amountInICP, quoteAmountUSDx, slippage);

            // amountIn (ICP, 8 decimals)
            const expectedAmountInStr = '250000000'; // 2.5 * 10^8
            // amountOutMinimum (USDx, 6 decimals) for 30.5 quote and 1% slippage
            const minAmountNum = 30.5 * (1 - 0.01); // 30.195
            const expectedAmountOutMinStr = '30195000'; // 30.195 * 10^6 truncated

            expect(args.amountIn).toBe(expectedAmountInStr);
            expect(args.zeroForOne).toBe(true); // swapping token0 (ICP) for token1 (USDx)
            expect(args.amountOutMinimum).toBe(expectedAmountOutMinStr);
            expect(assert).toHaveBeenCalledWith(true, 'cannot swap the same token');
        });

        it('should throw error via assert if from and to tokens are the same', () => {
            const token = 'icp-id';
            expect(() => getSwapArgs(token, token, 10, '10', 0.5))
                .toThrow('Assertion failed: cannot swap the same token');
            expect(assert).toHaveBeenCalledWith(false, 'cannot swap the same token');
        });

        it('should throw if underlying utils throw', () => {
            // Example: if toStringDecimals throws for the 'from' token
            expect(() => getSwapArgs('non-existent-from', 'icp-id', 10, '1', 0.5))
                .toThrow('Decimals not found');

            // Example: if calculateAmountOutMinimum (via its toStringDecimals) throws for the 'to' token
            expect(() => getSwapArgs('icp-id', 'non-existent-to', 10, '1', 0.5))
                .toThrow('Decimals not found');
        });
    });

    describe('calculatePriceImpact / calculatePriceImpact2', () => {
        // Test cases based on the formula: ((input * (inPrice / outPrice)) - output) / (input * (inPrice / outPrice)) - fee
        const inputAmount = 100; // e.g., 100 Token A
        const quoteAmount = 49; // e.g., received 49 Token B
        const inputTokenPrice = 1.0; // e.g., $1 per Token A
        const quoteTokenPrice = 2.0; // e.g., $2 per Token B
        const fee = 0.003; // 0.3%

        it('should calculate price impact correctly', () => {
            const midPrice = inputTokenPrice / quoteTokenPrice; // 1.0 / 2.0 = 0.5 (0.5 Token B per Token A)
            const expectedQuoteAmount = inputAmount * midPrice; // 100 * 0.5 = 50 Token B expected
            const rawPriceImpact = (expectedQuoteAmount - quoteAmount) / expectedQuoteAmount; // (50 - 49) / 50 = 1 / 50 = 0.02
            const expectedImpact = rawPriceImpact - fee; // 0.02 - 0.003 = 0.017 (or 1.7%)

            expect(calculatePriceImpact(inputAmount, quoteAmount, inputTokenPrice, quoteTokenPrice, fee)).toBeCloseTo(expectedImpact);
            expect(calculatePriceImpact2(inputAmount, quoteAmount, inputTokenPrice, quoteTokenPrice, fee)).toBeCloseTo(expectedImpact);

        });

        it('should handle zero price impact (excluding fee)', () => {
            const quoteAmountPerfect = 50; // Exactly the expected amount
            const rawPriceImpact = (50 - 50) / 50;
            const expectedImpact = 0 - fee; // -0.003 (-0.3%, just the fee)

            expect(calculatePriceImpact(inputAmount, quoteAmountPerfect, inputTokenPrice, quoteTokenPrice, fee)).toBeCloseTo(expectedImpact);
            expect(calculatePriceImpact2(inputAmount, quoteAmountPerfect, inputTokenPrice, quoteTokenPrice, fee)).toBeCloseTo(expectedImpact);
        });

        it('should handle positive slippage (quote > expected)', () => {
            const quoteAmountPositiveSlippage = 51; // Got more than expected
            const rawPriceImpact = (50 - 51) / 50;
            const expectedImpact = rawPriceImpact - fee; // -0.02 - 0.003 = -0.023 (-2.3%)

            expect(calculatePriceImpact(inputAmount, quoteAmountPositiveSlippage, inputTokenPrice, quoteTokenPrice, fee)).toBeCloseTo(expectedImpact);
            expect(calculatePriceImpact2(inputAmount, quoteAmountPositiveSlippage, inputTokenPrice, quoteTokenPrice, fee)).toBeCloseTo(expectedImpact);
        });

        it('should handle zero fee', () => {
            const feeZero = 0;
            const expectedImpact = 0.02 - 0; // 0.02 (2%)

            expect(calculatePriceImpact(inputAmount, quoteAmount, inputTokenPrice, quoteTokenPrice, feeZero)).toBeCloseTo(expectedImpact);
            expect(calculatePriceImpact2(inputAmount, quoteAmount, inputTokenPrice, quoteTokenPrice, feeZero)).toBeCloseTo(expectedImpact);
        });

        it('should handle zero input amount (results in NaN or Infinity)', () => {
            // Denominator `expectedQuoteAmount` becomes 0
            expect(calculatePriceImpact(0, quoteAmount, inputTokenPrice, quoteTokenPrice, fee)).toBeNaN();
            expect(calculatePriceImpact2(0, quoteAmount, inputTokenPrice, quoteTokenPrice, fee)).toBeNaN();
        });

        it('should handle zero token prices (results in NaN or Infinity)', () => {
            expect(calculatePriceImpact(inputAmount, quoteAmount, 0, quoteTokenPrice, fee)).toBeNaN(); // expectedQuoteAmount = 0
            expect(calculatePriceImpact(inputAmount, quoteAmount, inputTokenPrice, 0, fee)).toBe(Infinity); // midPrice = Infinity
            expect(calculatePriceImpact2(inputAmount, quoteAmount, 0, quoteTokenPrice, fee)).toBeNaN();
            expect(calculatePriceImpact2(inputAmount, quoteAmount, inputTokenPrice, 0, fee)).toBe(Infinity);
        });
    });

}); 