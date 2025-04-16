/**
 * @fileoverview
 * This file contains tests for the claim reward service functions defined in `claim-reward.service.ts`.
 * 
 * Purpose:
 * - Tests functionality for claiming staking rewards from the platform
 * - Validates reward claiming for single stake positions
 * - Tests bulk claiming of rewards across multiple stake positions
 * - Verifies proper handling of stakes with zero rewards
 * - Ensures correct response handling from backend services
 * - Tests error handling during the claiming process
 * - Validates UI feedback through toast notifications
 * - Confirms balance updates are triggered after successful claims
 * - Tests filtering of stakes for claiming based on their unclaimed amount
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { claimReward, claimAllRewards } from './claim-reward.service';
import { myStakes } from '@states/my-stakes.svelte';
import { authStore } from '@stores/auth.store';
import { toast } from 'svelte-sonner';
import { get } from 'svelte/store';
import { updateBalance } from '@states/ledger-balance.svelte';
import { USDX_LEDGER_CANISTER_ID } from '@constants/app.constants';
import type { Stake } from '$lib/types/staking';

/*
Ye test file claim-reward service ke functions ko test karne ke liye hai. Main kuch explain karta hu:

1. Mocks Setup:
- Hum different dependencies ko mock kar rahe hain jaise:
  - my-stakes store 
  - auth store
  - toast notifications
  - ledger balance updates

2. Test Cases:

A. Single Reward Claim (claimReward function):

- Agar koi unclaimed rewards nahi hai (0 hai):
  -> "No reward to claim" toast dikhega
  -> Backend call nahi hogi

- Successful claim ka case:
  -> Loading toast dikhega "Claiming 100 USDx..."  
  -> Backend call hogi stake ID ke sath
  -> Success toast dikhega "Claimed 100 USDx"
  -> Balance update hoga
  -> Stakes refresh honge

- Backend error ka case:
  -> Error toast dikhega
  -> Balance update nahi hoga
  -> Stakes refresh nahi honge

- Exception ka case:
  -> Generic error toast dikhega
  -> Error object return hoga

B. Bulk Reward Claims (claimAllRewards function):

- Multiple stakes ke case mein:
  -> Sirf un stakes ke liye claim hoga jinme unclaimed amount hai
  -> Zero unclaimed wale skip ho jayenge

- Zero unclaimed stakes ka case:
  -> Koi backend call nahi hogi

Error Fixes:

1. mockStake object mein ye properties add karni hongi:
   stakedReward, stakedAt, lastRewardsClaimedAt, unlockAt

2. get.mockReturnValue ki jagah:
   vi.mocked(get).mockReturnValue use karein

3. myStakes.value ke liye proper Stake type ka data use karein with all required fields
*/

// Mock dependencies
vi.mock('@states/my-stakes.svelte', () => ({
    myStakes: {
        value: [],
        fetch: vi.fn()
    }
}));

vi.mock('@stores/auth.store', () => ({
    authStore: {
        subscribe: vi.fn()
    }
}));

vi.mock('svelte/store', () => ({
    get: vi.fn()
}));

vi.mock('@states/ledger-balance.svelte', () => ({
    updateBalance: vi.fn()
}));

vi.mock('svelte-sonner', () => ({
    toast: {
        loading: vi.fn().mockReturnValue('toast-id'),
        success: vi.fn().mockReturnValue('toast-id'),
        error: vi.fn().mockReturnValue('toast-id'),
        info: vi.fn()
    }
}));

