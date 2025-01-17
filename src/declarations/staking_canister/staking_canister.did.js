export const idlFactory = ({ IDL }) => {
  const StakeId = IDL.Nat;
  const StakeMetrics = IDL.Record({
    'apy' : IDL.Nat,
    'stakeId' : StakeId,
    'totalFeeCollected' : IDL.Nat,
    'stakeLockPeriod' : IDL.Int,
    'bootstrapMultiplier' : IDL.Nat,
    'userFinalReward' : IDL.Nat,
    'totalStakeWeight' : IDL.Nat,
    'userStakeWeight' : IDL.Nat,
    'lockPeriodWeight' : IDL.Int,
    'stakeContributionRatio' : IDL.Nat,
  });
  const Result_2 = IDL.Variant({ 'ok' : StakeMetrics, 'err' : IDL.Text });
  const Time = IDL.Int;
  const StakingPoolDetails = IDL.Record({
    'stakingTokenSymbol' : IDL.Text,
    'rewardTokenSymbol' : IDL.Text,
    'minimumStakeAmount' : IDL.Nat,
    'totalFeeCollected' : IDL.Nat,
    'stakeLockDuration' : IDL.Nat,
    'poolEndTime' : Time,
    'minimumTotalStake' : IDL.Nat,
    'noOfStakers' : IDL.Nat,
    'rewardTokenCanisterId' : IDL.Text,
    'poolStartTime' : Time,
    'poolName' : IDL.Text,
    'stakingTokenName' : IDL.Text,
    'totalTokensStaked' : IDL.Nat,
  });
  const Stake = IDL.Record({
    'id' : StakeId,
    'stakedReward' : IDL.Nat,
    'staker' : IDL.Principal,
    'lockEndTime' : IDL.Int,
    'pendingRewards' : IDL.Nat,
    'lastHarvestTime' : IDL.Int,
    'stakeTime' : IDL.Int,
    'amount' : IDL.Nat,
  });
  const Transaction = IDL.Record({
    'to' : IDL.Principal,
    'method' : IDL.Text,
    'from' : IDL.Principal,
    'time' : Time,
    'amount' : IDL.Nat,
  });
  const Result = IDL.Variant({ 'ok' : IDL.Null, 'err' : IDL.Text });
  const Result_1 = IDL.Variant({ 'ok' : IDL.Bool, 'err' : IDL.Text });
  const AutoCompoundAction = IDL.Variant({
    'Enable' : IDL.Null,
    'Cancel' : IDL.Null,
  });
  const DoxaStaking = IDL.Service({
    'calculateUserStakeMatric' : IDL.Func(
        [StakeId, IDL.Principal],
        [Result_2],
        ['query'],
      ),
    'getBootstrapStatus' : IDL.Func(
        [],
        [
          IDL.Record({
            'isBootstrapPhase' : IDL.Bool,
            'timeRemaining' : IDL.Int,
          }),
        ],
        ['query'],
      ),
    'getLastProcessedTxId' : IDL.Func([], [IDL.Nat], ['query']),
    'getPoolData' : IDL.Func([], [StakingPoolDetails], []),
    'getTotalFeeCollectedFromLastRewardDistribution' : IDL.Func(
        [],
        [IDL.Nat],
        ['query'],
      ),
    'getTotalFeeCollectedSofar' : IDL.Func([], [IDL.Nat], ['query']),
    'getUserStakeDetails' : IDL.Func([], [IDL.Vec(Stake)], ['query']),
    'getUserTransactions' : IDL.Func([], [IDL.Vec(Transaction)], []),
    'getWeightTable' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(IDL.Nat, IDL.Nat))],
        ['query'],
      ),
    'harvestReward' : IDL.Func([StakeId], [Result], []),
    'isStakeAutoCompound' : IDL.Func([StakeId], [Result_1], ['query']),
    'manuallyCompoundRewards' : IDL.Func([StakeId], [Result], []),
    'notifyStake' : IDL.Func([IDL.Nat, IDL.Nat], [Result], []),
    'previewWeightForDuration' : IDL.Func([IDL.Nat], [IDL.Nat], ['query']),
    'toggleAutoCompound' : IDL.Func(
        [StakeId, AutoCompoundAction],
        [Result_1],
        [],
      ),
    'unstake' : IDL.Func([StakeId], [Result], []),
  });
  return DoxaStaking;
};
export const init = ({ IDL }) => { return []; };
