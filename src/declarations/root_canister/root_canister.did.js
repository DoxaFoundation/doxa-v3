export const idlFactory = ({ IDL }) => {
  const Result = IDL.Variant({ 'ok' : IDL.Null, 'err' : IDL.Text });
  const Canister = IDL.Variant({
    'all' : IDL.Null,
    'ckusdc_pool' : IDL.Null,
    'dusd_index' : IDL.Null,
    'frontend' : IDL.Null,
    'dusd_ledger' : IDL.Null,
    'root_canister' : IDL.Null,
    'stablecoin_minter' : IDL.Null,
    'staking_canister' : IDL.Null,
    'utility_canister' : IDL.Null,
  });
  const Result_2 = IDL.Variant({
    'ok' : IDL.Vec(IDL.Tuple(IDL.Text, IDL.Nat)),
    'err' : IDL.Text,
  });
  const LogVisibility = IDL.Variant({
    'controllers' : IDL.Null,
    'public' : IDL.Null,
  });
  const DefiniteCanisterSettings = IDL.Record({
    'freezing_threshold' : IDL.Nat,
    'controllers' : IDL.Vec(IDL.Principal),
    'reserved_cycles_limit' : IDL.Nat,
    'log_visibility' : LogVisibility,
    'wasm_memory_limit' : IDL.Nat,
    'memory_allocation' : IDL.Nat,
    'compute_allocation' : IDL.Nat,
  });
  const CanisterStatusResult = IDL.Record({
    'status' : IDL.Variant({
      'stopped' : IDL.Null,
      'stopping' : IDL.Null,
      'running' : IDL.Null,
    }),
    'memory_size' : IDL.Nat,
    'cycles' : IDL.Nat,
    'settings' : DefiniteCanisterSettings,
    'query_stats' : IDL.Record({
      'response_payload_bytes_total' : IDL.Nat,
      'num_instructions_total' : IDL.Nat,
      'num_calls_total' : IDL.Nat,
      'request_payload_bytes_total' : IDL.Nat,
    }),
    'idle_cycles_burned_per_day' : IDL.Nat,
    'module_hash' : IDL.Opt(IDL.Vec(IDL.Nat8)),
    'reserved_cycles' : IDL.Nat,
  });
  const Result_1 = IDL.Variant({
    'ok' : IDL.Vec(CanisterStatusResult),
    'err' : IDL.Text,
  });
  const EmailPermission = IDL.Variant({
    'Deny' : IDL.Null,
    'Allow' : IDL.Text,
  });
  return IDL.Service({
    'accept_risk_warning' : IDL.Func([], [Result], []),
    'add_bad_actor' : IDL.Func([IDL.Principal], [Result], []),
    'canister_balances' : IDL.Func([IDL.Vec(Canister)], [Result_2], []),
    'canisters_status' : IDL.Func([IDL.Vec(Canister)], [Result_1], []),
    'get_email_permission' : IDL.Func(
        [],
        [IDL.Opt(EmailPermission)],
        ['query'],
      ),
    'get_risk_warning_agreement' : IDL.Func([], [IDL.Opt(IDL.Bool)], ['query']),
    'insert_email' : IDL.Func([IDL.Opt(IDL.Text)], [Result], []),
    'is_bad_actor' : IDL.Func([], [IDL.Bool], ['query']),
    'remove_bad_actor' : IDL.Func([IDL.Principal], [Result], []),
    'start_canisters' : IDL.Func([IDL.Vec(Canister)], [Result], []),
    'stop_canisters' : IDL.Func([IDL.Vec(Canister)], [Result], []),
  });
};
export const init = ({ IDL }) => { return []; };
