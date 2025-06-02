import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export type ExchangeRateError = { 'AnonymousPrincipalNotAllowed' : null } |
  { 'CryptoQuoteAssetNotFound' : null } |
  { 'FailedToAcceptCycles' : null } |
  { 'ForexBaseAssetNotFound' : null } |
  { 'CryptoBaseAssetNotFound' : null } |
  { 'StablecoinRateTooFewRates' : null } |
  { 'ForexAssetsNotFound' : null } |
  { 'InconsistentRatesReceived' : null } |
  { 'RateLimited' : null } |
  { 'StablecoinRateZeroRate' : null } |
  { 'Other' : { 'code' : number, 'description' : string } } |
  { 'ForexInvalidTimestamp' : null } |
  { 'NotEnoughCycles' : null } |
  { 'ForexQuoteAssetNotFound' : null } |
  { 'StablecoinRateNotFound' : null } |
  { 'Pending' : null };
export interface ResultErrorLog {
  'error' : { 'ExchangeRateError' : ExchangeRateError } |
    { 'FailedToAdjustReserve' : Tokens } |
    { 'DUSDBurnTransferError' : TransferError } |
    { 'CkUDSCTransferError' : TransferError },
  'timestamp' : bigint,
}
export type Tokens = { 'DUSD' : null };
export type TransferError = {
    'GenericError' : { 'message' : string, 'error_code' : bigint }
  } |
  { 'TemporarilyUnavailable' : null } |
  { 'BadBurn' : { 'min_burn_amount' : bigint } } |
  { 'Duplicate' : { 'duplicate_of' : bigint } } |
  { 'BadFee' : { 'expected_fee' : bigint } } |
  { 'CreatedInFuture' : { 'ledger_time' : bigint } } |
  { 'TooOld' : null } |
  { 'InsufficientFunds' : { 'balance' : bigint } };
export interface _SERVICE {
  'get_error_result_log' : ActorMethod<[], Array<ResultErrorLog>>,
  'get_usd_usdc_rate' : ActorMethod<
    [],
    { 'rate' : number, 'timestamp' : bigint }
  >,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
