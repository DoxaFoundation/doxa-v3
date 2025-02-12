
echo "➤➤➤➤ Deploy ckBTC"
Decimals=8
TOKEN_SYMBOL="ckBTC"
TOKEN_NAME="ckBTC"
TRANSFER_FEE=10 
METADATA="vec {}"
CANISTER="ckbtc_ledger"

./scripts/deploy-ledger-localy.sh $Decimals "$TOKEN_SYMBOL" "$TOKEN_NAME" "$TRANSFER_FEE" "$METADATA" "$CANISTER" 2

echo "➤➤➤➤ Deploy ckETH"
Decimals=18
TOKEN_SYMBOL="ckETH"
TOKEN_NAME="ckETH"
TRANSFER_FEE=2_000_000_000_000 
METADATA="vec {}"
CANISTER="cketh_ledger"

./scripts/deploy-ledger-localy.sh $Decimals "$TOKEN_SYMBOL" "$TOKEN_NAME" "$TRANSFER_FEE" "$METADATA" "$CANISTER" 5


echo "➤➤➤➤ Deploy ckUSDT"
Decimals=6
TOKEN_SYMBOL="ckUSDT"
TOKEN_NAME="ckUSDT"
TRANSFER_FEE=10_000
METADATA="vec {}"
CANISTER="ckusdt_ledger"

./scripts/deploy-ledger-localy.sh $Decimals "$TOKEN_SYMBOL" "$TOKEN_NAME" "$TRANSFER_FEE" "$METADATA" "$CANISTER" 8000
