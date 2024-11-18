# Store principals in variables
export DEFAULT_ACCOUNT=$(dfx identity get-principal --identity default)
export DOXA_ACCOUNT=$(dfx identity get-principal --identity doxa)

# USDx Balance of default idenity
dfx canister call usdx_ledger icrc1_balance_of "(record {owner= principal \"$DEFAULT_ACCOUNT\"})" --identity default

# ckUSDC Balance of default idenity
dfx canister call ckusdc_ledger icrc1_balance_of "(record {owner= principal \"$DEFAULT_ACCOUNT\"})" --identity default

# Get (ckUSDC) Reserve Account of USDx 
dfx canister call stablecoin_minter get_ckusdc_reserve_account_of '(record {token= variant {USDx}})'

# Transfer ckUSDC from default identity to Reserve Account of USDx
dfx canister call ckusdc_ledger icrc1_transfer '(record{ to=record {owner = principal "iyn2n-liaaa-aaaak-qddta-cai"; subaccount= opt blob "\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\01";} ; amount=9_000_000;})' --identity default

# dfx canister call ckusdc_ledger icrc1_transfer "(record{ to=record {owner = principal \"$DEFAULT_ACCOUNT\"; subaccount= opt blob \"\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\";} ; amount=9_000_000;})" --identity default

# dfx canister call usdx_ledger icrc1_transfer "(record{ to=record {owner = principal \"$DEFAULT_ACCOUNT\"; subaccount= opt vec{0; 0; 0; 0; 0; 0; 0; 0; 0; 0; 0; 0; 0; 0; 0; 0; 0; 0; 0; 0; 0; 0; 0; 0; 0; 0; 0; 0; 0; 0; 0; 1}}; amount = 9_000_000;})" --identity default

# Get ckUSDC Transaction
dfx canister call ckusdc_ledger get_transactions '( record { start =0; length=3 })'

# Notify stablecoin minter to mint USDx
dfx canister call stablecoin_minter notify_mint_with_ckusdc '(record{ ckusdc_block_index=6; minting_token=variant {USDx}})' --identity default

# Get USDx transactions
dfx canister call usdx_ledger get_transactions '( record { start =0; length=3 })'