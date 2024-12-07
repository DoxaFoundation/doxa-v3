# USDx Balance of default idenity
dfx canister call usdx_ledger icrc1_balance_of '(record {owner= principal "jtfmz-pvild-ruqbe-kxi7g-der7l-dpmff-4bgia-p33k6-b55rh-g44eb-2qe"})' --identity default

# ckUSDC Balance of default idenity
dfx canister call ckusdc_ledger icrc1_balance_of '(record {owner= principal "jtfmz-pvild-ruqbe-kxi7g-der7l-dpmff-4bgia-p33k6-b55rh-g44eb-2qe"})' --identity default

# Get (ckUSDC) Reserve Account of USDx 
dfx canister call stablecoin_minter get_ckusdc_reserve_account_of '(record {token= variant {USDx}})'

# Transfer ckUSDC from default identity to Reserve Account of USDx
dfx canister call ckusdc_ledger icrc1_transfer '(record{ to=record {owner = principal "iyn2n-liaaa-aaaak-qddta-cai"; subaccount= opt blob "\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\01";} ; amount=9_000_000;})' --identity default
# dfx canister call ckusdc_ledger icrc1_transfer '(record{ to=record {owner = principal "iyn2n-liaaa-aaaak-qddta-cai"; subaccount= opt vec{0; 0; 0; 0; 0; 0; 0; 0; 0; 0; 0; 0; 0; 0; 0; 0; 0; 0; 0; 0; 0; 0; 0; 0; 0; 0; 0; 0; 0; 0; 0; 1}}; amount = 3_000_000;})' --identity default

# Get ckUSDC Transaction
dfx canister call ckusdc_ledger get_transactions '( record { start =0; length=3 })'

# Notify stablecoin minter to mint USDx
dfx canister call stablecoin_minter notify_mint_with_ckusdc '(record{ ckusdc_block_index=1; minting_token=variant {USDx}})' --identity default

# Get USDx transactions
dfx canister call usdx_ledger get_transactions '( record { start =0; length=3 })'