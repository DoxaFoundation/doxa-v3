#!/bin/bash

no_of_test_canisters=20

# Create logs directory if it doesn't exist
mkdir -p logs

cd src/test

# Run all test functions
for i in $(seq 0 $((no_of_test_canisters - 1))); do
    canister_num=$((i+1))
    log_file="../../logs/test_canister_${canister_num}.log"
    
    echo "############################################" > "$log_file"
    echo "Running test_canister_${canister_num}..." >> "$log_file"
    echo >> "$log_file"
    
    echo "Test Results:" >> "$log_file" 
    dfx canister call test_canister_${canister_num} test >> "$log_file" 2>&1
    echo >> "$log_file"

    echo "Test completed for test_canister_${canister_num}"
done


for i in $(seq 0 $(($no_of_test_canisters - 1))); do
    echo "############################################"
    echo "Displaying Stake Details and Stake Metric for test_canister_$((i+1))..."
    
    echo "Stake  Details"
    dfx canister call test_canister_$((i+1)) getStakeDetails
    echo
    echo "Stake Metric"
      dfx canister call test_canister_$((i+1)) getStakeMetric
    echo
done

cd ../../
