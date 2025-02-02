############### Local ckUSDC
Decimals=8
TOKEN_SYMBOL="ICS"
TOKEN_NAME="ICPSwap Token"
TRANSFER_FEE=1_000_000 
METADATA="vec {
    record { \"icrc1:decimals\"; variant { Nat = 8 : nat } };
    record { \"icrc1:name\"; variant { Text = \"ICPSwap Token\" } };
    record { \"icrc1:symbol\"; variant { Text = \"ICS\" } };
    record { \"icrc1:fee\"; variant { Nat = 1_000_000 : nat } };
    record { \"icrc1:max_memo_length\"; variant { Nat = 32 : nat } };
  }"

if ! dfx identity list | grep -q minter; then
    # If minter is not found, run the command
    dfx identity new minter
fi

export MINTER_PRINCIPAL=$(dfx identity get-principal --identity minter)
export DEFAULT_ACCOUNT=$(dfx identity get-principal --identity default)
export DOXA_ACCOUNT=$(dfx identity get-principal --identity doxa)

# Mint 1000 ckUSDC
PRE_MINTED_TOKENS=1000_000_000_00
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

dfx deploy ics_ledger --argument "( variant { Init = record {
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

