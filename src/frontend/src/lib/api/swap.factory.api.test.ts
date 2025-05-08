/**
 * Tests for the Swap Factory API functions.
 * 
 * These tests cover the functionality of the Swap Factory API, which interacts
 * with the SwapFactory canister to get information about swap pools.
 * 
 * Mocks:
 * - getSwapFactoryActor: To provide a mock SwapFactory actor.
 * 
 * Test Focus:
 * - Correct invocation of actor methods (getPool, getPools).
 * - Proper passing of arguments (for getPool).
 * - Actor caching (singleton pattern for the actor).
 * - Handling of responses (success and error cases).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSwapFactoryActor } from '$lib/actors/actors.swap';
import * as swapFactoryApi from './swap.factory.api';
import type { GetPoolArgs, PoolData, Error as SwapFactoryError } from '@declarations/SwapFactory/SwapFactory.did';
import type { GetPoolResponse, GetPoolsResponse } from '$lib/types/api';
import { Principal } from '@dfinity/principal';

// Mock dependencies
vi.mock('$lib/actors/actors.swap', () => ({
    getSwapFactoryActor: vi.fn()
}));

describe('Swap Factory API', () => {
    // Mock actor methods
    const mockGetPool = vi.fn();
    const mockGetPools = vi.fn();

    const mockActor = {
        getPool: mockGetPool,
        getPools: mockGetPools
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (getSwapFactoryActor as any).mockResolvedValue(mockActor);
        // Reset the singleton canister instance in the module to test caching correctly
        swapFactoryApi._resetSwapFactoryCanisterForTesting();
    });

    /**
     * Tests for the getPool function.
     */
    describe('getPool', () => {
        const tokenA = Principal.fromText('ryjl3-tyaaa-aaaaa-aaaba-cai');
        const tokenB = Principal.fromText('rrkah-fqaaa-aaaaa-aaaaq-cai');
        const getPoolArgs: GetPoolArgs = { tokenA, tokenB };

        const mockPoolData: PoolData = {
            id: Principal.fromText('rwlgt-iiaaa-aaaaa-aaaaa-cai'),
            token0: tokenA,
            token1: tokenB,
            pool_type: { Fungible: null }, // Example, adjust as per actual PoolType
            total_supply: BigInt(1000000000000),
            reserve0: BigInt(500000000000),
            reserve1: BigInt(500000000000),
            block_timestamp_last: BigInt(Date.now() * 1000000),
            fee_on: true,
            fee: BigInt(30) // Example fee (e.g., 0.3%)
        };

        it('should call the actor getPool method with correct arguments', async () => {
            const mockSuccessResponse: GetPoolResponse = { ok: mockPoolData };
            mockGetPool.mockResolvedValue(mockSuccessResponse);

            const result = await swapFactoryApi.getPool(getPoolArgs);

            expect(getSwapFactoryActor).toHaveBeenCalledTimes(1);
            expect(mockGetPool).toHaveBeenCalledWith(getPoolArgs);
            expect(result).toEqual(mockSuccessResponse);
        });

        it('should handle error responses from the getPool method', async () => {
            const mockError: SwapFactoryError = { Other: 'Pool not found' };
            const mockErrorResponse: GetPoolResponse = { err: mockError };
            mockGetPool.mockResolvedValue(mockErrorResponse);

            const result = await swapFactoryApi.getPool(getPoolArgs);

            expect(mockGetPool).toHaveBeenCalledWith(getPoolArgs);
            expect(result).toEqual(mockErrorResponse);
        });
    });

    /**
     * Tests for the getPools function.
     */
    describe('getPools', () => {
        const mockPoolList: PoolData[] = [/* define one or two mock PoolData objects here similar to mockPoolData above */];

        it('should call the actor getPools method and return a list of pools', async () => {
            const mockSuccessResponse: GetPoolsResponse = { ok: mockPoolList };
            mockGetPools.mockResolvedValue(mockSuccessResponse);

            const result = await swapFactoryApi.getPools();

            expect(getSwapFactoryActor).toHaveBeenCalledTimes(1);
            expect(mockGetPools).toHaveBeenCalled();
            expect(result).toEqual(mockSuccessResponse);
        });

        it('should handle error responses from the getPools method', async () => {
            const mockError: SwapFactoryError = { Other: 'Failed to fetch pools' };
            const mockErrorResponse: GetPoolsResponse = { err: mockError };
            mockGetPools.mockResolvedValue(mockErrorResponse);

            const result = await swapFactoryApi.getPools();
            expect(result).toEqual(mockErrorResponse);
        });
    });

    /**
     * Tests for the actor caching mechanism (singleton pattern).
     */
    describe('caching', () => {
        const getPoolArgs: GetPoolArgs = {
            tokenA: Principal.fromText('ryjl3-tyaaa-aaaaa-aaaba-cai'),
            tokenB: Principal.fromText('rrkah-fqaaa-aaaaa-aaaaq-cai')
        };

        it('should use the same actor instance for multiple calls', async () => {
            mockGetPool.mockResolvedValue({ ok: {} as PoolData }); // Mock response for getPool
            mockGetPools.mockResolvedValue({ ok: [] }); // Mock response for getPools

            await swapFactoryApi.getPool(getPoolArgs); // First call
            await swapFactoryApi.getPools();           // Second call

            // getSwapFactoryActor should only be called once due to singleton caching
            expect(getSwapFactoryActor).toHaveBeenCalledTimes(1);
        });
    });
});

// Helper function to reset the canister instance in the API module for testing caching
// This needs to be added to swap.factory.api.ts or exposed for testing.
// For now, we'll assume it can be done or we test caching effects indirectly.
// If swap.factory.api.ts is: 
// let canister: SwapFactoryActor | undefined;
// export const resetCanister = () => { canister = undefined; }; 
// Then we can call it from tests. 