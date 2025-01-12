#!/bin/sh

# check usdx balance 
dfx canister call usdx_ledger icrc1_balance_of '(record {owner= principal "5g24m-kxyrd-yb7wl-up5k6-4egww-miul7-gajat-e2d7i-mdpc7-6dduf-eae"})' --identity default

# transfer ckusdc to stable coin minter address to get same amount of usdx
dfx canister call ckusdc_ledger icrc1_transfer '(record{ to=record {owner = principal "iyn2n-liaaa-aaaak-qddta-cai"; subaccount= opt blob "\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\00\01";} ; amount=500_000_000;})' --identity default

# notify with block index
dfx canister call stablecoin_minter notify_mint_with_ckusdc '(record{ ckusdc_block_index=3; minting_token=variant {USDx}})' --identity default


# you can check again usdx balance 
dfx canister call usdx_ledger icrc1_balance_of '(record {owner= principal "5g24m-kxyrd-yb7wl-up5k6-4egww-miul7-gajat-e2d7i-mdpc7-6dduf-eae"})' --identity default

# transfer usdx to staking canister 
dfx canister call usdx_ledger icrc1_transfer '(record{ to=record {owner = principal "mhahe-xqaaa-aaaag-qndha-cai"; subaccount= null}; amount = 10_000_000;})' --identity default

# notify with block index
dfx canister call staking_canister notifyStake '(1, 2_592_000_000_000_000)'

# pool data
dfx canister call staking_canister getPoolData

#matric
dfx canister call staking_canister calculateUserStakeMatric '(0 : nat, principal "5g24m-kxyrd-yb7wl-up5k6-4egww-miul7-gajat-e2d7i-mdpc7-6dduf-eae")'
# user stake data
dfx canister call staking_canister getUserStakeDetails
# pool data
dfx canister call staking_canister getPoolData
# pool data
dfx canister call staking_canister getPoolData
# pool data
dfx canister call staking_canister getPoolData
