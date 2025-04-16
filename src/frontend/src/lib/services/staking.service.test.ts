/**
 * @fileoverview
 * This file contains tests for the staking service functions defined in `staking.service.ts`.
 * 
 * Purpose:
 * - Tests the staking functionality for USDx tokens on the Internet Computer
 * - Verifies pool data fetching and state management
 * - Tests token staking with various parameters (amount, lock period)
 * - Validates auto-staking rewards functionality (enabling/disabling)
 * - Tests manual compounding of unclaimed rewards
 * - Verifies unstaking process including time-lock constraints
 * - Ensures proper error handling for all staking operations
 * - Checks that appropriate notifications are displayed to users
 * - Validates balance updates occur after successful operations
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    fetchStakingPoolDetails,
    stakeUSDx,
    toggleAutoStakeRewads,
    stakeUnclaimedRewards,
    unstake
} from './staking.service';
import { setStakingPoolDetails } from '@states/staking.svelte';
import { authStore } from '@stores/auth.store';
import { toast } from 'svelte-sonner';
import { get } from 'svelte/store';
import { transfer } from './icrc.service';
import { to6Decimals } from '@utils/decimals.utils';
import { STAKING_ACCOUNT } from '@constants/staking.constants';
import { daysToNanoseconds } from '@utils/date-time.utils';
import { myStakes } from '@states/my-stakes.svelte';
import { updateBalance } from '@states/ledger-balance.svelte';
import { USDX_LEDGER_CANISTER_ID } from '@constants/app.constants';

// Here we're mocking all the dependencies that our staking service uses
// This allows us to control their behavior during tests

// Mock the staking state module - we'll use this to verify setStakingPoolDetails is called
vi.mock('@states/staking.svelte', () => ({
    setStakingPoolDetails: vi.fn() // Create a mock function we can track
}));

// Mock the authentication store - we'll need this for user context
vi.mock('@stores/auth.store', () => ({
    authStore: {
        subscribe: vi.fn() // Mock the subscribe method
    }
}));

// Mock the Svelte store's get function - we'll use this to return our mock services
vi.mock('svelte/store', () => ({
    get: vi.fn() // This will be used to return mock objects
}));

// Mock the ICRC token transfer service
vi.mock('./icrc.service', () => ({
    transfer: vi.fn() // Mock the transfer function to simulate token transfers
}));

// Mock the decimal conversion utility - converts regular numbers to blockchain format
vi.mock('@utils/decimals.utils', () => ({
    // This converts a number like 100 to 100000000 (adding 6 decimal places)
    to6Decimals: vi.fn(amount => BigInt(amount * 1000000))
}));

// Mock the date-time utilities - converts days to nanoseconds for blockchain
vi.mock('@utils/date-time.utils', () => ({
    // Converts days to nanoseconds (1 day = 86400000000000 nanoseconds)
    daysToNanoseconds: vi.fn(days => BigInt(days * 86400000000000))
}));

// Mock the stakes state module - tracks user's current stakes
vi.mock('@states/my-stakes.svelte', () => ({
    myStakes: {
        value: [], // Will hold mock stake data
        fetch: vi.fn() // Function to refresh stake data
    }
}));

// Mock the balance state module - tracks user's token balances
vi.mock('@states/ledger-balance.svelte', () => ({
    updateBalance: vi.fn() // Function to refresh token balances
}));

// Mock the toast notification library - for showing user messages
vi.mock('svelte-sonner', () => ({
    toast: {
        // Each toast function returns an ID that can be used to update the toast
        loading: vi.fn().mockReturnValue('toast-id'),
        success: vi.fn().mockReturnValue('toast-id'),
        error: vi.fn().mockReturnValue('toast-id'),
        info: vi.fn()
    }
}));

describe('staking.service', () => {
    // Before each test, we'll reset all mocks and silence console errors
    beforeEach(() => {
        vi.clearAllMocks(); // Reset all mock function call counts
        vi.spyOn(console, 'error').mockImplementation(() => { }); // Prevent console errors in test output
    });

    describe('fetchStakingPoolDetails', () => {
        it('should fetch and set staking pool details successfully', async () => {
            // Create mock data that our staking service would return
            const mockPoolData = {
                totalStaked: 1000n, // BigInt for large numbers
                stakingRewardRate: 5n,
                totalStakers: 100n
            };

            // Create a mock staking service with a getPoolData function
            const mockStakingService = {
                getPoolData: vi.fn().mockResolvedValue(mockPoolData) // Will return our mock data when called
            };

            // When get() is called, return an object with our mock service
            vi.mocked(get).mockReturnValue({
                staking: mockStakingService
            });

            // Call the function we're testing
            await fetchStakingPoolDetails();

            // Verify getPoolData was called
            expect(mockStakingService.getPoolData).toHaveBeenCalled();
            // Verify the pool details were set with our mock data
            expect(setStakingPoolDetails).toHaveBeenCalledWith(mockPoolData);
        });

        it('should handle errors when fetching staking pool details', async () => {
            // Create a test error
            const error = new Error('Network error');

            // Create a mock service that throws an error
            const mockStakingService = {
                getPoolData: vi.fn().mockRejectedValue(error) // Will throw our error when called
            };

            // When get() is called, return an object with our mock service
            vi.mocked(get).mockReturnValue({
                staking: mockStakingService
            });

            // Call the function we're testing
            await fetchStakingPoolDetails();

            // Verify error was logged
            expect(console.error).toHaveBeenCalledWith(error);
            // Verify error toast was shown to user
            expect(toast.error).toHaveBeenCalledWith('Something went wrong while fetching staking pool details.');
        });
    });

    describe('stakeUSDx', () => {
        const amount = 100; // Amount to stake
        const days = 30; // Lock period in days
        const blockIndex = 42n; // Mock blockchain transaction ID

        it('should stake USDx successfully', async () => {
            // Create a mock staking service with a notifyStake function
            const mockStakingService = {
                notifyStake: vi.fn().mockResolvedValue({ ok: true }) // Returns success response
            };

            // When get() is called, return an object with our mock service
            vi.mocked(get).mockReturnValue({
                staking: mockStakingService
            });

            // Mock the transfer function to return a block index (transaction ID)
            vi.mocked(transfer).mockResolvedValue(blockIndex);

            // Call the function we're testing
            await stakeUSDx({ amount, days });

            // Verify loading toast was shown
            expect(toast.loading).toHaveBeenCalledWith('Transfering USDx to staking canister...');
            // Verify transfer was called with correct parameters
            expect(transfer).toHaveBeenCalledWith({
                token: 'USDx',
                amount: to6Decimals(amount),
                to: STAKING_ACCOUNT
            });
            // Verify balance was updated after transfer
            expect(updateBalance).toHaveBeenCalledWith(USDX_LEDGER_CANISTER_ID);
            // Verify days were converted to nanoseconds
            expect(daysToNanoseconds).toHaveBeenCalledWith(days);
            // Verify notifyStake was called with correct parameters
            expect(mockStakingService.notifyStake).toHaveBeenCalledWith(blockIndex, daysToNanoseconds(days));
            // Verify success toast was shown
            expect(toast.success).toHaveBeenCalledWith('Staked successfully', { id: 'toast-id' });
            // Verify stakes were refreshed
            expect(myStakes.fetch).toHaveBeenCalled();
        });

        it('should handle error response from staking canister', async () => {
            // Create a mock service that returns an error response
            const mockStakingService = {
                notifyStake: vi.fn().mockResolvedValue({ err: 'Invalid stake amount' }) // Returns error response
            };

            // When get() is called, return an object with our mock service
            vi.mocked(get).mockReturnValue({
                staking: mockStakingService
            });

            // Mock the transfer function to return a block index
            vi.mocked(transfer).mockResolvedValue(blockIndex);

            // Call the function we're testing
            await stakeUSDx({ amount, days });

            // Verify error toast was shown with the error message
            expect(toast.error).toHaveBeenCalledWith('Invalid stake amount', { id: 'toast-id' });
            // Verify stakes were not refreshed after error
            expect(myStakes.fetch).not.toHaveBeenCalled();
        });

        it('should handle exceptions during staking', async () => {
            // Create a test error
            const error = new Error('Network error');

            // Mock the transfer function to throw an error
            vi.mocked(transfer).mockRejectedValue(error);

            // Call the function we're testing
            const result = await stakeUSDx({ amount, days });

            // Verify error was logged
            expect(console.error).toHaveBeenCalledWith(error);
            // Verify error toast was shown (with the id)
            expect(toast.error).toHaveBeenCalledWith('Something went wrong while staking.', { id: 'toast-id' });
        });
    });

    describe('toggleAutoStakeRewads', () => {
        beforeEach(() => {
            // Set up mock stakes data before each test
            myStakes.value = [
                {
                    id: BigInt(1),
                    isRewardsAutoStaked: false,
                    stakedReward: 10,
                    stakedAt: '2023-01-01',
                    lastRewardsClaimedAt: '2023-01-01',
                    unlockAt: {
                        remainingDays: 0,
                        date: '2023-02-01'
                    },
                    amount: 100,
                    unclaimedRewards: 5
                },
                {
                    id: BigInt(2),
                    isRewardsAutoStaked: true,
                    stakedReward: 20,
                    stakedAt: '2023-01-01',
                    lastRewardsClaimedAt: '2023-01-01',
                    unlockAt: {
                        remainingDays: 5,
                        date: '2023-02-01'
                    },
                    amount: 200,
                    unclaimedRewards: 0.005
                }
            ];
        });

        it('should enable auto stake rewards', async () => {
            const index = 0; // First stake in the array
            // Create a mock service that returns success
            const mockStakingService = {
                toggleAutoCompound: vi.fn().mockResolvedValue({ ok: true })
            };

            // When get() is called, return an object with our mock service
            vi.mocked(get).mockReturnValue({
                staking: mockStakingService
            });

            // Call the function we're testing
            await toggleAutoStakeRewads(index);

            // Verify loading toast was shown
            expect(toast.loading).toHaveBeenCalledWith('Enabling auto stake rewards..');
            // Verify toggleAutoCompound was called with correct parameters
            expect(mockStakingService.toggleAutoCompound).toHaveBeenCalledWith(BigInt(1), { Enable: null });
            // Verify the stake was updated to show auto-staking is enabled
            expect(myStakes.value[index].isRewardsAutoStaked).toBe(true);
            // Verify success toast was shown
            expect(toast.success).toHaveBeenCalledWith('Auto stake rewards enabled', { id: 'toast-id' });
        });

        it('should disable auto stake rewards', async () => {
            const index = 1; // Second stake in the array
            const mockStakingService = {
                // Ensure mock returns ok: false for disabling
                toggleAutoCompound: vi.fn().mockResolvedValue({ ok: false })
            };

            vi.mocked(get).mockReturnValue({
                staking: mockStakingService
            });

            await toggleAutoStakeRewads(index);

            // Ensure loading toast expectation is correct
            expect(toast.loading).toHaveBeenCalledWith('Disabling auto stake rewards..');
            expect(mockStakingService.toggleAutoCompound).toHaveBeenCalledWith(BigInt(2), { Cancel: null });
            // Ensure state check is correct
            expect(myStakes.value[index].isRewardsAutoStaked).toBe(false);
            expect(toast.success).toHaveBeenCalledWith('Auto stake rewards disabled', { id: 'toast-id' });
        });

        it('should handle error response from backend', async () => {
            const index = 0;
            // Create a mock service that returns an error
            const mockStakingService = {
                toggleAutoCompound: vi.fn().mockResolvedValue({ err: 'Operation failed' })
            };

            // When get() is called, return an object with our mock service
            vi.mocked(get).mockReturnValue({
                staking: mockStakingService
            });

            // Call the function we're testing
            await toggleAutoStakeRewads(index);

            // Verify error toast was shown with the error message
            expect(toast.error).toHaveBeenCalledWith('Operation failed', { id: 'toast-id' });
            // Verify the stake was not changed after error
            expect(myStakes.value[index].isRewardsAutoStaked).toBe(false);
        });

        it('should handle exceptions', async () => {
            const index = 0;
            // Create a test error
            const error = new Error('Network error');
            // Create a mock service that throws an error
            const mockStakingService = {
                toggleAutoCompound: vi.fn().mockRejectedValue(error)
            };

            // When get() is called, return an object with our mock service
            vi.mocked(get).mockReturnValue({
                staking: mockStakingService
            });

            // Call the function we're testing
            await toggleAutoStakeRewads(index);

            // Verify error was logged
            expect(console.error).toHaveBeenCalledWith(error);
            // Verify error toast was shown
            expect(toast.error).toHaveBeenCalledWith('Something went wrong while toggling auto stake rewards.', { id: 'toast-id' });
        });
    });

    describe('stakeUnclaimedRewards', () => {
        beforeEach(() => {
            // Set up mock stakes data before each test
            myStakes.value = [
                {
                    id: BigInt(1),
                    unclaimedRewards: 5,
                    stakedReward: 10,
                    stakedAt: '2023-01-01',
                    lastRewardsClaimedAt: '2023-01-01',
                    unlockAt: {
                        remainingDays: 0,
                        date: '2023-02-01'
                    },
                    amount: 100,
                    isRewardsAutoStaked: false
                },
                {
                    id: BigInt(2),
                    unclaimedRewards: 0.005,
                    stakedReward: 20,
                    stakedAt: '2023-01-01',
                    lastRewardsClaimedAt: '2023-01-01',
                    unlockAt: {
                        remainingDays: 5,
                        date: '2023-02-01'
                    },
                    amount: 200,
                    isRewardsAutoStaked: true
                }
            ];
        });

        it('should stake unclaimed rewards successfully', async () => {
            const index = 0;
            // Create a mock service that returns success
            const mockStakingService = {
                manuallyCompoundRewards: vi.fn().mockResolvedValue({ ok: true })
            };

            // When get() is called, return an object with our mock service
            vi.mocked(get).mockReturnValue({
                staking: mockStakingService
            });

            // Call the function we're testing
            await stakeUnclaimedRewards(index);

            // Verify loading toast was shown
            expect(toast.loading).toHaveBeenCalledWith('Staking rewards..');
            // Verify manuallyCompoundRewards was called with correct stake ID
            expect(mockStakingService.manuallyCompoundRewards).toHaveBeenCalledWith(BigInt(1));
            // Verify the staked reward amount was increased by the unclaimed amount
            expect(myStakes.value[index].stakedReward).toBe(15); // 10 + 5
            // Verify unclaimed rewards were reset to 0
            expect(myStakes.value[index].unclaimedRewards).toBe(0);
            // Verify success toast was shown
            expect(toast.success).toHaveBeenCalledWith('Staked rewards successfully', { id: 'toast-id' });
        });

        it('should not stake rewards less than 0.01', async () => {
            const index = 1;
            // Create a mock service
            const mockStakingService = {
                manuallyCompoundRewards: vi.fn()
            };

            // When get() is called, return an object with our mock service
            vi.mocked(get).mockReturnValue({
                staking: mockStakingService
            });

            // Call the function we're testing
            await stakeUnclaimedRewards(index);

            // Verify info toast was shown explaining the minimum
            expect(toast.info).toHaveBeenCalledWith('Can not stake rewards less than 0.01 USDx');
            // Verify manuallyCompoundRewards was not called
            expect(mockStakingService.manuallyCompoundRewards).not.toHaveBeenCalled();
            // Verify the stake data was not changed
            expect(myStakes.value[index].stakedReward).toBe(20); // Unchanged
            expect(myStakes.value[index].unclaimedRewards).toBe(0.005); // Unchanged
        });

        it('should handle error response from backend', async () => {
            const index = 0;
            // Create a mock service that returns an error
            const mockStakingService = {
                manuallyCompoundRewards: vi.fn().mockResolvedValue({ err: 'Operation failed' })
            };

            // When get() is called, return an object with our mock service
            vi.mocked(get).mockReturnValue({
                staking: mockStakingService
            });

            // Call the function we're testing
            await stakeUnclaimedRewards(index);

            // Verify error toast was shown with the error message
            expect(toast.error).toHaveBeenCalledWith('Operation failed', { id: 'toast-id' });
            // Verify the stake data was not changed after error
            expect(myStakes.value[index].stakedReward).toBe(10); // Unchanged
            expect(myStakes.value[index].unclaimedRewards).toBe(5); // Unchanged
        });

        it('should handle exceptions', async () => {
            const index = 0;
            // Create a test error
            const error = new Error('Network error');
            // Create a mock service that throws an error
            const mockStakingService = {
                manuallyCompoundRewards: vi.fn().mockRejectedValue(error)
            };

            // When get() is called, return an object with our mock service
            vi.mocked(get).mockReturnValue({
                staking: mockStakingService
            });

            // Call the function we're testing
            await stakeUnclaimedRewards(index);

            // Verify error was logged
            expect(console.error).toHaveBeenCalledWith(error);
            // Verify error toast was shown
            expect(toast.error).toHaveBeenCalledWith('Something went wrong while staking unclaimed rewards.', { id: 'toast-id' });
        });
    });

    describe('unstake', () => {
        beforeEach(() => {
            // Set up mock stakes data before each test
            myStakes.value = [
                {
                    id: BigInt(1),
                    amount: 100,
                    unlockAt: {
                        remainingDays: 0,
                        date: '2023-02-01'
                    },
                    stakedReward: 10,
                    stakedAt: '2023-01-01',
                    lastRewardsClaimedAt: '2023-01-01',
                    unclaimedRewards: 5,
                    isRewardsAutoStaked: false
                },
                {
                    id: BigInt(2),
                    amount: 200,
                    unlockAt: {
                        remainingDays: 5,
                        date: '2023-02-01'
                    },
                    stakedReward: 20,
                    stakedAt: '2023-01-01',
                    lastRewardsClaimedAt: '2023-01-01',
                    unclaimedRewards: 0.005,
                    isRewardsAutoStaked: true
                }
            ];
        });

        it('should unstake successfully when unlock time has passed', async () => {
            const index = 0; // This test uses index 0
            const mockStakingService = {
                unstake: vi.fn().mockResolvedValue({ ok: true })
            };

            vi.mocked(get).mockReturnValue({
                staking: mockStakingService
            });

            // Get the expected amount *before* calling unstake, as it modifies the array
            const expectedAmount = myStakes.value[index].amount;

            await unstake(index);

            // Correct the expected amount in the assertion (should be 100 for index 0)
            expect(toast.loading).toHaveBeenCalledWith(`Unstaking ${expectedAmount} USDx..`);
            expect(mockStakingService.unstake).toHaveBeenCalledWith(BigInt(1)); // ID for index 0 is 1
            expect(myStakes.value.length).toBe(1);
            expect(updateBalance).toHaveBeenCalledWith(USDX_LEDGER_CANISTER_ID);
            expect(toast.success).toHaveBeenCalledWith('Unstaked successfully', { id: 'toast-id' });
        });

        it('should not allow unstaking when unlock time has not passed', async () => {
            const index = 1;
            // Create a mock service
            const mockStakingService = {
                unstake: vi.fn()
            };

            // When get() is called, return an object with our mock service
            vi.mocked(get).mockReturnValue({
                staking: mockStakingService
            });

            // Call the function we're testing
            await unstake(index);

            // Verify info toast was shown with remaining days
            expect(toast.info).toHaveBeenCalledWith('5 days left to unstake');
            // Verify unstake was not called
            expect(mockStakingService.unstake).not.toHaveBeenCalled();
            // Verify stakes array was not changed
            expect(myStakes.value.length).toBe(2);
        });

        it('should handle error response from backend', async () => {
            const index = 0;
            // Create a mock service that returns an error
            const mockStakingService = {
                unstake: vi.fn().mockResolvedValue({ err: 'Operation failed' })
            };

            // When get() is called, return an object with our mock service
            vi.mocked(get).mockReturnValue({
                staking: mockStakingService
            });

            // Call the function we're testing
            await unstake(index);

            // Verify error toast was shown with the error message
            expect(toast.error).toHaveBeenCalledWith('Operation failed', { id: 'toast-id' });
            // Verify stakes array was not changed after error
            expect(myStakes.value.length).toBe(2);
        });

        it('should handle exceptions', async () => {
            const index = 0;
            // Create a test error
            const error = new Error('Network error');
            // Create a mock service that throws an error
            const mockStakingService = {
                unstake: vi.fn().mockRejectedValue(error)
            };

            // When get() is called, return an object with our mock service
            vi.mocked(get).mockReturnValue({
                staking: mockStakingService
            });

            // Call the function we're testing
            await unstake(index);

            // Verify error was logged
            expect(console.error).toHaveBeenCalledWith(error);
            // Verify error toast was shown
            expect(toast.error).toHaveBeenCalledWith('Something went wrong while unstaking.', { id: 'toast-id' });
        });
    });
});