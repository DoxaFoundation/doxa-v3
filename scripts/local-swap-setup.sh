

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


cd ../../


dfx deploy swap  --argument="(\"$ICP\",\"$PasscodeManager\",\"$SwapCalculator\",\"$SwapFactory\")"

export SWAP=$(dfx canister id swap)

dfx canister call icp_ledger icrc1_transfer "( record {
    to = record {
      owner = principal \"$SWAP\";
    };
    amount = 200_000_000;
})"


# dfx deploy swap  --argument="(
#     icpCid = \"$ICP\",
#     passcodeManagerCid = \"$PasscodeManager\",
#     swapFactoryCid = \"$SwapFactory\",
#     swapCalculatorCid = \"$SwapCalculator\",
# )"

# echo
# echo "Creating ICP/USDx Swap Pool"
# echo

# dfx canister call swap create '(record {
# token0Id="ryjl3-tyaaa-aaaaa-aaaba-cai";
# token0Standard="ICRC2";
# token0Decimals=8;
# token1Id="irorr-5aaaa-aaaak-qddsq-cai";
# token1Standard="ICRC2";
# token1Decimals=6;
# initialPrice=7;
# })'