
CanisterId="$1"
Amount="$2"
Owner="$3"
Subaccount="$4"

dfx canister call $CanisterId icrc1_transfer "(
  record {
    to = record {
      owner = principal \"$Owner\";
      subaccount = $Subaccount;
    };
    fee = null;
    memo = null;
    from_subaccount = null;
    created_at_time = null;
    amount = $Amount : nat;
  },
)"