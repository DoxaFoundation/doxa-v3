import type { FeeCollected, SetFeeCollected } from '$lib/types/states';
import { DIVISOR } from '@constants/app.constants';

export const feeCollected: FeeCollected = $state({
	total: 0,
	fromLastRewardDistribution: 0,
	set(val: SetFeeCollected) {
		this.total = Number(val.total) / DIVISOR; // convert back to decimal
		this.fromLastRewardDistribution = Number(val.fromLastRewardDistribution) / DIVISOR;
	}
});
