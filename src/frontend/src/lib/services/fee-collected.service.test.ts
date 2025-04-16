/**
 * @fileoverview
 * This file contains tests for the fee collected service functions defined in `fee-collected.service.ts`.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchFeecollecteds } from './fee-collected.service';
import { feeCollected } from '@states/fee-collected.svelte';
import { authStore } from '@stores/auth.store';
import { toast } from 'svelte-sonner';
import { get } from 'svelte/store';

// Mock dependencies - creating fake versions of imported modules for testing
vi.mock('@states/fee-collected.svelte', () => ({
    feeCollected: {
        set: vi.fn() // Mock the set function of feeCollected store
    }
}));

vi.mock('@stores/auth.store', () => ({
    authStore: {
        subscribe: vi.fn() // Mock the subscribe method of authStore
    }
}));

vi.mock('svelte/store', () => ({
    get: vi.fn() // Mock the get function from svelte/store
}));

vi.mock('svelte-sonner', () => ({
    toast: {
        error: vi.fn() // Mock the error function of toast notifications
    }
}));

describe('fee-collected.service', () => {
    // Create mock staking service with the methods we'll need to test
    const mockStakingService = {
        getTotalFeeCollectedSofar: vi.fn(), // Mock function to get total fees collected
        getTotalFeeCollectedFromLastRewardDistribution: vi.fn() // Mock function to get fees since last distribution
    };

    beforeEach(() => {
        vi.clearAllMocks(); // Reset all mocks before each test
        vi.spyOn(console, 'error').mockImplementation(() => { }); // Prevent console errors from showing in test output

        // Set up the mock to return our fake staking service when get() is called
        // This is the correct way to mock the get function
        vi.mocked(get).mockReturnValue({
            staking: mockStakingService
        });
    });

    describe('fetchFeecollecteds', () => {
        it('should fetch and set fee collected data successfully', async () => {
            // Set up test data - bigint values representing collected fees
            const totalFee = 1000n; // Total fees collected overall
            const lastRewardFee = 500n; // Fees collected since last reward distribution

            // Configure our mock functions to return the test data when called
            mockStakingService.getTotalFeeCollectedSofar.mockResolvedValue(totalFee);
            mockStakingService.getTotalFeeCollectedFromLastRewardDistribution.mockResolvedValue(lastRewardFee);

            // Call the function we're testing
            await fetchFeecollecteds();

            // Verify that both API methods were called
            expect(mockStakingService.getTotalFeeCollectedSofar).toHaveBeenCalled();
            expect(mockStakingService.getTotalFeeCollectedFromLastRewardDistribution).toHaveBeenCalled();
            
            // Verify that the feeCollected store was updated with the correct data
            expect(feeCollected.set).toHaveBeenCalledWith({
                total: totalFee,
                fromLastRewardDistribution: lastRewardFee
            });
        });

        it('should handle errors when fetching fee collected data', async () => {
            // Create a test error to simulate API failure
            const error = new Error('Network error');
            
            // Configure the first API call to fail with our test error
            mockStakingService.getTotalFeeCollectedSofar.mockRejectedValue(error);

            // Call the function we're testing
            await fetchFeecollecteds();

            // Verify that the error was logged to console
            expect(console.error).toHaveBeenCalledWith(error);
            
            // Verify that an error toast was shown to the user
            expect(toast.error).toHaveBeenCalledWith('Something went wrong while fetching staking pool details.');
            
            // Verify that the feeCollected store was NOT updated (since there was an error)
            expect(feeCollected.set).not.toHaveBeenCalled();
        });
    });
}); 