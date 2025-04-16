import type { StakePrams } from '$lib/types/staking';
import { setStakingPoolDetails } from '@states/staking.svelte';
import { authStore } from '@stores/auth.store';
import { toast } from 'svelte-sonner';
import { get } from 'svelte/store';
import { transfer } from './icrc.service';
import { to6Decimals } from '@utils/decimals.utils';
import { STAKING_ACCOUNT } from '@constants/staking.constants';
import { daysToNanoseconds } from '@utils/date-time.utils';
import { myStakes } from '@states/my-stakes.svelte';
import type { AutoCompoundAction } from '@declarations/staking_canister/staking_canister.did';
import { updateBalance } from '@states/ledger-balance.svelte';
import { USDX_LEDGER_CANISTER_ID } from '@constants/app.constants';

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

export const stakeUSDx = async ({ amount, days }: StakePrams) => {
	let currentToastId: string | number | undefined = undefined;
	try {
		// Store ID from first loading toast
		currentToastId = toast.loading('Transfering USDx to staking canister...');

		const blockIndex = await transfer({
			token: 'USDx',
			amount: to6Decimals(amount),
			to: STAKING_ACCOUNT
		});

		// Update toast using the stored ID
		toast.loading('Notifying staking canister...', { id: currentToastId });

		const { notifyStake } = get(authStore).staking;
		updateBalance(USDX_LEDGER_CANISTER_ID);

		const daysNano = daysToNanoseconds(days);

		const response = await notifyStake(blockIndex, daysNano);

		if ('ok' in response) {
			// Update toast using the stored ID
			toast.success('Staked successfully', { id: currentToastId });
			myStakes.fetch();
		} else {
			// Update toast using the stored ID
			toast.error(response.err, { id: currentToastId });
		}
	} catch (error) {
		console.error(error);
		// Update toast using the stored ID
		toast.error('Something went wrong while staking.', { id: currentToastId });
	}
};

export const toggleAutoStakeRewads = async (index: number) => {
	let currentToastId: string | number | undefined = undefined;
	try {
		const stake = myStakes.value[index];

		// Store loading toast ID
		currentToastId = toast.loading(
			stake.isRewardsAutoStaked
				? 'Disabling auto stake rewards..'
				: 'Enabling auto stake rewards..'
		);

		const autoStakeAction: AutoCompoundAction = stake.isRewardsAutoStaked
			? { Cancel: null }
			: { Enable: null };

		const { toggleAutoCompound } = get(authStore).staking;

		const response = await toggleAutoCompound(stake.id, autoStakeAction);

		if ('ok' in response) {
			myStakes.value[index].isRewardsAutoStaked = response.ok;
			// Update toast using the stored ID
			toast.success(response.ok ? 'Auto stake rewards enabled' : 'Auto stake rewards disabled', {
				id: currentToastId
			});
		} else {
			// Update toast using the stored ID
			toast.error(response.err, { id: currentToastId });
		}
	} catch (error) {
		console.error(error);
		// Update toast using the stored ID
		toast.error('Something went wrong while toggling auto stake rewards.', {
			id: currentToastId
		});
	}
};

export const stakeUnclaimedRewards = async (index: number) => {
	let currentToastId: string | number | undefined = undefined;
	try {
		const stake = myStakes.value[index];

		if (stake.unclaimedRewards <= 0.01) {
			toast.info('Can not stake rewards less than 0.01 USDx');
			return;
		}

		// Store loading toast ID
		currentToastId = toast.loading('Staking rewards..');

		const { manuallyCompoundRewards } = get(authStore).staking;

		const response = await manuallyCompoundRewards(stake.id);

		if ('ok' in response) {
			myStakes.value[index].stakedReward += myStakes.value[index].unclaimedRewards;
			myStakes.value[index].unclaimedRewards = 0;

			// Update toast using the stored ID
			toast.success('Staked rewards successfully', { id: currentToastId });
		} else {
			// Update toast using the stored ID
			toast.error(response.err, { id: currentToastId });
		}
	} catch (error) {
		console.error(error);
		// Update toast using the stored ID
		toast.error('Something went wrong while staking unclaimed rewards.', {
			id: currentToastId
		});
	}
};

export const unstake = async (index: number) => {
	let currentToastId: string | number | undefined = undefined;
	try {
		const stake = myStakes.value[index];

		if (stake.unlockAt.remainingDays > 0) {
			toast.info(`${stake.unlockAt.remainingDays} days left to unstake`);
			return;
		}
		// Store loading toast ID
		currentToastId = toast.loading(`Unstaking ${stake.amount} USDx..`);
		const { unstake } = get(authStore).staking;
		const response = await unstake(stake.id);

		if ('ok' in response) {
			myStakes.value.splice(index, 1);
			// Update toast using the stored ID
			toast.success('Unstaked successfully', { id: currentToastId });
			updateBalance(USDX_LEDGER_CANISTER_ID);
		} else {
			// Update toast using the stored ID
			toast.error(response.err, { id: currentToastId });
		}
	} catch (error) {
		console.error(error);
		// Update toast using the stored ID
		toast.error('Something went wrong while unstaking.', { id: currentToastId });
	}
};
