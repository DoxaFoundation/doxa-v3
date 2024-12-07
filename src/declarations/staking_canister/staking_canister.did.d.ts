import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface Account {
  'owner' : Principal,
  'subaccount' : [] | [Uint8Array | number[]],
}
export interface DoxaStaking {
  'calculateUserStakeMatric' : ActorMethod<[StakeId, Principal], Result_4>,
  'calculateUserWeeklyStakeWeight' : ActorMethod<[StakeId], Result_3>,
  'getBootstrapMultiplier' : ActorMethod<[], Result_3>,
  'getBootstrapStatus' : ActorMethod<
    [],
    { 'isBootstrapPhase' : boolean, 'timeRemaining' : bigint }
  >,
  'getFeeCollectorBalance' : ActorMethod<[], bigint>,
  'getLastProcessedTxId' : ActorMethod<[], bigint>,
  'getLockupWeight' : ActorMethod<[bigint], Result_2>,
  'getPoolData' : ActorMethod<[], StakingPool>,
  'getStakingAccount' : ActorMethod<[Tokens], Account>,
  'getTotalFeeCollected' : ActorMethod<[], bigint>,
  'getTotalFeeCollectedAmount' : ActorMethod<[], bigint>,
  'getTransactionFromBlockIndex' : ActorMethod<[bigint], Result_1>,
  'getUserStakeDetails' : ActorMethod<[], Array<Stake>>,
  'getUserTransactions' : ActorMethod<[], Array<Transaction>>,
  'notifyStake' : ActorMethod<[bigint, bigint], Result>,
  'unstake' : ActorMethod<[StakeId], Result>,
}
export type Result = { 'ok' : null } |
  { 'err' : string };
export type Result_1 = { 'ok' : Transaction } |
  { 'err' : string };
export type Result_2 = { 'ok' : bigint } |
  { 'err' : string };
export type Result_3 = { 'ok' : number } |
  { 'err' : string };
export type Result_4 = { 'ok' : StakeMatric } |
  { 'err' : string };
export interface Stake {
  'id' : StakeId,
  'staker' : Principal,
  'lockEndTime' : bigint,
  'lastHarvestTime' : bigint,
  'stakeTime' : bigint,
  'amount' : bigint,
}
export type StakeId = bigint;
export interface StakeMatric {
  'apy' : number,
  'lockDuration' : bigint,
  'stakeId' : StakeId,
  'totalFeeCollected' : bigint,
  'finalReward' : number,
  'proportion' : number,
  'bootstrapMultiplier' : number,
  'lockupWeight' : bigint,
  'totalWeight' : number,
  'userWeight' : number,
}
export interface StakingPool {
  'startTime' : Time,
  'minimumStake' : bigint,
  'lockDuration' : bigint,
  'stakingToken' : string,
  'rewardToken' : string,
  'endTime' : Time,
  'name' : string,
  'rewardSymbol' : string,
  'stakingSymbol' : string,
  'totalRewardPerSecond' : bigint,
  'rewardTokenFee' : number,
  'totalStaked' : bigint,
}
export type Time = bigint;
export type Tokens = { 'USDx' : null };
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
