import type { Account } from '@dfinity/ledger-icp';
import { Principal } from '@dfinity/principal';

export const HOST = import.meta.env.VITE_HOST as string;

export const Network = import.meta.env.VITE_DFX_NETWORK as 'local' | 'ic';

export const LOCAL = Network === 'local';

export const PROD = Network === 'ic';

export const STABLECOIN_MINTER_CANISTER_ID = import.meta.env
	.VITE_STABLECOIN_MINTER_CANISTER_ID as string;

export const UTILITY_CANISTER_ID = import.meta.env.VITE_UTILITY_CANISTER_CANISTER_ID as string;

export const ROOT_CANISTER_ID = import.meta.env.VITE_ROOT_CANISTER_CANISTER_ID as string;

export const CKUSDC_LEDGER_CANISTER_ID = import.meta.env.VITE_CKUSDC_LEDGER_CANISTER_ID as string;

export const USDX_LEDGER_CANISTER_ID = import.meta.env.VITE_USDX_LEDGER_CANISTER_ID as string;

export const STAKING_CANISTER_ID = import.meta.env.VITE_STAKING_CANISTER_CANISTER_ID as string;

export const FRONTEND_CANISTER_ID = import.meta.env.VITE_FRONTEND_CANISTER_ID as string;

export const ICP_LEDGER_CANISTER_ID = import.meta.env.VITE_ICP_LEDGER_CANISTER_ID as string;

export const CKUSDT_LEDGER_CANISTER_ID = import.meta.env.VITE_CKUSDT_LEDGER_CANISTER_ID as string;

export const CKETH_LEDGER_CANISTER_ID = import.meta.env.VITE_CKETH_LEDGER_CANISTER_ID as string;

export const CKBTC_LEDGER_CANISTER_ID = import.meta.env.VITE_CKBTC_LEDGER_CANISTER_ID as string;

export const DECIMALS = 6;
export const DIVISOR = 10 ** DECIMALS; // 1e8

export const RESERVE_ACCOUNT = getUsdxReserveAccount();

function getUsdxReserveAccount(): Account {
	const array: number[] = new Array(32).fill(0);
	array[31] = 1;
	return {
		owner: Principal.fromText(import.meta.env.VITE_STABLECOIN_MINTER_CANISTER_ID),
		subaccount: [new Uint8Array(array)]
	};
}
