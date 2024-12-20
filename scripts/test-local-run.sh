#!/bin/bash

no_of_test_canisters=20

cd src/test

for i in $(seq 0 $(($no_of_test_canisters - 1))); do
    echo "############################################"
    echo "Running test_canister_$((i+1))..."
   
    dfx canister call test_canister_$((i+1)) test

    echo
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
