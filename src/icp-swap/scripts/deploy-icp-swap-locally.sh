

if ! dfx identity list | grep -q minter; then
    # If minter is not found, run the command
    dfx identity new minter
fi

export MINTER_PRINCIPAL=$(dfx identity get-principal --identity minter)


echo

echo "🧪🧪🧪🧪🧪🧪🧪🧪 create all"
dfx canister create --all
echo "🧪🧪🧪🧪🧪🧪🧪🧪 build all"
dfx build
echo

export ICP="$1"
export ICS=$(dfx canister id ics_ledger)

echo "➤➤➤➤ Install canisters"
echo

echo "➤➤➤➤ install ICS"
chmod +x ./scripts/deploy-ics.sh
./scripts/deploy-ics.sh

echo "➤➤➤➤ install price"
dfx deploy price

echo "➤➤➤➤ install base_index"
dfx deploy base_index --argument="(principal \"$(dfx canister id price)\", principal \"$(dfx canister id node_index)\")"

echo "➤➤➤➤ install node_index"
dfx deploy node_index --argument="(\"$(dfx canister id base_index)\", \"$(dfx canister id price)\")"


echo "➤➤➤➤ install SwapFeeReceiver"
dfx canister install SwapFeeReceiver --argument="(principal \"$(dfx canister id SwapFactory)\", record {address=\"$ICP\"; standard=\"ICP\"}, record {address=\"$ICS\"; standard=\"ICS\"}, principal \"$MINTER_PRINCIPAL\")"

echo "➤➤➤➤ install TrustedCanisterManager"
dfx canister install TrustedCanisterManager --argument="(null)"

echo "➤➤➤➤ install SwapDataBackup"
dfx canister install SwapDataBackup --argument="(principal \"$(dfx canister id SwapFactory)\", null)"

echo "➤➤➤➤ install SwapFactory"
dfx canister install SwapFactory --argument="(principal \"$(dfx canister id base_index)\", principal \"$(dfx canister id SwapFeeReceiver)\", principal \"$(dfx canister id PasscodeManager)\", principal \"$(dfx canister id TrustedCanisterManager)\", principal \"$(dfx canister id SwapDataBackup)\", opt principal \"$MINTER_PRINCIPAL\")"


echo "➤➤➤➤ install PasscodeManager"
dfx canister install PasscodeManager --argument="(principal \"$ICP\", 100_000_000, principal \"$(dfx canister id SwapFactory)\", principal \"$MINTER_PRINCIPAL\")"


echo "➤➤➤➤ install SwapCalculator"
dfx deploy SwapCalculator


echo "➤➤➤➤ Deploy all ledgers"
chmod +x ./scripts/deploy-ledgers.sh
./scripts/deploy-ledgers.sh

