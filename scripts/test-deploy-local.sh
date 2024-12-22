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

cd src/test

TRANSFER_FEE=10000

for i in $(seq 0 $(($no_of_test_canisters - 1))); do
    echo "############################################"
    echo "Deploying test_canister_$((i+1))..."
    echo "With Staking Amount = ${staking_amounts[$i]} Doxa Dollar."
    echo "With Staking Period = $((stake_periods[$i]/(1000000000*60*60*24))) days."

    amount_with_fee=$((staking_amounts[$i]*1000000 + TRANSFER_FEE));
    amount=$((staking_amounts[$i]*1000000));
    
    echo
    dfx canister create test_canister_$((i+1))

    export TEST_CANISTER_ID=$(dfx canister id test_canister_$((i+1)))

    dfx deploy test_canister_$((i+1)) --argument "(record { amount=$amount; stakePeriod=${stake_periods[$i]} })"
    echo
done

cd ../../
