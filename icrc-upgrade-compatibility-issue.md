# ICRC-1 Ledger Upgrade Compatibility Issue: Cannot Upgrade Past 2024-09-13

## Issue Summary

We're unable to upgrade our ICRC-1 ledger canister to any version released after **2024-09-13** due to stable memory compatibility issues.

## Technical Details

**Current Working Version**: 2024-09-13 (commit: `5ba1412f`)  
**Canister ID**: `irorr-5aaaa-aaaak-qddsq-cai`  
**Network**: IC Mainnet

## Failed Upgrade Attempts

Attempted to upgrade to the following ledger-suite-icrc releases, all failing with the same error:

- ❌ **2024-10-17**
- ❌ **2024-11-28** 
- ❌ **2025-01-07**
- ❌ **2025-01-21**
- ❌ **2025-02-27**
- ❌ **2025-04-14**
- ❌ **2025-05-22**

## Error Message

```
Error from Canister irorr-5aaaa-aaaak-qddsq-cai: Canister called `ic0.trap` with message: 
'Panicked at 'Cannot upgrade from scratch stable memory, please upgrade to memory manager first.', 
rs/ledger_suite/icrc1/ledger/src/main.rs:192:9'
```

## Upgrade Command Used

```bash
dfx deploy dusd_ledger --argument '(variant { 
  Upgrade = opt record { 
    token_symbol = opt "DUSD"; 
    token_name = opt "Doxa USD"; 
  } 
})' --ic --identity doxa
```

## Root Cause Analysis

The error suggests that ICRC-1 ledgers deployed before **2024-10-17** use **"scratch stable memory"** format, while newer versions expect **"memory manager"** format. This appears to be a **breaking change** in the stable memory layout.

## Questions for the Community

1. **Is there an intermediate upgrade path** between 2024-09-13 and 2024-10-17 that handles the memory format migration?

2. **Are there any migration tools** or specific upgrade procedures for ledgers stuck on pre-2024-10-17 versions?

3. **What's the recommended approach** for production ICRC-1 ledgers that need to stay on older versions for compatibility?

4. **Will this be addressed** in future releases with backward compatibility support?

## Impact

This affects production tokens deployed before October 2024 that cannot:
- Access new ICRC ledger suite features
- Update metadata (token names/symbols) that require newer versions
- Benefit from performance improvements and bug fixes

## Related Discussion

Similar issue discussed here: [Upgrading old ICRC1 token to the ICRC ledger suite](https://forum.dfinity.org/t/upgrading-old-icrc1-token-to-the-icrc-ledger-suite/39663)

Any guidance on safe upgrade paths or migration strategies would be greatly appreciated!

## Tags
`icrc-1` `ledger` `upgrade` `stable-memory` `compatibility` `breaking-change` 