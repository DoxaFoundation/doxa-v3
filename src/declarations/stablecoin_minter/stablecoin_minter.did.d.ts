import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface Account {
  'owner' : Principal,
  'subaccount' : [] | [Uint8Array | number[]],
}
export type CkUSDCBlockIndex = bigint;
export type NotifyError = { 'AlreadyProcessed' : { 'blockIndex' : bigint } } |
  { 'InvalidTransaction' : string } |
  { 'Other' : { 'error_message' : string, 'error_code' : bigint } };
export type NotifyMintWithCkusdcResult = { 'ok' : USDxBlockIndex } |
  { 'err' : NotifyError };
export type Tokens = { 'USDx' : null };
export type USDxBlockIndex = bigint;
export interface _SERVICE {
  'get_ckusdc_reserve_account_of' : ActorMethod<
    [{ 'token' : Tokens }],
    Account
  >,
  'notify_mint_with_ckusdc' : ActorMethod<
    [{ 'minting_token' : Tokens, 'ckusdc_block_index' : CkUSDCBlockIndex }],
    NotifyMintWithCkusdcResult
  >,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
