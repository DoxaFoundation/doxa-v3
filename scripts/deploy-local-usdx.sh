#########################################################################################
########################### Deploy local USDx ledger canister ###########################
#########################################################################################

# The archive controller
export ARCHIVE_CONTROLLER=$(dfx canister id root_canister)

# canister id of stable coin minter as minting account
export MINTER_ACCOUNT=$(dfx canister id stablecoin_minter)

TOKEN_NAME="Doxa Dollar"
TOKEN_SYMBOL="USDx"

PRE_MINTED_TOKENS=0

# Fee is 0.001 USDx
TRANSFER_FEE=100_000

TRIGGER_THRESHOLD=2000
NUM_OF_BLOCK_TO_ARCHIVE=1000
CYCLE_FOR_ARCHIVE_CREATION=10000_000_000_000
FEATURE_FLAGS=true

dfx deploy usdx_ledger  --argument "(variant {Init = 
record {
     token_symbol = \"${TOKEN_SYMBOL}\";
     token_name = \"${TOKEN_NAME}\";
     minting_account = record { owner = principal \"${MINTER_ACCOUNT}\" };
     transfer_fee = ${TRANSFER_FEE};
     metadata = vec {};
     feature_flags = opt record{icrc2 = ${FEATURE_FLAGS}};
     initial_balances = vec { record { record { owner = principal \"${MINTER_ACCOUNT}\"; }; ${PRE_MINTED_TOKENS}; }; };
     archive_options = record {
         num_blocks_to_archive = ${NUM_OF_BLOCK_TO_ARCHIVE};
         trigger_threshold = ${TRIGGER_THRESHOLD};
         controller_id = principal \"${ARCHIVE_CONTROLLER}\";
         cycles_for_archive_creation = opt ${CYCLE_FOR_ARCHIVE_CREATION};
     };
 }
})"

######################################################################################
######################################################################################