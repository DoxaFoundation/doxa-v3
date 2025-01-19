import type { StakingPoolDetailsState } from '$lib/types/states';
import { DIVISOR } from '@constants/app.constants';
import type { StakingPoolDetails } from '@declarations/staking_canister/staking_canister.did';

export const stakingPoolDetails: StakingPoolDetailsState = $state({
	stakingTokenSymbol: '',
	rewardTokenSymbol: '',
	minimumStakeAmount: 0,
	totalFeeCollected: 0,
	stakeLockDuration: 0,
	poolEndTime: 0,
	minimumTotalStake: 0,
	rewardTokenCanisterId: '',
	poolStartTime: 0,
	poolName: '',
	stakingTokenName: '',
	totalTokensStaked: 0,
	noOfStakers: 0
});

export const setStakingPoolDetails = ({
	stakingTokenSymbol,
	rewardTokenSymbol,
	minimumStakeAmount,
	totalFeeCollected,
	stakeLockDuration,
	poolEndTime,
	minimumTotalStake,
	rewardTokenCanisterId,
	poolStartTime,
	poolName,
	stakingTokenName,
	totalTokensStaked,
	noOfStakers
}: StakingPoolDetails) => {
	stakingPoolDetails.stakingTokenSymbol = stakingTokenSymbol;
	stakingPoolDetails.rewardTokenSymbol = rewardTokenSymbol;
	stakingPoolDetails.minimumStakeAmount = Number(minimumStakeAmount);
	stakingPoolDetails.totalFeeCollected = Number(totalFeeCollected);
	stakingPoolDetails.stakeLockDuration = Number(stakeLockDuration);
	stakingPoolDetails.poolEndTime = Number(poolEndTime);
	stakingPoolDetails.minimumTotalStake = Number(minimumTotalStake);
	stakingPoolDetails.rewardTokenCanisterId = rewardTokenCanisterId;
	stakingPoolDetails.poolStartTime = Number(poolStartTime);
	stakingPoolDetails.poolName = poolName;
	stakingPoolDetails.stakingTokenName = stakingTokenName;
	stakingPoolDetails.totalTokensStaked = Number(totalTokensStaked) / DIVISOR;
	stakingPoolDetails.noOfStakers = Number(noOfStakers);
};
