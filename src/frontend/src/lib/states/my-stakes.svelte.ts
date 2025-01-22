import type { Stake } from '$lib/types/staking';
import type { MyStakesState } from '$lib/types/states';
import type { QueryStakes } from '@declarations/staking_canister/staking_canister.did';
import { authStore } from '@stores/auth.store';
import {
	formatBigIntNanoSecTimestamp,
	formatTimestampWithDaysFromNow
} from '@utils/date-time.utils';
import { from6Decimals } from '@utils/decimals.utils';
import { toast } from 'svelte-sonner';
import { get } from 'svelte/store';

export const myStakes: MyStakesState = $state({
	value: [],
	fetch: async () => {
		try {
			const { getUserStakes } = get(authStore).staking;
			const stakes = await getUserStakes();
			myStakes.value = transformStates(stakes);
		} catch (error) {
			console.error(error);
			toast.error('Something went wrong while fetching stakes.');
		}
	}
});

const transformStates = (stakes: QueryStakes): Array<Stake> =>
	stakes.map((stake) => ({
		id: stake.id,
		stakedReward: from6Decimals(stake.stakedReward),
		stakedAt: formatBigIntNanoSecTimestamp(stake.stakedAt),
		lastRewardsClaimedAt: formatBigIntNanoSecTimestamp(stake.lastRewardsClaimedAt),
		unlockAt: formatTimestampWithDaysFromNow(stake.unlockAt),
		unclaimedRewards: from6Decimals(stake.unclaimedRewards),
		amount: from6Decimals(stake.amount),
		isRewardsAutoStaked: stake.isRewardsAutoStaked
	}));
