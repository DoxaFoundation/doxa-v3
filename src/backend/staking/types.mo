import Time "mo:base/Time";
import Principal "mo:base/Principal";
import Nat "mo:base/Nat";
import Nat64 "mo:base/Nat64";

module {
	// Staking pool configuration
	public type StakingPoolDetails = {
		poolName : Text; // Name of the staking pool
		poolStartTime : Time.Time; // Start time of the pool
		poolEndTime : Time.Time; // End time of the pool
		totalTokensStaked : Nat; // Total number of tokens staked in the pool
		totalFeeCollected : Nat; // total transaction fee
		minimumTotalStake : Nat; // Minimum total stake required to keep the pool active
		stakingTokenSymbol : Text; // Symbol of the staking token (e.g., DUSD)
		stakingTokenName : Text; // Name of the staking token (e.g., Doxa Dollar)
		rewardTokenSymbol : Text; // Symbol of the reward token
		rewardTokenCanisterId : Text; // Canister ID of the reward token
		minimumStakeAmount : Nat; // Minimum amount of tokens a user can stake
		stakeLockDuration : Nat; // Duration (in seconds) for which stakes are locked
		noOfStakers : Nat; // Number of stakers in the pool
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
		pendingRewards : Nat;
		stakedReward : Nat;
	};

	public type QueryStakes = [QueryStake];

	public type QueryStake = {
		id : StakeId;
		amount : Nat;
		stakedAt : Int;
		unlockAt : Int;
		lastRewardsClaimedAt : Int;
		unclaimedRewards : Nat;
		stakedReward : Nat;
		isRewardsAutoStaked : Bool;
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

	public type Tokens = {
		#DUSD;
	};

	public type StakeMetrics = {
		stakeId : StakeId;
		stakeLockPeriod : Int;
		lockPeriodWeight : Int;
		bootstrapMultiplier : Nat;
		stakeContributionRatio : Nat;
		userStakeWeight : Nat;
		totalStakeWeight : Nat;
		totalFeeCollected : Nat;
		userFinalReward : Nat;
		apy : Nat;
	};

	// Add action type
	public type AutoCompoundAction = {
		#Enable;
		#Cancel;
	};

};
