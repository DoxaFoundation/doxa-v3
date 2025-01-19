export interface StakingPoolDetailsState {
	stakingTokenSymbol: string;
	rewardTokenSymbol: string;
	minimumStakeAmount: number;
	totalFeeCollected: number;
	stakeLockDuration: number;
	poolEndTime: number;
	minimumTotalStake: number;
	rewardTokenCanisterId: string;
	poolStartTime: number;
	poolName: string;
	stakingTokenName: string;
	totalTokensStaked: number;
	noOfStakers: number;
}

export interface FeeCollected {
	total: number;
	fromLastRewardDistribution: number;
	set(val: SetFeeCollected): void;
}
export interface SetFeeCollected {
	total: BigInt;
	fromLastRewardDistribution: BigInt;
}
