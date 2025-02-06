

export ICP=$(dfx canister id icp_ledger)

# Switching to icp-swap directory 
cd src/icp-swap/

chmod +x ./scripts/deploy-icp-swap-locally.sh
chmod +x ./scripts/create-swap-pool.sh

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

export USDx=$(dfx canister id usdx_ledger)
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
# USDX   #  1       #
# ckUSDC #  1       #
# ckBTC  #  100_000 #
# ckETH  #  3_000   #
# ckUSDT #  1       #
######################



echo
echo "Creating ICP - USDx Swap Pool"
echo
dfx canister call swap create "(record {
token0Id=\"$USDx\";
token0Standard=\"ICRC2\";
token0Decimals=6;
token1Id=\"$ICP\";
token1Standard=\"ICRC2\";
token1Decimals=8;
initialPrice=7.0 : float64;
})"

echo "Pause for 1 minute" # For not to get error from swapfactory (#InternalError("Please wait for previous creating job finished"))
sleep 1m

echo
echo "Creating ckUSDC - USDx Swap Pool"
echo

dfx canister call swap create "(record {
token0Id=\"$USDx\";
token0Standard=\"ICRC2\";
token0Decimals=6;
token1Id=\"$ckUSDC\";
token1Standard=\"ICRC2\";
token1Decimals=6;
initialPrice=1.0 : float64;
})"

echo "Pause for 1 minute"
sleep 1m

echo
echo "Creating ckBTC - USDx Swap Pool"
echo
dfx canister call swap create "(record {
token0Id=\"$USDx\";
token0Standard=\"ICRC2\";
token0Decimals=6;
token1Id=\"$ckBTC\";
token1Standard=\"ICRC2\";
token1Decimals=8;
initialPrice=100000.0 : float64;
})"

echo "Pause for 1 minute"
sleep 1m

echo
echo "Creating ckETH - USDx Swap Pool"
echo
dfx canister call swap create "(record {
token0Id=\"$USDx\";
token0Standard=\"ICRC2\";
token0Decimals=6;
token1Id=\"$ckETH\";
token1Standard=\"ICRC2\";
token1Decimals=18;
initialPrice=3000.0 : float64;
})"

echo "Pause for 1 minute"
sleep 1m

echo
echo "Creating ckUSDT - USDx Swap Pool"
echo
dfx canister call swap create "(record {
token0Id=\"$ckUSDT\";
token0Standard=\"ICRC2\";
token0Decimals=6;
token1Id=\"$USDx\";
token1Standard=\"ICRC2\";
token1Decimals=6;
initialPrice=1.0 : float64;
})"

echo "Pause for 1 minute"
sleep 1m

echo
echo "Creating ICP - ckUSDC Swap Pool"
echo
price=0.1428571429 #$((1 / 7))

dfx canister call swap create "(record {
token0Id=\"$ICP\";
token0Standard=\"ICRC2\";
token0Decimals=8;
token1Id=\"$ckUSDC\";
token1Standard=\"ICRC2\";
token1Decimals=6;
initialPrice=$price : float64;
})"

echo "Pause for 1 minute"
sleep 1m

echo
echo "Creating ICP - ckBTC Swap Pool"
echo
price=0.00007 #$((7 / 100000))

dfx canister call swap create "(record {
token0Id=\"$ckBTC\";
token0Standard=\"ICRC2\";
token0Decimals=8;
token1Id=\"$ICP\";
token1Standard=\"ICRC2\";
token1Decimals=8;
initialPrice=$price : float64;
})"

echo "Pause for 1 minute"
sleep 1m

echo
echo "Creating ICP - ckETH Swap Pool"
echo
price=428.5714285714 #$((3000 / 7))

dfx canister call swap create "(record {
token0Id=\"$ICP\";
token0Standard=\"ICRC2\";
token0Decimals=8;
token1Id=\"$ckETH\";
token1Standard=\"ICRC2\";
token1Decimals=18;
initialPrice=$price : float64;
})"

echo "Pause for 1 minute"
sleep 1m

echo
echo "Creating ICP - ckUSDT Swap Pool"
echo
price=7.0 #$((7 / 1))

dfx canister call swap create "(record {
token0Id=\"$ckUSDT\";
token0Standard=\"ICRC2\";
token0Decimals=6;
token1Id=\"$ICP\";
token1Standard=\"ICRC2\";
token1Decimals=8;
initialPrice=$price : float64;
})"


echo "Pause for 1 minute"
sleep 1m

echo
echo "Creating ckUSDC - ckBTC Swap Pool"
echo
price=0.00001 #$((1 / 100000))

dfx canister call swap create "(record {
token0Id=\"$ckBTC\";
token0Standard=\"ICRC2\";
token0Decimals=8;
token1Id=\"$ckUSDC\";
token1Standard=\"ICRC2\";
token1Decimals=6;
initialPrice=$price : float64;
})"


echo "Pause for 1 minute"
sleep 1m

echo
echo "Creating ckUSDC - ckETH Swap Pool"
echo
price=0.0003333333333 #$((1 / 3000))

dfx canister call swap create "(record {
token0Id=\"$ckETH\";
token0Standard=\"ICRC2\";
token0Decimals=18;
token1Id=\"$ckUSDC\";
token1Standard=\"ICRC2\";
token1Decimals=6;
initialPrice=$price : float64;
})"

echo "Pause for 1 minute"
sleep 1m

echo
echo "Creating ckUSDC - ckUSDT Swap Pool"
echo
price=1.0 #$((1 / 1))

dfx canister call swap create "(record {
token0Id=\"$ckUSDT\";
token0Standard=\"ICRC2\";
token0Decimals=6;
token1Id=\"$ckUSDC\";
token1Standard=\"ICRC2\";
token1Decimals=6;
initialPrice=$price : float64;
})"

echo "Pause for 1 minute"
sleep 1m

echo
echo "Creating ckBTC - ckETH Swap Pool"
echo
price=0.03 #$((3,000/100,000)

dfx canister call swap create "(record {
token0Id=\"$ckBTC\";
token0Standard=\"ICRC2\";
token0Decimals=8;
token1Id=\"$ckETH\";
token1Standard=\"ICRC2\";
token1Decimals=18;
initialPrice=$price : float64;
})"


echo "Pause for 1 minute"
sleep 1m

echo
echo "Creating ckBTC - ckUSDT Swap Pool"
echo
price=100000.0 #$((100,000/1)

dfx canister call swap create "(record {
token0Id=\"$ckUSDT\";
token0Standard=\"ICRC2\";
token0Decimals=6;
token1Id=\"$ckBTC\";
token1Standard=\"ICRC2\";
token1Decimals=8;
initialPrice=100000.0 : float64;
})"


echo "Pause for 1 minute"
sleep 1m

echo
echo "Creating ckETH - ckUSDT Swap Pool"
echo
price=3000.0 #$((3,000/1)

dfx canister call swap create "(record {
token0Id=\"$ckUSDT\";
token0Standard=\"ICRC2\";
token0Decimals=6;
token1Id=\"$ckETH\";
token1Standard=\"ICRC2\";
token1Decimals=18;
initialPrice=$price : float64;
})"
