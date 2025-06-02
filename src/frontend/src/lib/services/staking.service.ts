import type { StakePrams } from '$lib/types/staking';
import { setStakingPoolDetails } from '@states/staking.svelte';
import { authStore } from '@stores/auth.store';
import { toast } from 'svelte-sonner';
import { get } from 'svelte/store';
import { to6Decimals } from '@utils/decimals.utils';
import { STAKING_ACCOUNT } from '@constants/staking.constants';
import { daysToNanoseconds } from '@utils/date-time.utils';
import { myStakes } from '@states/my-stakes.svelte';
import type { AutoCompoundAction } from '@declarations/staking_canister/staking_canister.did';
import { updateBalance } from '@states/ledger-balance.svelte';
import { DUSD_LEDGER_CANISTER_ID } from '@constants/app.constants';
import { transfer } from '$lib/api/icrc.ledger.api';

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

export const stakeDUSD = async ({ amount, days }: StakePrams) => {
	try {
		toastId = toast.loading('Transfering DUSD to staking canister...', { id: toastId });

		const transferResponse = await transfer({
			canisterId: DUSD_LEDGER_CANISTER_ID,
			amount: to6Decimals(amount),
			to: STAKING_ACCOUNT
		});
		if ('Ok' in transferResponse) {
			toastId = toast.loading('Notifying staking canister...', { id: toastId });

			const { notifyStake } = get(authStore).staking;
			updateBalance(DUSD_LEDGER_CANISTER_ID);

			const daysNano = daysToNanoseconds(days);

			const response = await notifyStake(transferResponse.Ok, daysNano);

			if ('ok' in response) {
				toastId = toast.success('Staked successfully', { id: toastId });
				myStakes.fetch();
			} else {
				toastId = toast.error(response.err, { id: toastId });
			}
		} else {
			toastId = toast.error(transferResponse.Err.toString(), { id: toastId });
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

export const stakeUnclaimedRewards = async (index: number) => {
	try {
		const stake = myStakes.value[index];

		if (stake.unclaimedRewards <= 0.01) {
			toast.info('Can not stake rewards less than 0.01 DUSD');
			return;
		}

		toastId = toast.loading('Staking rewards..', { id: toastId });

		const { manuallyCompoundRewards } = get(authStore).staking;

		const response = await manuallyCompoundRewards(stake.id);

		if ('ok' in response) {
			myStakes.value[index].stakedReward += myStakes.value[index].unclaimedRewards;
			myStakes.value[index].unclaimedRewards = 0;

			toast.success('Staked rewards successfully', { id: toastId });
		} else {
			toast.error(response.err, { id: toastId });
		}
	} catch (error) {
		console.error(error);
		toastId = toast.error('Something went wrong while staking unclaimed rewards.', {
			id: toastId
		});
	}
};

export const unstake = async (index: number) => {
	try {
		const stake = myStakes.value[index];

		if (stake.unlockAt.remainingDays > 0) {
			toast.info(`${stake.unlockAt.remainingDays} days left to unstake`);
			return;
		}
		toastId = toast.loading(`Unstaking ${stake.amount} DUSD..`, { id: toastId });
		const { unstake } = get(authStore).staking;
		const response = await unstake(stake.id);

		if ('ok' in response) {
			myStakes.value.splice(index, 1);
			toastId = toast.success('Unstaked successfully', { id: toastId });
			updateBalance(DUSD_LEDGER_CANISTER_ID);
		} else {
			toastId = toast.error(response.err, { id: toastId });
		}
	} catch (error) {
		console.error(error);
		toastId = toast.error('Something went wrong while unstaking.', { id: toastId });
	}
};
