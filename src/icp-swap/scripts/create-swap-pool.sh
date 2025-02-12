Token0="$1"
Token1="$2"
ICP="$3"

# Use ICP.icrc2_approve to approve PasscodeManager to transfer SwapPool creation fees from current principal.
dfx canister call $ICP icrc2_approve "(record{
    amount=100_050_000;
    spender=record {owner= principal \"$(dfx canister id PasscodeManager)\";}}
)"

# Use PasscodeManager.depositFrom to transfer ICP from the caller to PasscodeManager.
dfx canister call PasscodeManager depositFrom  "({
    fee = 10_000;
    amount = 100_000_000;
})"

# Use PasscodeManager.requestPasscode to request a passcode for creating a SwapPool.
output=$(dfx canister call PasscodeManager requestPasscode "( principal \"$Token0\", principal \"$Token1\", 3_000)")

# Check if the output contains "ok" or "err"
if echo "$output" | grep -q "ok ="; then
    # Extract the text from the "ok" variant
    ok_text=$(echo "$output" | awk -F'ok = ' '{print $2}' | awk -F' })' '{print $1}')
    echo "Success: $ok_text"
elif echo "$output" | grep -q "err ="; then
    # # Extract the error from the "err" variant
    # err_text=$(echo "$output" | awk -F'err = ' '{print $2}' | awk -F' })' '{print $1}')
    # echo "Error: $err_text"
    echo "Error: $output"
    # Exit the script with a non-zero status to indicate failure
    exit 1
else
    echo "Unexpected output: $output"
    # Exit the script with a non-zero status to indicate failure
    exit 1
fi

# Use SwapFactory.createPool to create a SwapPool.
dfx canister call SwapFactory createPool "(record{
    token0 = record { address = \"$Token0\"; standard = "ICRC2";};
    token1 = record { address = \"$Token1\"; standard = "ICRC2";};
    fee = 3000;
    subnet = null;
    sqrtPriceX96 = "";
})"

# # Continue with the rest of the script if no error occurred
# echo "Process completed successfully."