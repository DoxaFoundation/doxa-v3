#!/bin/bash

chmod +x ./scripts/deploy-template-index-canister.sh

echo "➤➤➤➤ Deploy DUSD Index Canister"
CANISTER="usdx_index"
LEDGER_ID=$(dfx canister id usdx_ledger)
./scripts/deploy-template-index-canister.sh $CANISTER $LEDGER_ID


echo "➤➤➤➤ Deploy ICP Index Canister"
dfx deploy icp_ledger --argument "(record { ledger_id = principal \"ryjl3-tyaaa-aaaaa-aaaba-cai\" })"


echo "➤➤➤➤ Deploy ckUSDC Index Canister"
CANISTER="ckusdc_index"
LEDGER_ID=$(dfx canister id ckusdc_ledger)
./scripts/deploy-template-index-canister.sh $CANISTER $LEDGER_ID


echo "➤➤➤➤ Deploy ckBTC Index Canister"
CANISTER="ckbtc_index"
LEDGER_ID=$(dfx canister id ckbtc_ledger)
./scripts/deploy-template-index-canister.sh $CANISTER $LEDGER_ID


echo "➤➤➤➤ Deploy ckETH Index Canister"
CANISTER="cketh_index"
LEDGER_ID=$(dfx canister id cketh_ledger)
./scripts/deploy-template-index-canister.sh $CANISTER $LEDGER_ID


echo "➤➤➤➤ Deploy ckUSDT Index Canister"
CANISTER="ckusdt_index"
LEDGER_ID=$(dfx canister id ckusdt_ledger)
./scripts/deploy-template-index-canister.sh $CANISTER $LEDGER_ID
