import {
	CKETH_LEDGER_CANISTER_ID,
	CKUSDC_LEDGER_CANISTER_ID,
	CKUSDT_LEDGER_CANISTER_ID,
	CKBTC_LEDGER_CANISTER_ID,
	USDX_LEDGER_CANISTER_ID,
	ICP_LEDGER_CANISTER_ID
} from '$lib/constants/app.constants';
import type { GetPoolArgs } from '@declarations/SwapFactory/SwapFactory.did';

export const getPoolsArgsToFetch = (): GetPoolArgs[] => {
	const tokenMap = {
		ICP: { address: ICP_LEDGER_CANISTER_ID, standard: 'ICP' },
		USDx: { address: USDX_LEDGER_CANISTER_ID, standard: 'ICRC2' },
		ckUSDC: { address: CKUSDC_LEDGER_CANISTER_ID, standard: 'ICRC2' },
		ckBTC: { address: CKBTC_LEDGER_CANISTER_ID, standard: 'ICRC2' },
		ckETH: { address: CKETH_LEDGER_CANISTER_ID, standard: 'ICRC2' },
		ckUSDT: { address: CKUSDT_LEDGER_CANISTER_ID, standard: 'ICRC2' }
	};

	const tokenPairs: GetPoolArgs[] = [
		{ token0: tokenMap.USDx, token1: tokenMap.ICP, fee: BigInt(3000) }, // USDx ⇄ ICP
		{ token0: tokenMap.USDx, token1: tokenMap.ckUSDC, fee: BigInt(3000) }, // USDx ⇄ ckUSDC
		{ token0: tokenMap.USDx, token1: tokenMap.ckBTC, fee: BigInt(3000) }, // USDx ⇄ ckBTC
		{ token0: tokenMap.USDx, token1: tokenMap.ckETH, fee: BigInt(3000) }, // USDx ⇄ ckETH
		{ token0: tokenMap.ckUSDT, token1: tokenMap.USDx, fee: BigInt(3000) }, // USDx ⇄ ckUSDT
		{ token0: tokenMap.ICP, token1: tokenMap.ckUSDC, fee: BigInt(3000) }, // ICP ⇄ ckUSDC
		{ token0: tokenMap.ckBTC, token1: tokenMap.ICP, fee: BigInt(3000) }, // ICP ⇄ ckBTC
		{ token0: tokenMap.ICP, token1: tokenMap.ckETH, fee: BigInt(3000) }, // ICP ⇄ ckETH
		{ token0: tokenMap.ckUSDT, token1: tokenMap.ICP, fee: BigInt(3000) }, // ICP ⇄ ckUSDT
		{ token0: tokenMap.ckBTC, token1: tokenMap.ckUSDC, fee: BigInt(3000) }, // ckUSDC ⇄ ckBTC
		{ token0: tokenMap.ckETH, token1: tokenMap.ckUSDC, fee: BigInt(3000) }, // ckUSDC ⇄ ckETH
		{ token0: tokenMap.ckUSDT, token1: tokenMap.ckUSDC, fee: BigInt(3000) }, // ckUSDC ⇄ ckUSDT
		{ token0: tokenMap.ckBTC, token1: tokenMap.ckETH, fee: BigInt(3000) }, // ckBTC ⇄ ckETH
		{ token0: tokenMap.ckUSDT, token1: tokenMap.ckBTC, fee: BigInt(3000) }, // ckBTC ⇄ ckUSDT
		{ token0: tokenMap.ckUSDT, token1: tokenMap.ckETH, fee: BigInt(3000) } // ckETH ⇄ ckUSDT
	];

	return tokenPairs;
};
