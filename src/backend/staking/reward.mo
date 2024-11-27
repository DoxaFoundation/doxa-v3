import Float "mo:base/Float";
import Int "mo:base/Int";
import Debug "mo:base/Debug";
module {

	// Lockup period constants in seconds
	public let LOCKUP_90_DAYS : Nat = 7_776_000; // 90 days
	public let LOCKUP_180_DAYS : Nat = 15_552_000; // 180 days
	public let LOCKUP_270_DAYS : Nat = 23_328_000; // 270 days
	public let LOCKUP_360_DAYS : Nat = 31_104_000; // 360 days

	// Weight factors for different lockup periods
	public func getLockupWeight(duration : Nat) : Nat {
		if (duration >= LOCKUP_360_DAYS) return 4;
		if (duration >= LOCKUP_270_DAYS) return 3;
		if (duration >= LOCKUP_180_DAYS) return 2;
		return 1; // Default for 90 days
	};

	// Calculate user's stake weight - modified
	public func calculateUserWeeklyStakeWeight(userStake : Nat, totalStaked : Nat, lockupDuration : Nat) : Float {
		let proportion : Float = Float.fromInt(userStake) / Float.fromInt(totalStaked);
		let weight = Float.fromInt(getLockupWeight(lockupDuration));
		Debug.print("User stake weight calculation:");
		Debug.print("Proportion: " # debug_show (proportion));
		Debug.print("Weight: " # debug_show (weight));
		return proportion * weight;
	};

	// Calculate user's weekly reward share - modified
	public func calculateUserWeeklyReward(totalRewards : Nat, userWeight : Float, totalWeight : Float) : Nat {
		if (totalWeight == 0) return 0;
		let rewardShare = Float.fromInt(totalRewards) * (userWeight / totalWeight);
		Debug.print("Weekly reward calculation:");
		Debug.print("Total rewards: " # debug_show (totalRewards));
		Debug.print("User weight: " # debug_show (userWeight));
		Debug.print("Total weight: " # debug_show (totalWeight));
		Debug.print("Reward share: " # debug_show (rewardShare));
		return Int.abs(Float.toInt(rewardShare));
	};

	// Calculate APY for a user - modified
	public func calculateAPY(weeklyReward : Nat, stakedAmount : Nat) : Float {
		if (stakedAmount == 0) return 0;
		let weeklyRate = Float.fromInt(weeklyReward) / Float.fromInt(stakedAmount);
		// (1 + weekly_rate)^52 - 1
		let annualRate = Float.pow(1.0 + weeklyRate, 52.0) - 1.0;
		Debug.print("APY calculation:");
		Debug.print("Weekly rate: " # debug_show (weeklyRate));
		Debug.print("Annual rate: " # debug_show (annualRate));
		return annualRate * 100.0; // Convert to percentage
	};

};
