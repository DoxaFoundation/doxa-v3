#!/bin/bash

# Get USDX ledger canister ID
USDX_LEDGER_ID=$(dfx canister id usdx_ledger)

echo "Deploying USDX Index canister..."
echo "USDX Ledger ID: $USDX_LEDGER_ID"

# Deploy index canister with initialization arguments
dfx deploy usdx_index --argument "(opt variant { Init = record { ledger_id = principal \"$USDX_LEDGER_ID\"; retrieve_blocks_from_ledger_interval_seconds = opt 10; } })"

echo "USDX Index canister deployed successfully!"
