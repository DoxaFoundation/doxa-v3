export ICP=$(dfx canister id icp_ledger)

# Switching to icp-swap directory 
cd src/icp-swap/

chmod +x ./scripts/deploy-icp-swap-locally.sh

echo "Deploying Swap canisters Locally"
echo
./scripts/deploy-icp-swap-locally.sh "$ICP"

export PasscodeManager=$(dfx canister id PasscodeManager)
export SwapFactory=$(dfx canister id SwapFactory)
export SwapCalculator=$(dfx canister id SwapCalculator)
export ckBTC=$(dfx canister id ckbtc_ledger)
export ckETH=$(dfx canister id cketh_ledger)
export ckUSDT=$(dfx canister id ckusdt_ledger)

cd ../../

# Sending cycles to SwapFactory
dfx wallet balance
dfx wallet send $SwapFactory 32_000_000_000_000

export DUSD=$(dfx canister id dusd_ledger)
export ckUSDC=$(dfx canister id ckusdc_ledger)

dfx deploy swap  --argument="(\"$ICP\",\"$PasscodeManager\",\"$SwapCalculator\",\"$SwapFactory\")"

export SWAP=$(dfx canister id swap)

# Transfer ICP need to create all swap pools into the swap canister
echo
echo "Transfer ICP to Swap Canister"
echo
dfx canister call icp_ledger icrc1_transfer "( record {
    to = record {
      owner = principal \"$SWAP\";
    };
    amount = 3000_000_000;
})"


#####################
# NOTES
##
# token0 and token1 are manualy sorted using Swap calculator sortToken method
#
# initialPrice price are calculated by sort order using this equation 
# price = token1 / token0
#
# For local Assume token prices
###############################
# Token  #  USD value
######################
# ICP    #  7       #
# DUSD   #  1       #
# ckUSDC #  1       #
# ckBTC  #  100_000 #
# ckETH  #  3_000   #
# ckUSDT #  1       #
######################

echo
echo "Creating ICP - DUSD Swap Pool"
echo
dfx canister call swap create "(\"$DUSD\", \"$ICP\")"

echo "Pause for 1 minute" # For not to get error from swapfactory
sleep 1m

echo
echo "Creating ckUSDC - DUSD Swap Pool"
echo
dfx canister call swap create "(\"$DUSD\", \"$ckUSDC\")"

echo "Pause for 1 minute"
sleep 1m

echo
echo "Creating ckBTC - DUSD Swap Pool"
echo
dfx canister call swap create "(\"$DUSD\", \"$ckBTC\")"

echo "Pause for 1 minute"
sleep 1m

echo
echo "Creating ckETH - DUSD Swap Pool"
echo
dfx canister call swap create "(\"$DUSD\", \"$ckETH\")"

echo "Pause for 1 minute"
sleep 1m

echo
echo "Creating ckUSDT - DUSD Swap Pool"
echo
dfx canister call swap create "(\"$ckUSDT\", \"$DUSD\")"

echo "Pause for 1 minute"
sleep 1m

echo
echo "Creating ICP - ckUSDC Swap Pool"
echo
dfx canister call swap create "(\"$ICP\", \"$ckUSDC\")"

echo "Pause for 1 minute"
sleep 1m

echo
echo "Creating ICP - ckBTC Swap Pool"
echo
dfx canister call swap create "(\"$ckBTC\", \"$ICP\")"

echo "Pause for 1 minute"
sleep 1m

echo
echo "Creating ICP - ckETH Swap Pool"
echo
dfx canister call swap create "(\"$ICP\", \"$ckETH\")"

echo "Pause for 1 minute"
sleep 1m

echo
echo "Creating ICP - ckUSDT Swap Pool"
echo
dfx canister call swap create "(\"$ckUSDT\", \"$ICP\")"

echo "Pause for 1 minute"
sleep 1m

echo
echo "Creating ckUSDC - ckBTC Swap Pool"
echo
dfx canister call swap create "(\"$ckBTC\", \"$ckUSDC\")"

echo "Pause for 1 minute"
sleep 1m

echo
echo "Creating ckUSDC - ckETH Swap Pool"
echo
dfx canister call swap create "(\"$ckETH\", \"$ckUSDC\")"

echo "Pause for 1 minute"
sleep 1m

echo
echo "Creating ckUSDC - ckUSDT Swap Pool"
echo
dfx canister call swap create "(\"$ckUSDT\", \"$ckUSDC\")"

echo "Pause for 1 minute"
sleep 1m

echo
echo "Creating ckBTC - ckETH Swap Pool"
echo
dfx canister call swap create "(\"$ckBTC\", \"$ckETH\")"

echo "Pause for 1 minute"
sleep 1m

echo
echo "Creating ckBTC - ckUSDT Swap Pool"
echo
dfx canister call swap create "(\"$ckUSDT\", \"$ckBTC\")"

echo "Pause for 1 minute"
sleep 1m

echo
echo "Creating ckETH - ckUSDT Swap Pool"
echo
dfx canister call swap create "(\"$ckUSDT\", \"$ckETH\")"
