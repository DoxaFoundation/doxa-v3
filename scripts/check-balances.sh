#!/bin/bash

# Get default identity principal
export DEFAULT_ACCOUNT=$(dfx identity get-principal --identity default)

export ICP=$(dfx canister id icp_ledger)
export DUSD=$(dfx canister id dusd_ledger)
export ckUSDC=$(dfx canister id ckusdc_ledger)

cd src/icp-swap/
export ckBTC=$(dfx canister id ckbtc_ledger)
export ckETH=$(dfx canister id cketh_ledger)
export ckUSDT=$(dfx canister id ckusdt_ledger)
cd ../../


# Function to format balance with token name
format_balance() {
    local token=$1
    local balance=$2
    local decimals=$3
    
    # Extract the first group of digits (and underscores), then remove underscores
    clean_balance=$(echo "$balance" | grep -oE '[0-9_]+' | head -1 | tr -d '_')
    
    if [ -n "$clean_balance" ]; then
        # Use awk to divide by 10^decimals and format the result
        formatted=$(awk "BEGIN {printf \"%.6f\", $clean_balance / (10^$decimals)}")
        printf "%-8s: %s\n" "$token" "$formatted"
    else
        printf "%-8s: 0.000000\n" "$token"
    fi
}

echo "Balances for default identity ($DEFAULT_ACCOUNT):"
echo "----------------------------------------"

# Check ICP balance (8 decimals)
icp_balance=$(dfx canister call $ICP icrc1_balance_of "(record {owner=principal \"$DEFAULT_ACCOUNT\"})")
format_balance "ICP" "$icp_balance" 8

# Check DUSD balance (6 decimals)
dusd_balance=$(dfx canister call $DUSD icrc1_balance_of "(record {owner=principal \"$DEFAULT_ACCOUNT\"})")
format_balance "DUSD" "$dusd_balance" 6

# Check ckUSDC balance (6 decimals)
ckusdc_balance=$(dfx canister call $ckUSDC icrc1_balance_of "(record {owner=principal \"$DEFAULT_ACCOUNT\"})")
format_balance "ckUSDC" "$ckusdc_balance" 6

# Check ckBTC balance (8 decimals)
ckbtc_balance=$(dfx canister call $ckBTC icrc1_balance_of "(record {owner=principal \"$DEFAULT_ACCOUNT\"})")
format_balance "ckBTC" "$ckbtc_balance" 8

# Check ckETH balance (18 decimals)
cketh_balance=$(dfx canister call $ckETH icrc1_balance_of "(record {owner=principal \"$DEFAULT_ACCOUNT\"})")
format_balance "ckETH" "$cketh_balance" 18

# Check ckUSDT balance (6 decimals)
ckusdt_balance=$(dfx canister call $ckUSDT icrc1_balance_of "(record {owner=principal \"$DEFAULT_ACCOUNT\"})")
format_balance "ckUSDT" "$ckusdt_balance" 6