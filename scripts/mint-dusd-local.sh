Amount=$1

export DEFAULT_ACCOUNT=$(dfx identity get-principal --identity default)
TOKENS=$((Amount * 10 ** 6))

echo "Minting $Amount ckUSDC to default identity locally"
dfx canister call ckusdc_ledger icrc1_transfer "(record{ to=record {owner = principal \"$DEFAULT_ACCOUNT\"} ; amount=$TOKENS;})" --identity minter

echo "Transfering $Amount ckUSDC to Doxa Dollar Reserve Account"

# store output to extract block index for notifying minter
output=$(dfx canister call ckusdc_ledger icrc1_transfer "(record{ to=record {owner = principal \"iyn2n-liaaa-aaaak-qddta-cai\"; subaccount= opt blob \"\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\01\";} ; amount=$TOKENS;})" --identity default)

# Extract the number (block index) using awk for notifying minter
number=$(echo "$output" | awk -F'Ok = ' '{print $2}' | awk -F' :' '{print $1}')

echo "Notifying Doxa Dollar Minter"
dfx canister call stablecoin_minter notify_mint_with_ckusdc "(record{ ckusdc_block_index=$number; minting_token=variant {DUSD}})" --identity default

echo "Minted $Amount Doxa Dollar in default identity."
echo