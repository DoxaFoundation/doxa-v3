# For local Assume token prices
###############################
# Token  #  USD value
######################
# ICP    #  7       #
# DUSåD   #  1       #
# ckUSDC #  1       #
# ckBTC  #  100_000 #
# ckETH  #  3_000   #
# ckUSDT #  1       #
######################
export ICP=$(dfx canister id icp_ledger)
export DUSD=$(dfx canister id dusd_ledger)
export ckUSDC=$(dfx canister id ckusdc_ledger)
export SWAP=$(dfx canister id swap)

# Switching to icp-swap directory 
cd src/icp-swap/
export ckBTC=$(dfx canister id ckbtc_ledger)
export ckETH=$(dfx canister id cketh_ledger)
export ckUSDT=$(dfx canister id ckusdt_ledger)
cd ../../

echo "Transfer 5110$ worth of 730 ICP to Swap Canister"
dfx canister call $ICP icrc1_transfer "(record {to=record{owner= principal \"$SWAP\"}; amount=730_00_000_000})" --identity minter

echo "Transfer 5110$ worth of 5110 ckUSDC to Swap Canister"
dfx canister call $ckUSDC icrc1_transfer "(record {to=record{owner= principal \"$SWAP\"}; amount=5_110_000_000})" --identity minter

echo "Transfer 5110$ worth of 0.0511 ckBTC to Swap Canister"
dfx canister call $ckBTC icrc1_transfer "(record {to=record{owner= principal \"$SWAP\"}; amount=5_110_000})" --identity minter

echo "Transfer 5110$ worth of 1.703333333333333333 ckETH to Swap Canister"
dfx canister call $ckETH icrc1_transfer "(record {to=record{owner= principal \"$SWAP\"}; amount=1_703333333333333333})" --identity minter

echo "Transfer 5110$ worth of 5110 ckUSDT to Swap Canister"
dfx canister call $ckUSDT icrc1_transfer "(record {to=record{owner= principal \"$SWAP\"}; amount=5_110_000_000})" --identity minter

echo "Minting 6000 DUSD for Testing"
chmod +x ./scripts/mint-dusd-local.sh
./scripts/mint-dusd-local.sh 6000

echo "Transfer 5110$ worth of 5110 DUSD to Swap Canister"
dfx canister call $DUSD icrc1_transfer "(record {to=record{owner= principal \"$SWAP\"}; amount=5_110_000_000})"

##### New Amount for stable coins
# for dusd_ckUsdT and ckUsdC_ckUsdT pool 10k each
echo "Transfer 20,000$ worth of 20,000 ckUSDT to Swap Canister" 
dfx canister call $ckUSDT icrc1_transfer "(record {to=record{owner= principal \"$SWAP\"}; amount=20000000000})" --identity minter

# for ckUsdC_dusd and ckUsdC_ckUsdT pool 10k each
echo "Transfer 20,000$ worth of 20,000 ckUSDT to Swap Canister" 
dfx canister call $ckUSDC icrc1_transfer "(record {to=record{owner= principal \"$SWAP\"}; amount=20000000000})" --identity minter

# for ckUsdC_dusd and dusd_ckUsdT pool 10k each
echo "Minting 20,000 DUSD for Testing"
chmod +x ./scripts/mint-dusd-local.sh
./scripts/mint-dusd-local.sh 20000

echo "Transfer 20,000$ worth of 20,000 DUSD to Swap Canister"
dfx canister call $DUSD icrc1_transfer "(record {to=record{owner= principal \"$SWAP\"}; amount=20000000000})"

####

dfx canister call swap addInitialLiquidityLocal "(record{
ICP=7;
DUSD=1;
ckUSDC=1;
ckBTC=100_000;
ckETH=3000;
ckUSDT=1;
})"
