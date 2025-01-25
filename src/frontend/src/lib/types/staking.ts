export interface StakePrams {
	amount: number;
	days: number;
}

export interface Stake {
	id: bigint;
	stakedReward: number;
	stakedAt: string;
	lastRewardsClaimedAt: string;
	unlockAt: DateWithRemainingDays;
	unclaimedRewards: number;
	amount: number;
	isRewardsAutoStaked: boolean;
}

export interface DateWithRemainingDays {
	date: string;
	remainingDays: number;
}
