import { feeCollected } from '@states/fee-collected.svelte';
import { setStakingPoolDetails } from '@states/staking.svelte';
import { authStore } from '@stores/auth.store';
import { toast } from 'svelte-sonner';
import { get } from 'svelte/store';

export const fetchFeecollecteds = async () => {
	try {
		const { getTotalFeeCollectedSofar, getTotalFeeCollectedFromLastRewardDistribution } =
			get(authStore).staking;

		const [total, fromLastRewardDistribution] = await Promise.all([
			getTotalFeeCollectedSofar(),
			getTotalFeeCollectedFromLastRewardDistribution()
		]);

		feeCollected.set({ total, fromLastRewardDistribution });
	} catch (error) {
		console.error(error);
		toast.error('Something went wrong while fetching staking pool details.');
	}
};
