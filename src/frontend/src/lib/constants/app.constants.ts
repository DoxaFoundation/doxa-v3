export const HOST = import.meta.env.VITE_HOST as string;

export const Network = import.meta.env.VITE_DFX_NETWORK as 'local' | 'ic';

export const LOCAL = Network === 'local';

export const PROD = Network === 'ic';

export const STABLECOIN_MINTER_CANISTER_ID = import.meta.env
	.VITE_STABLECOIN_MINTER_CANISTER_ID as string;

export const CKUSDC_LEDGER_CANISTER_ID = import.meta.env.VITE_CKUSDC_LEDGER_CANISTER_ID as string;

export const USDX_LEDGER_CANISTER_ID = import.meta.env.VITE_USDX_LEDGER_CANISTER_ID as string;

export const STAKING_CANISTER_ID = import.meta.env.VITE_STAKING_CANISTER_CANISTER_ID as string;

export const DECIMALS = 6;
export const DIVISOR = 10 ** DECIMALS; // 1e8
