import Time "mo:base/Time";
import Principal "mo:base/Principal";
import Nat "mo:base/Nat";
import Nat64 "mo:base/Nat64";

module {
	// Staking pool configuration
	public type StakingPool = {
		name : Text; // Pool name
		startTime : Time.Time; // Pool start time
		endTime : Time.Time; // Pool end time
		totalStaked : Nat; // Total tokens staked
		rewardTokenFee : Nat; // Fee for reward withdrawal
		minTotalStake : Nat;
		stakingSymbol : Text; // USDx
		stakingToken : Text; // doxa dollar
		rewardSymbol : Text; // Reward token symbol
		rewardToken : Text; // Reward token canister ID
		minimumStake : Nat; // Minimum stake amount (100,000 tokens with 6 decimals)
		lockDuration : Nat; // Lock duration in seconds
	};

	// Add a unique ID for each stake
	public type StakeId = Nat;

	// Modified Stake type to include ID
	public type Stake = {
		id : StakeId;
		staker : Principal;
		amount : Nat;
		stakeTime : Int;
		lockEndTime : Int;
		lastHarvestTime : Int;
		reward : Nat;
	};

	// Transaction record
	public type Transaction = {
		from : Principal;
		to : Principal;
		amount : Nat;
		method : Text; // "Stake", "Unstake", "Harvest"
		time : Time.Time;
	};

	// Pool statistics
	public type PoolStats = {
		totalStaked : Nat;
		totalStakers : Nat;
		totalRewarded : Nat64;
		apr : Nat; // Annual percentage rate
		userStake : Nat;
		userEarned : Nat64;
		minimumStake : Nat;
		lockDuration : Nat;
	};

	// Pool parameters that can be updated by admin
	public type PoolParams = {
		totalRewardPerSecond : Nat; // Rewards distributed per second
		minimumStake : Nat; // Minimum stake amount
		lockDuration : Nat; // Lock duration in seconds
	};

	public type Tokens = {
		#USDx;
	};
	public type StakeMatric = {
		stakeId : StakeId;
		lockDuration : Int;
		lockupWeight : Int;
		bootstrapMultiplier : Nat;
		proportion : Nat;
		userWeight : Nat;
		totalWeight : Nat;
		totalFeeCollected : Nat;
		finalReward : Nat;
		apy : Nat;
	};

		// Add new enum for harvest action type
	public type HarvestAction = {
		#Withdraw; // Withdraw rewards to wallet
		#Compound; // Add rewards to existing stake
	};

};
