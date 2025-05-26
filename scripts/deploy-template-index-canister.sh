CANISTER="$1"
LEDGER_ID="$2"

dfx deploy $CANISTER --argument "(opt  variant {
    Init= record {
        ledger_id= principal \"$LEDGER_ID\";
        retrieve_blocks_from_ledger_interval_seconds = opt 10;
    }
})"