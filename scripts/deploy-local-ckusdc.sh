############### Local ckUSDC
Decimals=6
TOKEN_SYMBOL="ckUSDC"
TOKEN_NAME="ckUSDC"
TRANSFER_FEE=10_000
METADATA="vec {
    record {
      \"icrc1:logo\";
      variant {
        Text = \"data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTQ2IiBoZWlnaHQ9IjE0NiIgdmlld0JveD0iMCAwIDE0NiAxNDYiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxNDYiIGhlaWdodD0iMTQ2IiByeD0iNzMiIGZpbGw9IiMzQjAwQjkiLz4KPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0xNi4zODM3IDc3LjIwNTJDMTguNDM0IDEwNS4yMDYgNDAuNzk0IDEyNy41NjYgNjguNzk0OSAxMjkuNjE2VjEzNS45NEMzNy4zMDg3IDEzMy44NjcgMTIuMTMzIDEwOC42OTEgMTAuMDYwNSA3Ny4yMDUySDE2LjM4MzdaIiBmaWxsPSJ1cmwoI3BhaW50MF9saW5lYXJfMTEwXzYwNCkiLz4KPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik02OC43NjQ2IDE2LjM1MzRDNDAuNzYzOCAxOC40MDM2IDE4LjQwMzcgNDAuNzYzNyAxNi4zNTM1IDY4Ljc2NDZMMTAuMDMwMyA2OC43NjQ2QzEyLjEwMjcgMzcuMjc4NCAzNy4yNzg1IDEyLjEwMjYgNjguNzY0NiAxMC4wMzAyTDY4Ljc2NDYgMTYuMzUzNFoiIGZpbGw9IiMyOUFCRTIiLz4KPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0xMjkuNjE2IDY4LjczNDNDMTI3LjU2NiA0MC43MzM0IDEwNS4yMDYgMTguMzczMyA3Ny4yMDUxIDE2LjMyMzFMNzcuMjA1MSA5Ljk5OTk4QzEwOC42OTEgMTIuMDcyNCAxMzMuODY3IDM3LjI0ODEgMTM1LjkzOSA2OC43MzQzTDEyOS42MTYgNjguNzM0M1oiIGZpbGw9InVybCgjcGFpbnQxX2xpbmVhcl8xMTBfNjA0KSIvPgo8cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTc3LjIzNTQgMTI5LjU4NkMxMDUuMjM2IDEyNy41MzYgMTI3LjU5NiAxMDUuMTc2IDEyOS42NDcgNzcuMTc0OUwxMzUuOTcgNzcuMTc0OUMxMzMuODk3IDEwOC42NjEgMTA4LjcyMiAxMzMuODM3IDc3LjIzNTQgMTM1LjkwOUw3Ny4yMzU0IDEyOS41ODZaIiBmaWxsPSIjMjlBQkUyIi8+CjxwYXRoIGQ9Ik04OS4yMjUzIDgyLjMzOTdDODkuMjI1MyA3My43Mzc1IDg0LjA2MjggNzAuNzg3NSA3My43Mzc4IDY5LjU1NDRDNjYuMzYyOCA2OC41NjkxIDY0Ljg4NzggNjYuNjA0NCA2NC44ODc4IDYzLjE2NDdDNjQuODg3OCA1OS43MjUgNjcuMzQ4MSA1Ny41MTI1IDcyLjI2MjggNTcuNTEyNUM3Ni42ODc4IDU3LjUxMjUgNzkuMTQ4MSA1OC45ODc1IDgwLjM3NTMgNjIuNjc1QzgwLjYyMzEgNjMuNDEyNSA4MS4zNjA2IDYzLjkwMjIgODIuMDk4MSA2My45MDIySDg2LjAzMzRDODcuMDE4NyA2My45MDIyIDg3Ljc1NjIgNjMuMTY0NyA4Ny43NTYyIDYyLjE3OTRWNjEuOTMxNkM4Ni43NzA5IDU2LjUyMTMgODIuMzQ1OSA1Mi4zNDQxIDc2LjY5MzcgNTEuODU0NFY0NS45NTQ0Qzc2LjY5MzcgNDQuOTY5MSA3NS45NTYyIDQ0LjIzMTYgNzQuNzI5IDQzLjk4OTdINzEuMDQxNUM3MC4wNTYyIDQzLjk4OTcgNjkuMzE4NyA0NC43MjcyIDY5LjA3NjggNDUuOTU0NFY1MS42MDY2QzYxLjcwMTggNTIuNTkxOSA1Ny4wMjkgNTcuNTA2NiA1Ny4wMjkgNjMuNjU0NEM1Ny4wMjkgNzEuNzY2OSA2MS45NDM3IDc0Ljk2NDcgNzIuMjY4NyA3Ni4xOTE5Qzc5LjE1NCA3Ny40MTkxIDgxLjM2NjUgNzguODk0MSA4MS4zNjY1IDgyLjgyOTRDODEuMzY2NSA4Ni43NjQ3IDc3LjkyNjggODkuNDY2OSA3My4yNTQgODkuNDY2OUM2Ni44NjQzIDg5LjQ2NjkgNjQuNjUxOCA4Ni43NjQ3IDYzLjkxNDMgODMuMDc3MkM2My42NjY1IDgyLjA5MTkgNjIuOTI5IDgxLjYwMjIgNjIuMTkxNSA4MS42MDIySDU4LjAxNDNDNTcuMDI5IDgxLjYwMjIgNTYuMjkxNSA4Mi4zMzk3IDU2LjI5MTUgODMuMzI1VjgzLjU3MjhDNTcuMjc2OCA4OS43MjA2IDYxLjIwNjIgOTQuMTQ1NiA2OS4zMTg3IDk1LjM3MjhWMTAxLjI3M0M2OS4zMTg3IDEwMi4yNTggNzAuMDU2MiAxMDIuOTk2IDcxLjI4MzQgMTAzLjIzN0g3NC45NzA5Qzc1Ljk1NjIgMTAzLjIzNyA3Ni42OTM3IDEwMi41IDc2LjkzNTYgMTAxLjI3M1Y5NS4zNzI4Qzg0LjMwNDcgOTQuMTM5NyA4OS4yMjUzIDg4Ljk3NzIgODkuMjI1MyA4Mi4zMzk3WiIgZmlsbD0id2hpdGUiLz4KPHBhdGggZD0iTTYwLjQ2MjYgMTA4LjE1MkM0MS4yODc2IDEwMS4yNjcgMzEuNDUyMyA3OS44Nzk0IDM4LjU4NTQgNjAuOTUyMkM0Mi4yNzI5IDUwLjYyNzIgNTAuMzg1NCA0Mi43NjI1IDYwLjQ2MjYgMzkuMDc1QzYxLjQ0NzggMzguNTg1MyA2MS45Mzc1IDM3Ljg0NzggNjEuOTM3NSAzNi42MTQ3VjMzLjE3NUM2MS45Mzc1IDMyLjE4OTcgNjEuNDQ3OCAzMS40NTIyIDYwLjQ2MjYgMzEuMjEwM0M2MC4yMTQ4IDMxLjIxMDMgNTkuNzI1MSAzMS4yMTAzIDU5LjQ3NzMgMzEuNDU4MUMzNi4xMjUxIDM4LjgzMzEgMjMuMzM5OCA2My42NjAzIDMwLjcxNDggODcuMDE4NEMzNS4xMzk4IDEwMC43ODMgNDUuNzEyNiAxMTEuMzU2IDU5LjQ3NzMgMTE1Ljc4MUM2MC40NjI2IDExNi4yNzEgNjEuNDQyIDExNS43ODEgNjEuNjg5OCAxMTQuNzk2QzYxLjkzNzYgMTE0LjU0OCA2MS45Mzc1IDExNC4zMDYgNjEuOTM3NSAxMTMuODFWMTEwLjM3MUM2MS45Mzc1IDEwOS42MjcgNjEuMjAwMSAxMDguNjQ4IDYwLjQ2MjYgMTA4LjE1MlpNODYuNTE2OSAzMS40NTIyQzg1LjUzMTYgMzAuOTYyNSA4NC41NTIyIDMxLjQ1MjIgODQuMzA0NCAzMi40Mzc1Qzg0LjA1NjYgMzIuNjg1MyA4NC4wNTY2IDMyLjkyNzIgODQuMDU2NiAzMy40MjI4VjM2Ljg2MjVDODQuMDU2NiAzNy44NDc4IDg0Ljc5NDIgMzguODI3MiA4NS41MzE3IDM5LjMyMjhDMTA0LjcwNyA0Ni4yMDgxIDExNC41NDIgNjcuNTk1NiAxMDcuNDA5IDg2LjUyMjhDMTAzLjcyMSA5Ni44NDc4IDk1LjYwODggMTA0LjcxMyA4NS41MzE3IDEwOC40Qzg0LjU0NjMgMTA4Ljg5IDg0LjA1NjYgMTA5LjYyNyA4NC4wNTY2IDExMC44NlYxMTQuM0M4NC4wNTY2IDExNS4yODUgODQuNTQ2MyAxMTYuMDIzIDg1LjUzMTcgMTE2LjI2NUM4NS43Nzk0IDExNi4yNjUgODYuMjY5MSAxMTYuMjY1IDg2LjUxNjkgMTE2LjAxN0MxMDkuODY5IDEwOC42NDIgMTIyLjY1NCA4My44MTQ3IDExNS4yNzkgNjAuNDU2NkMxMTAuODU0IDQ2LjQ1IDEwMC4wNCAzNS44NzcyIDg2LjUxNjkgMzEuNDUyMloiIGZpbGw9IndoaXRlIi8+CjxkZWZzPgo8bGluZWFyR3JhZGllbnQgaWQ9InBhaW50MF9saW5lYXJfMTEwXzYwNCIgeDE9IjUzLjQ3MzYiIHkxPSIxMjIuNzkiIHgyPSIxNC4wMzYyIiB5Mj0iODkuNTc4NiIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPgo8c3RvcCBvZmZzZXQ9IjAuMjEiIHN0b3AtY29sb3I9IiNFRDFFNzkiLz4KPHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjNTIyNzg1Ii8+CjwvbGluZWFyR3JhZGllbnQ+CjxsaW5lYXJHcmFkaWVudCBpZD0icGFpbnQxX2xpbmVhcl8xMTBfNjA0IiB4MT0iMTIwLjY1IiB5MT0iNTUuNjAyMSIgeDI9IjgxLjIxMyIgeTI9IjIyLjM5MTQiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KPHN0b3Agb2Zmc2V0PSIwLjIxIiBzdG9wLWNvbG9yPSIjRjE1QTI0Ii8+CjxzdG9wIG9mZnNldD0iMC42ODQxIiBzdG9wLWNvbG9yPSIjRkJCMDNCIi8+CjwvbGluZWFyR3JhZGllbnQ+CjwvZGVmcz4KPC9zdmc+Cg==\"
      };
    };
    record { \"icrc1:decimals\"; variant { Nat = 6 : nat } };
    record { \"icrc1:name\"; variant { Text = \"ckUSDC\" } };
    record { \"icrc1:symbol\"; variant { Text = \"ckUSDC\" } };
    record { \"icrc1:fee\"; variant { Nat = 10_000 : nat } };
    record { \"icrc1:max_memo_length\"; variant { Nat = 80 : nat } };
  }"

if ! dfx identity list | grep -q minter; then
    # If minter is not found, run the command
    dfx identity new minter
fi

export MINTER_PRINCIPAL=$(dfx identity get-principal --identity minter)
export DEFAULT_ACCOUNT=$(dfx identity get-principal --identity default)
export DOXA_ACCOUNT=$(dfx identity get-principal --identity doxa)

# Mint 1000 ckUSDC
PRE_MINTED_TOKENS=1000_000_000
TRIGGER_THRESHOLD=2000
NUM_OF_BLOCK_TO_ARCHIVE=1000
CYCLE_FOR_ARCHIVE_CREATION=10_000_000_000_000
FEATURE_FLAGS=true

ARCHIVE_OPTIONS="record {
  num_blocks_to_archive = $NUM_OF_BLOCK_TO_ARCHIVE;
  max_transactions_per_response = null;
  trigger_threshold = $TRIGGER_THRESHOLD;
  more_controller_ids = null;
  max_message_size_bytes = null;
  cycles_for_archive_creation = null;
  node_max_memory_size_bytes = null;
  controller_id = principal \"$DEFAULT_ACCOUNT\";
}"

dfx deploy ckusdc_ledger --argument "( variant { Init = record {
  decimals = opt ${Decimals};
  token_symbol = \"${TOKEN_SYMBOL}\";
  transfer_fee = ${TRANSFER_FEE};
  metadata = ${METADATA};
  minting_account = record { owner = principal \"${MINTER_PRINCIPAL}\" };
  initial_balances = vec { record {  record { owner = principal \"$DEFAULT_ACCOUNT\"}; ${PRE_MINTED_TOKENS}}; record {  record { owner = principal \"$DOXA_ACCOUNT\"}; ${PRE_MINTED_TOKENS} }};
  maximum_number_of_accounts = null;
  accounts_overflow_trim_quantity = null;
  fee_collector_account = null;
  archive_options = $ARCHIVE_OPTIONS;
  max_memo_length = opt 80;
  token_name = \"$TOKEN_NAME\";
  feature_flags = opt record{icrc2 = ${FEATURE_FLAGS}};
}
})"
