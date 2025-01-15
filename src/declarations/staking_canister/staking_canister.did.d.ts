import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export type AutoCompoundAction = { 'Enable' : null } |
  { 'Cancel' : null };
export interface DoxaStaking {
  'calculateUserStakeMatric' : ActorMethod<[StakeId, Principal], Result_2>,
  'getBootstrapStatus' : ActorMethod<
    [],
    { 'isBootstrapPhase' : boolean, 'timeRemaining' : bigint }
  >,
  'getLastProcessedTxId' : ActorMethod<[], bigint>,
  'getPoolData' : ActorMethod<[], StakingPoolDetails>,
  'getTotalFeeCollectedFromLastRewardDistribution' : ActorMethod<[], bigint>,
  'getTotalFeeCollectedSofar' : ActorMethod<[], bigint>,
  'getUserStakeDetails' : ActorMethod<[], Array<Stake>>,
  'getUserTransactions' : ActorMethod<[], Array<Transaction>>,
  'getWeightTable' : ActorMethod<[], Array<[bigint, bigint]>>,
  'harvestReward' : ActorMethod<[StakeId], Result>,
  'isStakeAutoCompound' : ActorMethod<[StakeId], Result_1>,
  'manuallyCompoundRewards' : ActorMethod<[StakeId], Result>,
  'notifyStake' : ActorMethod<[bigint, bigint], Result>,
  'previewWeightForDuration' : ActorMethod<[bigint], bigint>,
  'toggleAutoCompound' : ActorMethod<[StakeId, AutoCompoundAction], Result_1>,
  'unstake' : ActorMethod<[StakeId], Result>,
}
export type Result = { 'ok' : null } |
  { 'err' : string };
export type Result_1 = { 'ok' : boolean } |
  { 'err' : string };
export type Result_2 = { 'ok' : StakeMetrics } |
  { 'err' : string };
export interface Stake {
  'id' : StakeId,
  'stakedReward' : bigint,
  'staker' : Principal,
  'lockEndTime' : bigint,
  'pendingRewards' : bigint,
  'lastHarvestTime' : bigint,
  'stakeTime' : bigint,
  'amount' : bigint,
}
export type StakeId = bigint;
export interface StakeMetrics {
  'apy' : bigint,
  'stakeId' : StakeId,
  'totalFeeCollected' : bigint,
  'stakeLockPeriod' : bigint,
  'bootstrapMultiplier' : bigint,
  'userFinalReward' : bigint,
  'totalStakeWeight' : bigint,
  'userStakeWeight' : bigint,
  'lockPeriodWeight' : bigint,
  'stakeContributionRatio' : bigint,
}
export interface StakingPoolDetails {
  'stakingTokenSymbol' : string,
  'rewardTokenSymbol' : string,
  'minimumStakeAmount' : bigint,
  'totalFeeCollected' : bigint,
  'stakeLockDuration' : bigint,
  'poolEndTime' : Time,
  'minimumTotalStake' : bigint,
  'rewardTokenCanisterId' : string,
  'poolStartTime' : Time,
  'poolName' : string,
  'stakingTokenName' : string,
  'totalTokensStaked' : bigint,
}
export type Time = bigint;
export interface Transaction {
  'to' : Principal,
  'method' : string,
  'from' : Principal,
  'time' : Time,
  'amount' : bigint,
}
export interface _SERVICE extends DoxaStaking {}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
