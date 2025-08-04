#!/bin/bash


echo "➤➤➤➤ Create all canisters"
dfx canister create --all

# echo "➤➤➤➤ Build all canisters"
dfx build

echo "➤➤➤➤ Deploy internet_identity"
dfx deploy internet_identity

echo "➤➤➤➤ Deploy exchange_rate_canister"
dfx deploy exchange_rate_canister


# dfx canister create ckusdc_pool --specified-id ieja4-4iaaa-aaaak-qddra-cai

# Creating Local DUSD Ledger before deploying stablecoin_minter (stablecoin_minter is a dependency of dusd_ledger)
dfx canister create dusd_ledger

# Creating Local stablecoin_minter , root_canister before deploying dusd_ledger (These are minteraccount and archivecontroller for dusd_ledger)
# dfx canister create stablecoin_minter --specified-id iyn2n-liaaa-aaaak-qddta-cai
# dfx canister create root_canister --specified-id iwpxf-qyaaa-aaaak-qddsa-cai

dfx deploy stablecoin_minter

dfx deploy root_canister

dfx deploy ckusdc_pool


dfx deploy staking_canister --specified-id mhahe-xqaaa-aaaag-qndha-cai


dfx deploy utility_canister
# sleep 10
echo "➤➤➤➤ Deploy all ledgers"
chmod +x ./scripts/deploy-ledgers.sh
./scripts/deploy-ledgers.sh


# sleep 10
echo "➤➤➤➤ Deploy all index canisters"
chmod +x ./scripts/deploy-index-canisters.sh
./scripts/deploy-index-canisters.sh
