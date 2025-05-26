#!/usr/bin/env bash

# The archive controller
export ARCHIVE_CONTROLLER=$(dfx canister id root_canister --ic)

# canister id of stable coin minter as minting account
export MINTER_ACCOUNT=$(dfx canister id stablecoin_minter --ic)

# canister id of ckusdc_pool as Fee collector
export FEE_COLLECTOR_ACCOUNT=$(dfx canister id ckusdc_pool --ic)

TOKEN_NAME="Doxa Dollar"
TOKEN_SYMBOL="DUSD"
Decimals=6

PRE_MINTED_TOKENS=0

# Fee is 0.01 USDx
TRANSFER_FEE=10_000

TRIGGER_THRESHOLD=2000
NUM_OF_BLOCK_TO_ARCHIVE=1000
CYCLE_FOR_ARCHIVE_CREATION=10_000_000_000_000
FEATURE_FLAGS=true
MAX_MEMO_LENGTH=80

LOGO_BASE64_ENCODED_SVG="data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+CjwhLS0gQ3JlYXRlZCB3aXRoIFZlY3Rvcm5hdG9yIChodHRwOi8vdmVjdG9ybmF0b3IuaW8vKSAtLT4KPHN2ZyBoZWlnaHQ9IjEwMCUiIHN0cm9rZS1taXRlcmxpbWl0PSIxMCIgc3R5bGU9ImZpbGwtcnVsZTpub256ZXJvO2NsaXAtcnVsZTpldmVub2RkO3N0cm9rZS1saW5lY2FwOnJvdW5kO3N0cm9rZS1saW5lam9pbjpyb3VuZDsiIHZlcnNpb249IjEuMSIgdmlld0JveD0iMCAwIDEwMjQgMTAyNCIgd2lkdGg9IjEwMCUiIHhtbDpzcGFjZT0icHJlc2VydmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiPgo8ZGVmcy8+CjxnIGlkPSJMYXllci0xIi8+CjxjbGlwUGF0aCBpZD0iQXJ0Ym9hcmRGcmFtZSI+CjxyZWN0IGhlaWdodD0iMTAyNCIgd2lkdGg9IjEwMjQiIHg9IjAiIHk9IjAiLz4KPC9jbGlwUGF0aD4KPGcgY2xpcC1wYXRoPSJ1cmwoI0FydGJvYXJkRnJhbWUpIiBpZD0iQmctMiI+CjxwYXRoIGQ9Ik0wIDUxMkMwIDIyOS4yMyAyMjkuMjMgMCA1MTIgMEM3OTQuNzcgMCAxMDI0IDIyOS4yMyAxMDI0IDUxMkMxMDI0IDc5NC43NyA3OTQuNzcgMTAyNCA1MTIgMTAyNEMyMjkuMjMgMTAyNCAwIDc5NC43NyAwIDUxMloiIGZpbGw9IiMwMDAwMDAiIGZpbGwtcnVsZT0ibm9uemVybyIgb3BhY2l0eT0iMSIgc3Ryb2tlPSJub25lIi8+CjwvZz4KPGcgaWQ9IkZvcmVncm91bmQiPgo8cGF0aCBkPSJNNTY0LjQ1MyA3NjkuMjA1TDM0My4wOTQgNzY5LjIwNUwzNDMuMDk0IDI1NS4zNzVMNTY0LjQ1MyAyNTUuMzc1QzU5Ni4yOTEgMjU1Ljg0IDYyMi43ODQgMjU5LjU1OCA2NDMuOTMzIDI2Ni41M0M2NzkuOTU0IDI3OC4zODIgNzA5LjEyIDMwMC4xMTEgNzMxLjQzIDMzMS43MTdDNzQ5LjMyNSAzNTcuMjgxIDc2MS41MjYgMzg0LjkzNiA3NjguMDMzIDQxNC42ODNDNzc0LjU0IDQ0NC40MyA3NzcuNzkzIDQ3Mi43ODMgNzc3Ljc5MyA0OTkuNzQxQzc3Ny43OTMgNTY4LjA2NiA3NjQuMDgyIDYyNS45MzIgNzM2LjY1OSA2NzMuMzQyQzY5OS40NzYgNzM3LjI1MSA2NDIuMDczIDc2OS4yMDUgNTY0LjQ1MyA3NjkuMjA1Wk02NDQuMjgxIDM4Ni40NDdDNjI3Ljc4MSAzNTguNTU5IDU5NS4xMjkgMzQ0LjYxNSA1NDYuMzI2IDM0NC42MTVMNDQ3LjMyNCAzNDQuNjE1TDQ0Ny4zMjQgNjc5Ljk2NUw1NDYuMzI2IDY3OS45NjVDNTk2Ljk4OCA2NzkuOTY1IDYzMi4zMTMgNjU0Ljk4MiA2NTIuMjk5IDYwNS4wMTdDNjYzLjIyMiA1NzcuNTk0IDY2OC42ODMgNTQ0Ljk0MiA2NjguNjgzIDUwNy4wNjFDNjY4LjY4MyA0NTQuNzcyIDY2MC41NDkgNDE0LjU2NyA2NDQuMjgxIDM4Ni40NDdaIiBmaWxsPSIjZmZmZmZmIiBvcGFjaXR5PSIxIiBzdHJva2U9Im5vbmUiLz4KPC9nPgo8ZyBpZD0iTGF5ZXItMiI+CjxwYXRoIGQ9Ik0zODEgMTYwTDQ1MCAxNjBMNDUwIDI1NkwzODEgMjU2TDM4MSAxNjBaIiBmaWxsPSIjZmZmZmZmIiBmaWxsLXJ1bGU9Im5vbnplcm8iIG9wYWNpdHk9IjEiIHN0cm9rZT0ibm9uZSIvPgo8cGF0aCBkPSJNNTEyIDE2MEw1ODEgMTYwTDU4MSAyODcuMTU0TDUxMiAyODcuMTU0TDUxMiAxNjBaIiBmaWxsPSIjZmZmZmZmIiBmaWxsLXJ1bGU9Im5vbnplcm8iIG9wYWNpdHk9IjEiIHN0cm9rZT0ibm9uZSIvPgo8cGF0aCBkPSJNMzgxIDc1NC45MDRMNDUwIDc1NC45MDRMNDUwIDg2NEwzODEgODY0TDM4MSA3NTQuOTA0WiIgZmlsbD0iI2ZmZmZmZiIgZmlsbC1ydWxlPSJub256ZXJvIiBvcGFjaXR5PSIxIiBzdHJva2U9Im5vbmUiLz4KPHBhdGggZD0iTTUxMiA3MzYuODQyTDU4MSA3MzYuODQyTDU4MSA4NjRMNTEyIDg2NEw1MTIgNzM2Ljg0MloiIGZpbGw9IiNmZmZmZmYiIGZpbGwtcnVsZT0ibm9uemVybyIgb3BhY2l0eT0iMSIgc3Ryb2tlPSJub25lIi8+CjwvZz4KPC9zdmc+Cg=="

