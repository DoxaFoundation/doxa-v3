import type { QueryStakes } from '@declarations/staking_canister/staking_canister.did';
import type { Stake } from './staking';

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

// export type MyStakesState = Array<Stake>;

export interface MyStakesState {
	value: Array<Stake>;
	fetch(): Promise<void>;
}
