export DEFAULT_ACCOUNT=$(dfx identity get-principal --identity default)
export DOXA_ACCOUNT=$(dfx identity get-principal --identity doxa)



# USDx Balance of default idenity
echo "USDx Balance of default idenity"
dfx canister call usdx_ledger icrc1_balance_of "(record {owner= principal \"$DEFAULT_ACCOUNT\"})" --identity default

# ckUSDC Balance of default idenity
echo "ckUSDC Balance of default idenity"
dfx canister call ckusdc_ledger icrc1_balance_of "(record {owner= principal \"$DEFAULT_ACCOUNT\"})" --identity default


# USDx Balance of DOXA idenity
echo "USDx Balance of DOXA idenity"
dfx canister call usdx_ledger icrc1_balance_of "(record {owner= principal \"$DOXA_ACCOUNT\"})" --identity default

# ckUSDC Balance of DOXA idenity
echo "ckUSDC Balance of DOXA idenity"
dfx canister call ckusdc_ledger icrc1_balance_of "(record {owner= principal \"$DOXA_ACCOUNT\"})" --identity default


# Transfer ckUSDC from default identity to Reserve Account of USDx
output=$(dfx canister call ckusdc_ledger icrc1_transfer '(record{ to=record {owner = principal "iyn2n-liaaa-aaaak-qddta-cai"; subaccount= opt blob "\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\01";} ; amount=100_000_000;})' --identity default)
# Extract the number (block index) using awk for notifying minter
number=$(echo "$output" | awk -F'Ok = ' '{print $2}' | awk -F' :' '{print $1}')

# Notify stablecoin minter to mint USDx
dfx canister call stablecoin_minter notify_mint_with_ckusdc "(record{ ckusdc_block_index=$number; minting_token=variant {USDx}})" --identity default



# Transfer ckUSDC from default identity to Reserve Account of USDx
output=$(dfx canister call ckusdc_ledger icrc1_transfer '(record{ to=record {owner = principal "iyn2n-liaaa-aaaak-qddta-cai"; subaccount= opt blob "\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\01";} ; amount=100_000_000;})' --identity doxa)
# Extract the number (block index) using awk for notifying minter
number=$(echo "$output" | awk -F'Ok = ' '{print $2}' | awk -F' :' '{print $1}')

# Notify stablecoin minter to mint USDx
dfx canister call stablecoin_minter notify_mint_with_ckusdc "(record{ ckusdc_block_index=$number; minting_token=variant {USDx}})" --identity doxa




# USDx Balance of default idenity
echo "USDx Balance of default idenity"
dfx canister call usdx_ledger icrc1_balance_of "(record {owner= principal \"$DEFAULT_ACCOUNT\"})" --identity default

# ckUSDC Balance of default idenity
echo "ckUSDC Balance of default idenity"
dfx canister call ckusdc_ledger icrc1_balance_of "(record {owner= principal \"$DEFAULT_ACCOUNT\"})" --identity default


# USDx Balance of DOXA idenity
echo "USDx Balance of DOXA idenity"
dfx canister call usdx_ledger icrc1_balance_of "(record {owner= principal \"$DOXA_ACCOUNT\"})" --identity default

# ckUSDC Balance of DOXA idenity
echo "ckUSDC Balance of DOXA idenity"
dfx canister call ckusdc_ledger icrc1_balance_of "(record {owner= principal \"$DOXA_ACCOUNT\"})" --identity default
