import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export type Canister = { 'all' : null } |
  { 'ckusdc_pool' : null } |
  { 'dusd_index' : null } |
  { 'frontend' : null } |
  { 'dusd_ledger' : null } |
  { 'root_canister' : null } |
  { 'stablecoin_minter' : null } |
  { 'staking_canister' : null } |
  { 'utility_canister' : null };
export interface CanisterStatusResult {
  'status' : { 'stopped' : null } |
    { 'stopping' : null } |
    { 'running' : null },
  'memory_size' : bigint,
  'cycles' : bigint,
  'settings' : DefiniteCanisterSettings,
  'query_stats' : {
    'response_payload_bytes_total' : bigint,
    'num_instructions_total' : bigint,
    'num_calls_total' : bigint,
    'request_payload_bytes_total' : bigint,
  },
  'idle_cycles_burned_per_day' : bigint,
  'module_hash' : [] | [Uint8Array | number[]],
  'reserved_cycles' : bigint,
}
export interface DefiniteCanisterSettings {
  'freezing_threshold' : bigint,
  'controllers' : Array<Principal>,
  'reserved_cycles_limit' : bigint,
  'log_visibility' : LogVisibility,
  'wasm_memory_limit' : bigint,
  'memory_allocation' : bigint,
  'compute_allocation' : bigint,
}
export type EmailPermission = { 'Deny' : null } |
  { 'Allow' : string };
export type LogVisibility = { 'controllers' : null } |
  { 'public' : null };
export type Result = { 'ok' : null } |
  { 'err' : string };
export type Result_1 = { 'ok' : Array<CanisterStatusResult> } |
  { 'err' : string };
export type Result_2 = { 'ok' : Array<[string, bigint]> } |
  { 'err' : string };
export interface _SERVICE {
  'accept_risk_warning' : ActorMethod<[], Result>,
  'add_bad_actor' : ActorMethod<[Principal], Result>,
  'canister_balances' : ActorMethod<[Array<Canister>], Result_2>,
  'canisters_status' : ActorMethod<[Array<Canister>], Result_1>,
  'get_email_permission' : ActorMethod<[], [] | [EmailPermission]>,
  'get_risk_warning_agreement' : ActorMethod<[], [] | [boolean]>,
  'insert_email' : ActorMethod<[[] | [string]], Result>,
  'is_bad_actor' : ActorMethod<[], boolean>,
  'remove_bad_actor' : ActorMethod<[Principal], Result>,
  'start_canisters' : ActorMethod<[Array<Canister>], Result>,
  'stop_canisters' : ActorMethod<[Array<Canister>], Result>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
