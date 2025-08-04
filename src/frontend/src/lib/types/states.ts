import type { PoolData } from '@declarations/SwapFactory/SwapFactory.did';
import type { Stake } from './staking';
import type { NextTxs, TransformedTransactions } from './transactions';
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

export interface Balance {
	number: number;
	format: string;
}

export type BalancesState = Record<string, Balance>;

export type TokensPriceState = Record<string, number>;

export type SwapPoolDataState = Map<string, PoolData>;

export type TransactionsState = Record<string, TransformedTransactions>;

export type NextTxsState = Record<string, NextTxs>;
