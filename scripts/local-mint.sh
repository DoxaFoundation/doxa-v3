export DEFAULT_ACCOUNT=$(dfx identity get-principal --identity default)
export DOXA_ACCOUNT=$(dfx identity get-principal --identity doxa)

# USDx Balance of default idenity
dfx canister call usdx_ledger icrc1_balance_of "(record {owner= principal \"$DEFAULT_ACCOUNT\"})" --identity default

# ckUSDC Balance of default idenity
dfx canister call ckusdc_ledger icrc1_balance_of "(record {owner= principal \"$DEFAULT_ACCOUNT\"})" --identity default

# Get (ckUSDC) Reserve Account of USDx 
export CKUSDC_RESERVE_ACCOUNT=$(dfx canister call stablecoin_minter get_ckusdc_reserve_account_of '(record {token= variant {USDx}})')

# Transfer ckUSDC from default identity to Reserve Account of USDx
export RESPONSE=$(dfx canister call ckusdc_ledger icrc1_transfer "(record{ to=$CKUSDC_RESERVE_ACCOUNT ; amount=900_000_000;})" --identity default)
echo RESPONSE;
# dfx canister call ckusdc_ledger icrc1_transfer '(record{ to=record {owner = principal "5g24m-kxyrd-yb7wl-up5k6-4egww-miul7-gajat-e2d7i-mdpc7-6dduf-eae"; subaccount= opt blob "\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00";} ; amount=100_000_000;})' --identity default

# dfx canister call usdx_ledger icrc1_transfer '(record{ to=record {owner = principal "bd3sg-teaaa-aaaaa-qaaba-cai"; subaccount= opt vec{0; 0; 0; 0; 0; 0; 0; 0; 0; 0; 0; 0; 0; 0; 0; 0; 0; 0; 0; 0; 0; 0; 0; 0; 0; 0; 0; 0; 0; 0; 0; 0}}; amount = 10_000_000;})' --identity default

# Get ckUSDC Transaction
dfx canister call ckusdc_ledger get_transactions '( record { start =0; length=3 })'

# Notify stablecoin minter to mint USDx
dfx canister call stablecoin_minter notify_mint_with_ckusdc '(record{ ckusdc_block_index=8; minting_token=variant {USDx}})' --identity default

# Get USDx transactions
dfx canister call usdx_ledger get_transactions '( record { start =0; length=3 })'

# trnsfer to staking canister
# dfx canister call usdx_ledger icrc1_transfer '(record{ to=record {owner = principal "be2us-64aaa-aaaaa-qaabq-cai"; subaccount= null}; amount = 100_000_000;})' --identity default

#notify to staking canister so it aware about to send usdx to it 
# dfx canister call staking_canister notifyStake

# dfx canister call usdx_ledger icrc1_balance_of '(record {owner= principal "ieja4-4iaaa-aaaak-qddra-cai"})' --identity default