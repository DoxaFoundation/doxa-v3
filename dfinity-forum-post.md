# ICRC-1 Ledger: Token Symbol Not Updating via Upgrade Arguments Despite Interface Support

## Issue Summary

I'm experiencing an issue where the `token_symbol` field in an ICRC-1 ledger canister cannot be updated via upgrade arguments, even though the upgrade interface explicitly supports it and the deployment succeeds without errors.

## Technical Details

**Canister**: DUSD Ledger (Doxa Dollar)  
**Canister ID**: `irorr-5aaaa-aaaak-qddsq-cai`  
**Network**: IC Mainnet  

## What I'm Trying to Do

Update the token symbol from `"USDx"` to `"DUSD"` using the upgrade functionality.

## Upgrade Interface Analysis

Looking at the `.did` file, the `UpgradeArgs` type clearly supports updating the token symbol:

```candid
type UpgradeArgs = record {
  change_archive_options : opt ChangeArchiveOptions;
  token_symbol : opt text;           // ← This field exists
  transfer_fee : opt nat;
  metadata : opt vec record { text; MetadataValue };
  maximum_number_of_accounts : opt nat64;
  accounts_overflow_trim_quantity : opt nat64;
  change_fee_collector : opt ChangeFeeCollector;
  max_memo_length : opt nat16;
  token_name : opt text;             // ← This field also exists
  feature_flags : opt FeatureFlags;
};
```

## What I've Tried

### Attempt 1: Direct field update
```bash
dfx deploy dusd_ledger --argument '(variant { 
  Upgrade = opt record { 
    token_symbol = opt "DUSD"; 
    token_name = opt "Doxa Dollar"; 
  } 
})' --ic --identity doxa
```

### Attempt 2: Metadata update
```bash
dfx deploy dusd_ledger --argument '(variant { 
  Upgrade = opt record { 
    metadata = opt vec { 
      record { "icrc1:symbol"; variant { Text = "DUSD" } }; 
      record { "icrc1:name"; variant { Text = "Doxa Dollar" } }; 
    } 
  } 
})' --ic --identity doxa
```

Both deployments succeed with:
```
Upgraded code for canister dusd_ledger, with canister ID irorr-5aaaa-aaaak-qddsq-cai
Deployed canisters.
```

## Results

**Partial Success**:
- ✅ `icrc1_name()` returns `"Doxa Dollar"` (updated successfully)
- ❌ `icrc1_symbol()` returns `"USDx"` (unchanged)

**Metadata Check**:
```bash
dfx canister call dusd_ledger icrc1_metadata --ic
```

Shows:
```candid
record { "icrc1:name"; variant { Text = "Doxa Dollar" } };
record { "icrc1:symbol"; variant { Text = "USDx" } };  // Still old value
```

## Questions for the Community

1. **Is this expected behavior?** Are token symbols intentionally immutable in ICRC-1 implementations even when the interface supports updates?

2. **Implementation-specific limitation?** Could this be a limitation of the specific ICRC-1 ledger implementation I'm using?

3. **Proper upgrade syntax?** Is there a different way to structure the upgrade arguments for symbol changes?

4. **Workaround solutions?** Are there any alternative approaches to update the token symbol post-deployment?

## Additional Context

- The token was initially deployed with symbol `"USDx"`
- This is for a rebranding from "USDx" to "DUSD" 
- The canister is deployed on IC mainnet with real users
- Both `token_name` and `token_symbol` are marked as `opt text` in the upgrade interface

## Expected vs Actual Behavior

**Expected**: Both name and symbol should update when provided in upgrade arguments  
**Actual**: Only name updates, symbol remains unchanged

Has anyone encountered this before or have insights into whether ICRC-1 token symbols are meant to be immutable by design?

Any help or clarification would be greatly appreciated!

## Tags
`icrc-1` `ledger` `upgrade` `token-symbol` `metadata` 