import type { StakePrams } from '$lib/types/staking';
import { setStakingPoolDetails } from '@states/staking.svelte';
import { authStore } from '@stores/auth.store';
import { toast } from 'svelte-sonner';
import { get } from 'svelte/store';
import { transfer } from './icrc.service';
import { to6Decimals } from '@utils/decimals.utils';
import { STAKING_ACCOUNT } from '@constants/staking.constants';
import { daysToNanoseconds } from '@utils/date-time.utils';
import { balanceStore } from '@stores/balance.store';
import { myStakes } from '@states/my-stakes.svelte';
import type { AutoCompoundAction } from '@declarations/staking_canister/staking_canister.did';

export const fetchStakingPoolDetails = async () => {
	try {
		const { getPoolData } = get(authStore).staking;

		const poolDetails = await getPoolData();

		setStakingPoolDetails(poolDetails);
	} catch (error) {
		console.error(error);
		toast.error('Something went wrong while fetching staking pool details.');
	}
};

let toastId: string | number;

export const stakeUSDx = async ({ amount, days }: StakePrams) => {
	try {
		toastId = toast.loading('Transfering USDx to staking canister...', { id: toastId });

		const blockIndex = await transfer({
			token: 'USDx',
			amount: to6Decimals(amount),
			to: STAKING_ACCOUNT
		});

		toastId = toast.loading('Notifying staking canister...', { id: toastId });

		const { notifyStake } = get(authStore).staking;
		balanceStore.updateUsdxBalance();

		const daysNano = daysToNanoseconds(days);

		const response = await notifyStake(blockIndex, daysNano);

		if ('ok' in response) {
			toastId = toast.success('Staked successfully', { id: toastId });
			myStakes.fetch();
		} else {
			toastId = toast.error(response.err, { id: toastId });
		}
	} catch (error) {
		console.error(error);
		toastId = toast.error('Something went wrong while staking.');
	}
};

export const toggleAutoStakeRewads = async (index: number) => {
	try {
		const stake = myStakes.value[index];

		toastId = toast.loading(
			stake.isRewardsAutoStaked
				? 'Disabling auto stake rewards..'
				: 'Enabling auto stake rewards..',
			{
				id: toastId
			}
		);

		const autoStakeAction: AutoCompoundAction = stake.isRewardsAutoStaked
			? { Cancel: null }
			: { Enable: null };

		const { toggleAutoCompound } = get(authStore).staking;

		const response = await toggleAutoCompound(stake.id, autoStakeAction);

		if ('ok' in response) {
			myStakes.value[index].isRewardsAutoStaked = response.ok;
			toast.success(response.ok ? 'Auto stake rewards enabled' : 'Auto stake rewards disabled', {
				id: toastId
			});
		} else {
			toast.error(response.err, { id: toastId });
		}
	} catch (error) {
		console.error(error);
		toastId = toast.error('Something went wrong while toggling auto stake rewards.', {
			id: toastId
		});
	}
};
