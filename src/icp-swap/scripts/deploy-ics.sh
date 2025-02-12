
Decimals=8
TOKEN_SYMBOL="ICS"
TOKEN_NAME="ICPSwap Token"
TRANSFER_FEE=1_000_000 
METADATA="vec {}"

CANISTER="ics_ledger"


chmod +x ./scripts/deploy-ledger-localy.sh
./scripts/deploy-ledger-localy.sh "$Decimals" "$TOKEN_SYMBOL" "$TOKEN_NAME" "$TRANSFER_FEE" "$METADATA" "$CANISTER"