METADATA="vec {
    record {
      \"icrc1:logo\";
      variant {
        Text = \"$LOGO_BASE64_ENCODED_SVG\"
      };
    };
  }"

dfx deploy usdx_ledger --ic --argument "(variant {Init = 
record {
     decimals = opt ${Decimals};
     token_symbol = \"${TOKEN_SYMBOL}\";
     token_name = \"${TOKEN_NAME}\";
     minting_account = record { owner = principal \"${MINTER_ACCOUNT}\" };
     transfer_fee = ${TRANSFER_FEE};
     metadata = $METADATA;
     feature_flags = opt record{icrc2 = ${FEATURE_FLAGS}};
     initial_balances = vec {};
     maximum_number_of_accounts = null;
     accounts_overflow_trim_quantity = null;
     fee_collector_account = opt record { owner = principal \"${FEE_COLLECTOR_ACCOUNT}\" };
     max_memo_length = opt $MAX_MEMO_LENGTH;
     archive_options = record {
         num_blocks_to_archive = ${NUM_OF_BLOCK_TO_ARCHIVE};
         trigger_threshold = ${TRIGGER_THRESHOLD};
         controller_id = principal \"${ARCHIVE_CONTROLLER}\";
         cycles_for_archive_creation = opt ${CYCLE_FOR_ARCHIVE_CREATION};
         max_transactions_per_response = null;
         more_controller_ids = null;
         max_message_size_bytes = null;
         node_max_memory_size_bytes = null;
     };
 }
})"