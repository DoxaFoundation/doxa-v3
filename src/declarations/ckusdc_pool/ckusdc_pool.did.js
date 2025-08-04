export const idlFactory = ({ IDL }) => {
  const ExchangeRateError = IDL.Variant({
    'AnonymousPrincipalNotAllowed' : IDL.Null,
    'CryptoQuoteAssetNotFound' : IDL.Null,
    'FailedToAcceptCycles' : IDL.Null,
    'ForexBaseAssetNotFound' : IDL.Null,
    'CryptoBaseAssetNotFound' : IDL.Null,
    'StablecoinRateTooFewRates' : IDL.Null,
    'ForexAssetsNotFound' : IDL.Null,
    'InconsistentRatesReceived' : IDL.Null,
    'RateLimited' : IDL.Null,
    'StablecoinRateZeroRate' : IDL.Null,
    'Other' : IDL.Record({ 'code' : IDL.Nat32, 'description' : IDL.Text }),
    'ForexInvalidTimestamp' : IDL.Null,
    'NotEnoughCycles' : IDL.Null,
    'ForexQuoteAssetNotFound' : IDL.Null,
    'StablecoinRateNotFound' : IDL.Null,
    'Pending' : IDL.Null,
  });
  const Tokens = IDL.Variant({ 'DUSD' : IDL.Null });
  const TransferError = IDL.Variant({
    'GenericError' : IDL.Record({
      'message' : IDL.Text,
      'error_code' : IDL.Nat,
    }),
    'TemporarilyUnavailable' : IDL.Null,
    'BadBurn' : IDL.Record({ 'min_burn_amount' : IDL.Nat }),
    'Duplicate' : IDL.Record({ 'duplicate_of' : IDL.Nat }),
    'BadFee' : IDL.Record({ 'expected_fee' : IDL.Nat }),
    'CreatedInFuture' : IDL.Record({ 'ledger_time' : IDL.Nat64 }),
    'TooOld' : IDL.Null,
    'InsufficientFunds' : IDL.Record({ 'balance' : IDL.Nat }),
  });
  const ResultErrorLog = IDL.Record({
    'error' : IDL.Variant({
      'ExchangeRateError' : ExchangeRateError,
      'FailedToAdjustReserve' : Tokens,
      'DUSDBurnTransferError' : TransferError,
      'CkUDSCTransferError' : TransferError,
    }),
    'timestamp' : IDL.Nat64,
  });
  return IDL.Service({
    'get_error_result_log' : IDL.Func([], [IDL.Vec(ResultErrorLog)], ['query']),
    'get_usd_usdc_rate' : IDL.Func(
        [],
        [IDL.Record({ 'rate' : IDL.Float64, 'timestamp' : IDL.Nat64 })],
        ['query'],
      ),
  });
};
export const init = ({ IDL }) => { return []; };
