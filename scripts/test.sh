dfx deploy staking_canister
sleep 10
dfx deploy test
sleep 10
# dfx canister call test test
./scripts/format-test.sh
sleep 2 
dfx canister logs test
