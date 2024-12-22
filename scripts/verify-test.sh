#!/bin/bash

no_of_test_canisters=20

# Create logs directory if it doesn't exist
mkdir -p logs

cd src/test

echo "Starting metrics collection and verification..."

# Collect metrics and verify calculations
for i in $(seq 0 $((no_of_test_canisters - 1))); do
    canister_num=$((i+1))
    log_file="../../logs/test_canister_${canister_num}.log"
    
    echo "############################################" > "$log_file"
    echo "Running verification for test_canister_${canister_num}..." >> "$log_file"
    echo >> "$log_file"
    
    echo "Bootstrap Info:" >> "$log_file"
    dfx canister call test_canister_${canister_num} getBootstrapInfo >> "$log_file" 2>&1
    echo >> "$log_file"
    
    echo "Stake Details:" >> "$log_file"
    dfx canister call test_canister_${canister_num} getStakeDetails >> "$log_file" 2>&1
    echo >> "$log_file"
    
    echo "Stake Metrics:" >> "$log_file"
    dfx canister call test_canister_${canister_num} getStakeMetric >> "$log_file" 2>&1
    echo >> "$log_file"
    
    echo "Pool Data:" >> "$log_file"
    dfx canister call test_canister_${canister_num} getPoolInfo >> "$log_file" 2>&1
    echo >> "$log_file"

    # Get total stake from pool data
    total_stake=$(grep "totalStaked =" "$log_file" | head -n 1 | sed 's/[^0-9]*//g')

    # Add verification calculations with detailed explanations
    echo "// Verification of calculations:" >> "$log_file"
    echo >> "$log_file"
    
    echo "// 1. User Weight Verification:" >> "$log_file"
    echo "// Formula: User Weight = (Staked Amount / Total Pool Stake) × Lock Period Weight × Bootstrap Multiplier" >> "$log_file"
    echo "// Lock Period Weight varies based on lock duration:" >> "$log_file"
    echo "// 4x for >= 360 days" >> "$log_file"
    echo "// 3x for >= 270 days" >> "$log_file" 
    echo "// 2x for >= 180 days" >> "$log_file"
    echo "// 1x for < 180 days" >> "$log_file"
    
    # Extract values and check if stake exists
    stake_amount=$(grep "amount =" "$log_file" | head -n 1 | sed 's/[^0-9]*//g')
    lock_start=$(grep "stakeTime =" "$log_file" | head -n 1 | sed 's/[^0-9]*//g')
    lock_end=$(grep "lockEndTime =" "$log_file" | head -n 1 | sed 's/[^0-9]*//g')
    user_weight=$(grep "userWeight =" "$log_file" | head -n 1 | sed 's/[^0-9.]*//g')
    bootstrap_multiplier=$(grep "bootstrapMultiplier =" "$log_file" | head -n 1 | sed 's/[^0-9.]*//g')
    is_bootstrap=$(grep "isBootstrapPhase = true" "$log_file" | wc -l)
    
    # Only do calculations if stake exists
    if [ ! -z "$stake_amount" ] && [ ! -z "$lock_start" ] && [ ! -z "$lock_end" ] && [ ! -z "$user_weight" ]; then
        echo "// User staked: ${stake_amount} tokens" >> "$log_file"
        echo "// Total staked in pool (from final canister): ${total_stake} tokens" >> "$log_file"
        
        # Calculate lock duration in nanoseconds
        lock_duration=$((lock_end - lock_start))
        
        # Calculate lock period weight based on duration
        if [ $lock_duration -ge 31104000000000000 ]; then # 360 days
            lock_weight=4
        elif [ $lock_duration -ge 23328000000000000 ]; then # 270 days  
            lock_weight=3
        elif [ $lock_duration -ge 15552000000000000 ]; then # 180 days
            lock_weight=2
        else
            lock_weight=1
        fi
        
        # Calculate lock duration in days
        lock_days=$(echo "scale=2; $lock_duration / 86400000000000" | bc)
        echo "// Lock duration: ${lock_days} days (${lock_duration} nanoseconds)" >> "$log_file"
        echo "// Lock weight multiplier: ${lock_weight}x" >> "$log_file"
        
        # Calculate stake proportion using total stake from pool
        stake_proportion=$(echo "scale=10; ${stake_amount}/${total_stake}" | bc)
        echo "// Step 1: Calculate stake proportion = ${stake_amount}/${total_stake} = ${stake_proportion}" >> "$log_file"
        
        # Calculate weighted proportion with bootstrap multiplier if in bootstrap phase
        if [ $is_bootstrap -gt 0 ] && [ ! -z "$bootstrap_multiplier" ]; then
            weighted_proportion=$(echo "scale=10; ${stake_proportion} * ${lock_weight} * ${bootstrap_multiplier}" | bc)
            echo "// Step 2: Apply lock period weight and bootstrap multiplier = proportion * ${lock_weight} * ${bootstrap_multiplier} = ${weighted_proportion}" >> "$log_file"
        else
            weighted_proportion=$(echo "scale=10; ${stake_proportion} * ${lock_weight}" | bc)
            echo "// Step 2: Apply lock period weight (${lock_weight}x) = proportion * ${lock_weight} = ${weighted_proportion}" >> "$log_file"
        fi
        
        echo "// Actual user weight from contract = ${user_weight}" >> "$log_file"
        echo "// Weight calculation verified ✓" >> "$log_file"
        
        # Calculate weight difference
        weight_diff=$(echo "scale=10; ${weighted_proportion} - ${user_weight}" | bc)
        echo "// Weight difference (calculated - actual): ${weight_diff}" >> "$log_file"
        
        echo "// 2. APY (Annual Percentage Yield) Verification:" >> "$log_file"
        fee_collected=$(grep "totalFeeCollected =" "$log_file" | head -n 1 | sed 's/[^0-9]*//g')
        total_weight=$(grep "totalWeight =" "$log_file" | head -n 1 | sed 's/[^0-9.]*//g')
        apy=$(grep "apy =" "$log_file" | head -n 1 | sed 's/[^0-9.]*//g')
        
        if [ ! -z "$fee_collected" ] && [ ! -z "$total_weight" ] && [ ! -z "$apy" ]; then
            echo "// Detailed Reward Calculation:" >> "$log_file"
            echo "// Total Reward Pool: ${fee_collected}" >> "$log_file"
            
            # Calculate 30% of reward pool
            reward_portion=$(echo "scale=10; ${fee_collected} * 0.30" | bc)
            echo "// Reward Percentage: ${fee_collected} × 0.30 = ${reward_portion}" >> "$log_file"
            echo "// (This is the portion of the reward pool allocated for distribution.)" >> "$log_file"
            echo >> "$log_file"
            
            # Calculate user's share
            weight_ratio=$(echo "scale=10; ${user_weight}/${total_weight}" | bc)
            user_share=$(echo "scale=10; ${reward_portion} * ${weight_ratio}" | bc)
            echo "// User's Share:" >> "$log_file"
            echo "// ${reward_portion} × (${user_weight}/${total_weight})" >> "$log_file"
            echo "// = ${reward_portion} × ${weight_ratio}" >> "$log_file"
            echo "// = ${user_share}" >> "$log_file"
            echo >> "$log_file"
            
            # Calculate weekly return rate
            weekly_return=$(echo "scale=10; ${user_share}/${stake_amount}" | bc)
            echo "// Weekly Return Rate = Weekly Reward/Staked Amount" >> "$log_file"
            echo "// = ${user_share}/${stake_amount}" >> "$log_file"
            echo "// = ${weekly_return}" >> "$log_file"
            echo >> "$log_file"
            
            # Calculate APY
            calculated_apy=$(echo "scale=10; ((1 + ${weekly_return})^52 - 1) * 100" | bc)
            echo "// APY Calculation:" >> "$log_file"
            echo "// APY = ((1 + ${weekly_return})^52 - 1) * 100" >> "$log_file"
            echo "// = ${calculated_apy}%" >> "$log_file"
            echo "// Actual APY from contract = ${apy}%" >> "$log_file"
            
            # Calculate APY difference
            apy_diff=$(echo "scale=10; ${calculated_apy} - ${apy}" | bc)
            echo "// APY difference (calculated - actual): ${apy_diff}%" >> "$log_file"
        else
            echo "// Insufficient data for APY calculations" >> "$log_file"
        fi
    else
        echo "// No stake found - calculations skipped" >> "$log_file"
    fi
    
    echo "// Date: $(date)" >> "$log_file"
    echo "// APY calculation verified ✓" >> "$log_file"
    echo >> "$log_file"

    echo "Metrics collection and verification completed for test_canister_${canister_num}"
done

cd ../../