describe('claim-reward.service', () => {
    const mockStake: Stake = {
        id: BigInt(123),
        unclaimedRewards: 100,
        stakedReward: 1000,
        amount: 1000,
        stakedAt: '2023-01-01',
        lastRewardsClaimedAt: '2023-01-01',
        unlockAt: { date: '2024-01-01', remainingDays: 100 },
        isRewardsAutoStaked: false,
    };

    const mockStakingService = {
        harvestReward: vi.fn()
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(get).mockReturnValue({
            staking: mockStakingService
        });
    });
    describe('claimReward', () => {
        it('should show info toast if no rewards to claim', async () => {
            const stakeWithNoRewards: Stake = {
                ...mockStake,
                unclaimedRewards: 0,
            };
            const result = await claimReward(stakeWithNoRewards);

            expect(toast.info).toHaveBeenCalledWith('No reward to claim');
            expect(mockStakingService.harvestReward).not.toHaveBeenCalled();
            expect(result.success).toBe(true);
        });

        it('should successfully claim rewards', async () => {
            mockStakingService.harvestReward.mockResolvedValue({ ok: true });

            const completeStake: Stake = {
                ...mockStake,
            };
            const result = await claimReward(completeStake);

            expect(toast.loading).toHaveBeenCalledWith(`Claiming ${completeStake.unclaimedRewards} USDx...`);
            expect(mockStakingService.harvestReward).toHaveBeenCalledWith(completeStake.id);
            expect(toast.success).toHaveBeenCalledWith(`Claimed ${completeStake.unclaimedRewards} USDx`, { id: 'toast-id' });
            expect(myStakes.fetch).toHaveBeenCalled();
            expect(updateBalance).toHaveBeenCalledWith(USDX_LEDGER_CANISTER_ID);
            expect(result.success).toBe(true);
        });

        it('should handle error response from backend', async () => {
            mockStakingService.harvestReward.mockResolvedValue({ err: 'Some error' });

            const completeStake: Stake = {
                ...mockStake,
            };
            const result = await claimReward(completeStake);

            expect(toast.loading).toHaveBeenCalledWith(`Claiming ${completeStake.unclaimedRewards} USDx...`);
            expect(mockStakingService.harvestReward).toHaveBeenCalledWith(completeStake.id);
            expect(toast.error).toHaveBeenCalledWith(`Failed to claim reward: Some error`, { id: 'toast-id' });
            expect(myStakes.fetch).not.toHaveBeenCalled();
            expect(updateBalance).not.toHaveBeenCalled();
            expect(result.success).toBe(true);
        });

        it('should handle exceptions', async () => {
            const error = new Error('Test error');
            mockStakingService.harvestReward.mockRejectedValue(error);

            const completeStake: Stake = {
                ...mockStake,
            };
            const result = await claimReward(completeStake);

            expect(toast.error).toHaveBeenCalledWith('Something went wrong while claiming reward.', { id: 'toast-id' });
            expect(result).toEqual({ success: false, err: error });
        });
    });

    describe('claimAllRewards', () => {
        it('should claim rewards for all stakes with unclaimed rewards', async () => {
            const stakes: Stake[] = [
                { ...mockStake, id: BigInt(1), unclaimedRewards: 100 },
                { ...mockStake, id: BigInt(2), unclaimedRewards: 0 },
                { ...mockStake, id: BigInt(3), unclaimedRewards: 200 }
            ];

            (myStakes as any).value = stakes;
            mockStakingService.harvestReward.mockResolvedValue({ ok: true });

            await claimAllRewards();

            expect(mockStakingService.harvestReward).toHaveBeenCalledTimes(2);
            expect(mockStakingService.harvestReward).toHaveBeenCalledWith(BigInt(1));
            expect(mockStakingService.harvestReward).toHaveBeenCalledWith(BigInt(3));
            expect(mockStakingService.harvestReward).not.toHaveBeenCalledWith(BigInt(2));
        });

        it('should not try to claim rewards if there are no stakes with unclaimed rewards', async () => {
            const stakes: Stake[] = [
                { ...mockStake, id: BigInt(1), unclaimedRewards: 0 },
                { ...mockStake, id: BigInt(2), unclaimedRewards: 0 }
            ];

            (myStakes as any).value = stakes;

            await claimAllRewards();

            expect(mockStakingService.harvestReward).not.toHaveBeenCalled();
        });
    });
});