export const idlFactory = ({ IDL }) => {
  const Tokens = IDL.Variant({ 'USDx' : IDL.Null });
  const Account = IDL.Record({
    'owner' : IDL.Principal,
    'subaccount' : IDL.Opt(IDL.Vec(IDL.Nat8)),
  });
  const CkUSDCBlockIndex = IDL.Nat;
  const USDxBlockIndex = IDL.Nat;
  const NotifyError = IDL.Variant({
    'AlreadyProcessed' : IDL.Record({ 'blockIndex' : IDL.Nat }),
    'InvalidTransaction' : IDL.Text,
    'Other' : IDL.Record({
      'error_message' : IDL.Text,
      'error_code' : IDL.Nat64,
    }),
  });
  const NotifyMintWithCkusdcResult = IDL.Variant({
    'ok' : USDxBlockIndex,
    'err' : NotifyError,
  });
  return IDL.Service({
    'get_ckusdc_reserve_account_of' : IDL.Func(
        [IDL.Record({ 'token' : Tokens })],
        [Account],
        ['query'],
      ),
    'notify_mint_with_ckusdc' : IDL.Func(
        [
          IDL.Record({
            'minting_token' : Tokens,
            'ckusdc_block_index' : CkUSDCBlockIndex,
          }),
        ],
        [NotifyMintWithCkusdcResult],
        [],
      ),
  });
};
export const init = ({ IDL }) => { return []; };
