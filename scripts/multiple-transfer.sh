#!/bin/bash
export Default=$(dfx identity get-principal --identity default)
export Doxa=$(dfx identity get-principal --identity doxa)

for i in {1..10}; do
echo "Transfer: $i"
if [ $((i % 2)) -eq 0 ]; then
 dfx canister call dusd_ledger icrc1_transfer "(record {to=record{owner= principal \"$Doxa\"}; amount=1_000_000})"  --identity default
else
 dfx canister call dusd_ledger icrc1_transfer "(record {to=record{owner= principal \"$Default\"}; amount=1_000_000})" --identity doxa
fi
done

dfx canister call dusd_ledger icrc1_balance_of "(record {owner=principal \"$Default\"})"
dfx canister call dusd_ledger icrc1_balance_of "(record {owner=principal \"$Doxa\"})"