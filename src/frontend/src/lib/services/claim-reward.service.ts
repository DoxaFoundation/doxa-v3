import type { Stake } from '$lib/types/staking';
import type { ResultSuccess } from '$lib/types/utils';
import { USDX_LEDGER_CANISTER_ID } from '@constants/app.constants';
import { updateBalance } from '@states/ledger-balance.svelte';
import { myStakes } from '@states/my-stakes.svelte';
import { authStore } from '@stores/auth.store';
import { toast } from 'svelte-sonner';
import { get } from 'svelte/store';

export const claimReward = async (stake: Stake): Promise<ResultSuccess> => {
	let currentToastId: string | number | undefined = undefined;

	try {
		if (stake.unclaimedRewards <= 0) {
			toast.info('No reward to claim');
			return { success: true };
		}

		currentToastId = toast.loading(`Claiming ${stake.unclaimedRewards} USDx...`);

		const { harvestReward } = get(authStore).staking;

		const response = await harvestReward(stake.id);

		if ('ok' in response) {
			toast.success(`Claimed ${stake.unclaimedRewards} USDx`, { id: currentToastId });
			myStakes.fetch();
			updateBalance(USDX_LEDGER_CANISTER_ID);
		} else {
			toast.error(`Failed to claim reward: ${response.err}`, { id: currentToastId });
		}

		return { success: true };
	} catch (error) {
		console.error(error);
		toast.error('Something went wrong while claiming reward.', { id: currentToastId });
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
