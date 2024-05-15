#!/bin/bash

dfx build cycle_reserve --ic
dfx build cycle_pool --ic
dfx build stablecoin_minter --ic

echo "######################## IC Mainnet WASM Hash ###########################"
# Define paths to each wasm file
cycle_reserve_path=".dfx/ic/canisters/cycle_reserve/cycle_reserve.wasm"
cycle_pool_path=".dfx/ic/canisters/cycle_pool/cycle_pool.wasm"
stablecoin_minter_path=".dfx/ic/canisters/stablecoin_minter/stablecoin_minter.wasm"


# Loop through each wasm file path
for wasm_file_path in "$cycle_reserve_path" "$cycle_pool_path" "$stablecoin_minter_path"; do
  # Extract filename from path (optional)
  filename=$(basename "$wasm_file_path")

  # Check if the file exists
  if [ ! -f "$wasm_file_path" ]; then
    echo "Error: File '$wasm_file_path' does not exist."
    continue  # Skip to the next iteration if file is missing
  fi

  # Calculate the SHA256 hash using shasum
  sha256_hash=$(shasum -a 256 "$wasm_file_path" | awk '{print $1}')

  # Print the hash with filename (if extracted)
  if [ -n "$filename" ]; then
    echo "SHA256 hash of '$filename' : $sha256_hash"
  else
    echo "SHA256 hash of '$wasm_file_path': $sha256_hash"
  fi
done
