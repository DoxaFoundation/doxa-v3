/**
 * Tests for the Utility Canister API functions.
 * 
 * These tests cover the functionality of the Utility Canister API, which interacts
 * with a utility canister to fetch token price information.
 * 
 * Mocks:
 * - getUtilityActor: To provide a mock UtilityActor.
 * 
 * Test Focus:
 * - Correct invocation of actor methods (get_prices_from_ckusdc_pools_local, get_all_token_prices).
 * - Actor caching (singleton pattern for the actor).
 * - Handling of responses from the actor methods.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getUtilityActor } from '$lib/actors/actors.ic';
import * as utilityApi from './utility.canister.api';
// Assuming the response types are simple arrays as per the API file.
// If they are more complex, specific types from declarations might be needed.

// Mock dependencies
vi.mock('$lib/actors/actors.ic', () => ({
    getUtilityActor: vi.fn()
}));

describe('Utility Canister API', () => {
    // Mock actor methods
    const mockGetPricesFromCkusdcPools = vi.fn();
    const mockGetAllTokenPrices = vi.fn();

    const mockActor = {
        get_prices_from_ckusdc_pools_local: mockGetPricesFromCkusdcPools,
        get_all_token_prices: mockGetAllTokenPrices
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (getUtilityActor as any).mockResolvedValue(mockActor);
        // Reset the singleton canister instance in the module to test caching correctly
        // This assumes a reset function like _resetCanister is exposed from utility.canister.api.ts
        if (typeof (utilityApi as any)._resetCanister === 'function') {
            (utilityApi as any)._resetCanister();
        }
    });

    /**
     * Tests for the getPricesFromCkusdcPools function.
     */
    describe('getPricesFromCkusdcPools', () => {
        it('should call get_prices_from_ckusdc_pools_local and return price data', async () => {
            const mockPriceData: Array<[string, number]> = [['TOKEN_A', 1.25], ['TOKEN_B', 0.75]];
            mockGetPricesFromCkusdcPools.mockResolvedValue(mockPriceData);

            const result = await utilityApi.getPricesFromCkusdcPools();

            expect(getUtilityActor).toHaveBeenCalledTimes(1);
            expect(mockGetPricesFromCkusdcPools).toHaveBeenCalled();
            expect(result).toEqual(mockPriceData);
        });

        it('should return an empty array if the canister call fails or returns empty', async () => {
            // Example of testing a scenario where the canister might return empty or an error is handled to return empty.
            // Adjust based on actual error handling if it throws or returns a specific error structure.
            mockGetPricesFromCkusdcPools.mockResolvedValue([]);
            const result = await utilityApi.getPricesFromCkusdcPools();
            expect(result).toEqual([]);
        });
    });

    /**
     * Tests for the getAllTokenPrices function.
     */
    describe('getAllTokenPrices', () => {
        it('should call get_all_token_prices and return all token prices', async () => {
            const mockAllPricesData: Array<[string, number]> = [['ICP', 12.50], ['CYCLES', 1.00], ['TOKEN_C', 22.45]];
            mockGetAllTokenPrices.mockResolvedValue(mockAllPricesData);

            const result = await utilityApi.getAllTokenPrices();

            expect(getUtilityActor).toHaveBeenCalledTimes(1); // Still 1 if called after the above test in same suite without reset
            expect(mockGetAllTokenPrices).toHaveBeenCalled();
            expect(result).toEqual(mockAllPricesData);
        });
    });

    /**
     * Tests for the actor caching mechanism (singleton pattern).
     */
    describe('caching', () => {
        it('should use the same actor instance for multiple calls across different functions', async () => {
            mockGetPricesFromCkusdcPools.mockResolvedValue([]);
            mockGetAllTokenPrices.mockResolvedValue([]);

            await utilityApi.getPricesFromCkusdcPools(); // First call
            await utilityApi.getAllTokenPrices();         // Second call

            // getUtilityActor should only be called once due to singleton caching
            expect(getUtilityActor).toHaveBeenCalledTimes(1);
        });
    });
}); 