import type { Stake } from '$lib/types/staking';
import type { ResultSuccess } from '$lib/types/utils';
import { USDX_LEDGER_CANISTER_ID } from '@constants/app.constants';
import { updateBalance } from '@states/ledger-balance.svelte';
import { myStakes } from '@states/my-stakes.svelte';
import { authStore } from '@stores/auth.store';
import { toast } from 'svelte-sonner';
import { get } from 'svelte/store';

let toastId: string | number;

export const claimReward = async (stake: Stake): Promise<ResultSuccess> => {
	try {
		if (stake.unclaimedRewards <= 0) {
			toast.info('No reward to claim');
		}
		toastId = toast.loading(`Claiming ${stake.unclaimedRewards} USDx...`, { id: toastId });
		const { harvestReward } = get(authStore).staking;

		const response = await harvestReward(stake.id);

		if ('ok' in response) {
			toastId = toast.success(`Claimed ${stake.unclaimedRewards} USDx`, { id: toastId });
			myStakes.fetch();
			updateBalance(USDX_LEDGER_CANISTER_ID);
		} else {
			toastId = toast.error(`Failed to claim reward: ${response.err}`, { id: toastId });
		}

		return { success: true };
	} catch (error) {
		console.error(error);
		toastId = toast.error('Something went wrong while claiming reward.', { id: toastId });
		return { success: false, err: error };
	}
};

export const claimAllRewards = async () => {
	for (const stake of myStakes.value) {
		if (stake.unclaimedRewards <= 0) {
			continue;
		}

		await claimReward(stake);
	}
};
