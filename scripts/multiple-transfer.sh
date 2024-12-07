#!/bin/sh
export Default=$(dfx identity get-principal --identity default)
export Doxa=$(dfx identity get-principal --identity doxa)

for i in {1..10}; do
echo "Transfer: $i"
if [ $((i % 2)) -eq 0 ]; then
 dfx canister call usdx_ledger icrc1_transfer "(record {to=record{owner= principal \"$Doxa\"}; amount=2_009_001})"  --identity default
 dfx canister call ckusdc_ledger icrc1_transfer "(record {to=record{owner= principal \"$Doxa\"}; amount=1_800_990})"  --identity default
else
 dfx canister call usdx_ledger icrc1_transfer "(record {to=record{owner= principal \"$Default\"}; amount=2_167_000})" --identity doxa
  dfx canister call ckusdc_ledger icrc1_transfer "(record {to=record{owner= principal \"$Default\"}; amount=3_198_000})" --identity doxa
fi
done

dfx canister call usdx_ledger icrc1_balance_of "(record {owner=principal \"$Default\"})"
dfx canister call usdx_ledger icrc1_balance_of "(record {owner=principal \"$Doxa\"})"

dfx canister call ckusdc_ledger icrc1_balance_of "(record {owner=principal \"$Default\"})"
dfx canister call ckusdc_ledger icrc1_balance_of "(record {owner=principal \"$Doxa\"})"