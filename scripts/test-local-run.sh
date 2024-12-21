#!/bin/bash

no_of_test_canisters=20

# Create logs directory if it doesn't exist
mkdir -p logs

cd src/test

for i in $(seq 0 $(($no_of_test_canisters - 1))); do
    canister_num=$((i+1))
    log_file="../../logs/test_canister_${canister_num}.log"
    
    echo "############################################" > "$log_file"
    echo "Running test_canister_${canister_num}..." >> "$log_file"
    echo >> "$log_file"
    
    echo "Test Results:" >> "$log_file" 
    dfx canister call test_canister_${canister_num} test >> "$log_file" 2>&1
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
    
    echo "Log file created for test_canister_${canister_num}"
done

cd ../../
