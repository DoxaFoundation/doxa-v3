export const idlFactory = ({ IDL }) => {
  const StakeId = IDL.Nat;
  const StakeMatric = IDL.Record({
    'apy' : IDL.Float64,
    'lockDuration' : IDL.Int,
    'stakeId' : StakeId,
    'totalFeeCollected' : IDL.Nat,
    'finalReward' : IDL.Float64,
    'proportion' : IDL.Float64,
    'bootstrapMultiplier' : IDL.Float64,
    'lockupWeight' : IDL.Int,
    'totalWeight' : IDL.Float64,
    'userWeight' : IDL.Float64,
  });
  const Result_4 = IDL.Variant({ 'ok' : StakeMatric, 'err' : IDL.Text });
  const Result_3 = IDL.Variant({ 'ok' : IDL.Float64, 'err' : IDL.Text });
  const Result_2 = IDL.Variant({ 'ok' : IDL.Nat, 'err' : IDL.Text });
  const Time = IDL.Int;
  const StakingPool = IDL.Record({
    'startTime' : Time,
    'minimumStake' : IDL.Nat,
    'lockDuration' : IDL.Nat,
    'stakingToken' : IDL.Text,
    'rewardToken' : IDL.Text,
    'endTime' : Time,
    'name' : IDL.Text,
    'rewardSymbol' : IDL.Text,
    'stakingSymbol' : IDL.Text,
    'totalRewardPerSecond' : IDL.Nat,
    'rewardTokenFee' : IDL.Float64,
    'totalStaked' : IDL.Nat,
  });
  const Tokens = IDL.Variant({ 'USDx' : IDL.Null });
  const Account = IDL.Record({
    'owner' : IDL.Principal,
    'subaccount' : IDL.Opt(IDL.Vec(IDL.Nat8)),
  });
  const Transaction = IDL.Record({
    'to' : IDL.Principal,
    'method' : IDL.Text,
    'from' : IDL.Principal,
    'time' : Time,
    'amount' : IDL.Nat,
  });
  const Result_1 = IDL.Variant({ 'ok' : Transaction, 'err' : IDL.Text });
  const Stake = IDL.Record({
    'id' : StakeId,
    'staker' : IDL.Principal,
    'lockEndTime' : IDL.Int,
    'lastHarvestTime' : IDL.Int,
    'stakeTime' : IDL.Int,
    'amount' : IDL.Nat,
  });
  const Result = IDL.Variant({ 'ok' : IDL.Null, 'err' : IDL.Text });
  const DoxaStaking = IDL.Service({
    'calculateUserStakeMatric' : IDL.Func(
        [StakeId, IDL.Principal],
        [Result_4],
        [],
      ),
    'calculateUserWeeklyStakeWeight' : IDL.Func([StakeId], [Result_3], []),
    'getBootstrapMultiplier' : IDL.Func([], [Result_3], []),
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
    'getFeeCollectorBalance' : IDL.Func([], [IDL.Nat], []),
    'getLastProcessedTxId' : IDL.Func([], [IDL.Nat], ['query']),
    'getLockupWeight' : IDL.Func([IDL.Nat], [Result_2], []),
    'getPoolData' : IDL.Func([], [StakingPool], []),
    'getStakingAccount' : IDL.Func([Tokens], [Account], []),
    'getTotalFeeCollected' : IDL.Func([], [IDL.Nat], []),
    'getTotalFeeCollectedAmount' : IDL.Func([], [IDL.Nat], ['query']),
    'getTransactionFromBlockIndex' : IDL.Func([IDL.Nat], [Result_1], []),
    'getUserStakeDetails' : IDL.Func([], [IDL.Vec(Stake)], ['query']),
    'getUserTransactions' : IDL.Func([], [IDL.Vec(Transaction)], []),
    'notifyStake' : IDL.Func([IDL.Nat, IDL.Nat], [Result], []),
    'unstake' : IDL.Func([StakeId], [Result], []),
  });
  return DoxaStaking;
};
export const init = ({ IDL }) => { return []; };
