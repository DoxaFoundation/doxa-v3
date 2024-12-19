#!/bin/bash

# Array to store randomly generated amount for staking. min 10 numbers
staking_amounts=()

stake_periods=()

stake_periods+=(2592000000000000) # 30 days
stake_periods+=(5184000000000000) # 60 days
stake_periods+=(7776000000000000) # 90 days
stake_periods+=(10368000000000000) # 120 days
stake_periods+=(12960000000000000) # 150 days
stake_periods+=(15552000000000000) # 180 days
stake_periods+=(18144000000000000) # 210 days
stake_periods+=(20736000000000000) # 240 days
stake_periods+=(23328000000000000) # 270 days
stake_periods+=(25920000000000000) # 300 days
stake_periods+=(28512000000000000) # 330 days
stake_periods+=(31104000000000000) # 360 days

stake_periods+=(3888000000000000)  # 45 days
stake_periods+=(6696000000000000)  # 77 days
stake_periods+=(8640000000000000) # 100 days
stake_periods+=(11508000000000000) # 133 days
stake_periods+=(17172000000000000) # 199 days
stake_periods+=(19356000000000000) # 222 days
stake_periods+=(22392000000000000) # 258 days
stake_periods+=(27216000000000000) # 315 days
stake_periods+=(30240000000000000) # 350 days

echo "Generated 20 random staking periods:"
echo ${stake_periods[@]}


# Initialize variables
min_value=10
target_min=100000
target_max=110000
total=0
no_of_test_canisters=20

# Array to store random numbers
staking_amounts=()

# Function to generate random numbers
generate_numbers() {
    staking_amounts=()  # Clear the array
    total=0            # Reset total

    for ((i = 0; i < no_of_test_canisters; i++)); do
        # Generate a random number >= min_value
        num=$((RANDOM % 10000 + min_value))
        staking_amounts+=($num)
        total=$((total + num))
    done
}

# Keep generating until the total meets the condition
while true; do
    generate_numbers
    if [[ $total -ge $target_min && $total -le $target_max ]]; then
        break
    fi
done

# Output the results
echo "Generated 20 random staking amount:"
echo "${staking_amounts[@]}"
echo "Total sum: $total"

echo "Minting 110000 ckUSDC to default identity for Testing"
export DEFAULT_ACCOUNT=$(dfx identity get-principal --identity default)

dfx canister call ckusdc_ledger icrc1_transfer "(record{ to=record {owner = principal \"$DEFAULT_ACCOUNT\"} ; amount=110_000_000_000;})" --identity minter

echo "Transfering 110_000 ckUSDC to Doxa Dollar Reserve Account"

# store output to extract block index for notifying minter
output=$(dfx canister call ckusdc_ledger icrc1_transfer '(record{ to=record {owner = principal "iyn2n-liaaa-aaaak-qddta-cai"; subaccount= opt blob "\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\01";} ; amount=110_000_000_000;})' --identity default)

# Extract the number (block index) using awk for notifying minter
number=$(echo "$output" | awk -F'Ok = ' '{print $2}' | awk -F' :' '{print $1}')


echo "Notifying Doxa Dollar Minter"
dfx canister call stablecoin_minter notify_mint_with_ckusdc "(record{ ckusdc_block_index=$number; minting_token=variant {USDx}})" --identity default

echo "Minted 110_000 Doxa Dollar in default identity."
echo

cd src/test

TRANSFER_FEE=10000

# Create log file
LOG_FILE="test_deployment.log"
echo "Starting test canister deployments at $(date)" > $LOG_FILE

for i in $(seq 0 $(($no_of_test_canisters - 1))); do
    echo "############################################" | tee -a $LOG_FILE
    echo "Deploying test_canister_$((i+1))..." | tee -a $LOG_FILE
    echo "With Staking Amount = ${staking_amounts[$i]} Doxa Dollar." | tee -a $LOG_FILE
    echo "With Staking Period = $((stake_periods[$i]/(1000000000*60*60*24))) days." | tee -a $LOG_FILE

    # Calculate transfer amount with some buffer for fees
    amount=$((staking_amounts[$i]*1000000))
    transfer_amount=$((amount - TRANSFER_FEE)) # Reduce amount to account for fees
    echo "Transfer amount: $transfer_amount" | tee -a $LOG_FILE
    echo

    # Create canister and capture output to log
    dfx canister create test_canister_$((i+1)) >> $LOG_FILE 2>&1

    export TEST_CANISTER_ID=$(dfx canister id test_canister_$((i+1)))
    echo "Created canister with ID: $TEST_CANISTER_ID" | tee -a $LOG_FILE

    # Transfer tokens to test canister
    transfer_result=$(dfx canister call irorr-5aaaa-aaaak-qddsq-cai icrc1_transfer "(record{ to=record {owner = principal \"$TEST_CANISTER_ID\"; subaccount= null}; amount=$transfer_amount;})" --identity default)
    echo "Transfer result: $transfer_result" >> $LOG_FILE

    # Deploy canister with arguments
    echo "Deploying canister..." | tee -a $LOG_FILE
    dfx deploy test_canister_$((i+1)) --argument "(record { amount=$transfer_amount; stakePeriod=${stake_periods[$i]} })" >> $LOG_FILE 2>&1
    echo

    # Transfer to staking canister and capture block index
    echo "Transferring to staking canister..." | tee -a $LOG_FILE
    output=$(dfx canister call irorr-5aaaa-aaaak-qddsq-cai icrc1_transfer "(record{ to=record {owner = principal \"mhahe-xqaaa-aaaag-qndha-cai\"; subaccount= null}; amount = $transfer_amount;})")
    
    # Extract and log block index
    block_index=$(echo "$output" | awk -F'Ok = ' '{print $2}' | awk -F' :' '{print $1}')
    echo "Test Canister $((i+1)) Block Index: $block_index" | tee -a $LOG_FILE
    echo "----------------------------------------" >> $LOG_FILE
done

echo "Deployment completed. Check $LOG_FILE for details."

cd ../../
