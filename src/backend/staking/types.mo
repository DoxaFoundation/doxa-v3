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

		stakingSymbol : Text; // USDx
		stakingToken : Text; // doxa dollar
		rewardSymbol : Text; // Reward token symbol
		rewardToken : Text; // Reward token canister ID
		rewardPerSecond : Nat; // Rewards distributed per second
		minimumStake : Nat; // Minimum stake amount
		lockDuration : Nat; // Lock duration in seconds
	};

	// Individual stake record
	public type Stake = {
		staker : Principal; // Staker's principal
		amount : Nat; // Staked amount
		stakeTime : Time.Time; // When stake was created
		lockEndTime : Time.Time; // When lock period ends
		lastHarvestTime : Time.Time; // Last reward harvest time
		earned : Nat64; // Unclaimed rewards
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
		rewardPerSecond : Nat; // Rewards distributed per second
		minimumStake : Nat; // Minimum stake amount
		lockDuration : Nat; // Lock duration in seconds
	};

};
