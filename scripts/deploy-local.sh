
dfx deploy internet_identity
dfx deploy exchange_rate_canister

########################################################################################
########################### Deploy local ICP ledger canister ###########################
########################################################################################

if ! dfx identity list | grep -q minter; then
    # If minter is not found, run the command
    dfx identity new minter
fi


export MINTER_ACCOUNT_ID=$(dfx ledger account-id --identity minter)
export MINTER_PRINCIPAL=$(dfx identity get-principal --identity minter)
export DEFAULT_ACCOUNT_ID=$(dfx ledger account-id --identity default)


dfx deploy icp_ledger --specified-id ryjl3-tyaaa-aaaaa-aaaba-cai --argument "
  (variant {
    Init = record {
      minting_account = \"$MINTER_ACCOUNT_ID\";
      icrc1_minting_account = opt record { owner = principal \"${MINTER_PRINCIPAL}\"; subaccount = null };
      initial_values = vec {
        record {
          \"$DEFAULT_ACCOUNT_ID\";
          record {
            e8s = 100_000_000_000 : nat64;
          };
        };
      };
      send_whitelist = vec {};
      transfer_fee = opt record {
        e8s = 10_000 : nat64;
      };
      token_symbol = opt \"LICP\";
      token_name = opt \"Local ICP\";
    }
  })
"
######################################################################################
######################################################################################

dfx canister create ckusdc_pool --specified-id ieja4-4iaaa-aaaak-qddra-cai

# Creating Local USDx Ledger before deploying stablecoin_minter (stablecoin_minter is a dependency of usdx_ledger)
dfx canister create usdx_ledger --specified-id irorr-5aaaa-aaaak-qddsq-cai

# Creating Local stablecoin_minter , root_canister before deploying usdx_ledger (These are minteraccount and archivecontroller for usdx_ledger)
dfx canister create stablecoin_minter --specified-id iyn2n-liaaa-aaaak-qddta-cai
dfx canister create root_canister --specified-id iwpxf-qyaaa-aaaak-qddsa-cai

# Deploy ckUSDX Locally
./scripts/deploy-local-ckusdc.sh

# Deploy USDx Ledger Locally
./scripts/deploy-local-usdx.sh

dfx deploy stablecoin_minter

dfx deploy root_canister

dfx deploy ckusdc_pool


dfx deploy staking_canister --specified-id mhahe-xqaaa-aaaag-qndha-cai

chmod +x scripts/deploy-usdx-index.sh
dfx canister create usdx_index --specified-id modmy-byaaa-aaaag-qndgq-cai
./scripts/deploy-usdx-index.sh

dfx deploy utility_canister
