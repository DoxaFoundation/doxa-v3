import {
	CKETH_LEDGER_CANISTER_ID,
	CKUSDC_LEDGER_CANISTER_ID,
	CKUSDT_LEDGER_CANISTER_ID,
	CKBTC_LEDGER_CANISTER_ID,
	USDX_LEDGER_CANISTER_ID,
	ICP_LEDGER_CANISTER_ID
} from '$lib/constants/app.constants';
import type { GetPoolArgs, PoolData } from '@declarations/SwapFactory/SwapFactory.did';
import { poolsMap } from '@states/swap-pool-data.svelte';
import { assert } from './assert.utils';
import { assertNonNullish } from '@dfinity/utils';
import { LedgerMetadata } from '@states/ledger-metadata.svelte';
import type { SwapArgs } from '@declarations/SwapPool/SwapPool.did';

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

// Sort token function - equivalent to sortToken in Motoko
export const sortToken = (tokenX: string, tokenY: string): [string, string] => {
	return tokenX > tokenY ? [tokenY, tokenX] : [tokenX, tokenY];
};

export const getPoolKeyStoreKey = (tokenX: string, tokenY: string): string => {
	const [small, big] = sortToken(tokenX, tokenY);

	return `${small}_${big}_3000`;
};

export const isPoolExists = (tokenX: string, tokenY: string): boolean => {
	const key = getPoolKeyStoreKey(tokenX, tokenY);

	return poolsMap.has(key);
};

export const getPoolData = (tokenX: string, tokenY: string): PoolData => {
	const key = getPoolKeyStoreKey(tokenX, tokenY);
	const pool = poolsMap.get(key);
	assertNonNullish(
		pool,
		`Swap Pool not found for ${LedgerMetadata[tokenX]?.name} and ${LedgerMetadata[tokenY]?.name}`
	);
	return pool;
};

export const getSwapArgs = (
	from: string,
	to: string,
	amountIn: number,
	quoteAmount: string,
	slippage: number
): SwapArgs => {
	const [token0, token1] = sortToken(from, to);

	assert(token0 !== token1, 'cannot swap the same token');

	const zeroForOne = token0 === from; // true if we are swapping  token0 for token1, false if we are swapping token1 for token0

	return {
		amountIn: toStringDecimals(amountIn, from),
		zeroForOne,
		amountOutMinimum: calculateAmountOutMinimum(to, quoteAmount, slippage)
	};
};

export const calculateAmountOutMinimum = (to: string, amount: string, slippage: number): string => {
	const factor = 1 - slippage / 100;

	return toStringDecimals(Number(amount) * factor, to);
};

export const toStringDecimals = (value: number, canisterId: string): string => {
	const { decimals } = LedgerMetadata[canisterId];

	assertNonNullish(decimals, 'Decimals not found');

	return Math.trunc(value * 10 ** decimals).toString();
};

/**
 * This function computes an estimated price impact given:
 * - inputAmount: the amount of the input token
 * - quoteAmount: the actual output received from the trade
 * - inputTokenPrice: the market price of the input token
 * - quoteTokenPrice: the market price of the quote token
 * - liquidityProviderFee: the fee percentage taken by liquidity providers (decimal form, e.g. 0.005 for 0.5%)
 *
 * The expected behavior in the Dex is:
 *
 *   1. Derive a mid price from the token prices:
 *        midPrice = inputTokenPrice / quoteTokenPrice
 *
 *   2. Calculate the expected output (quotedOutputAmount) as:
 *        expectedQuoteAmount = inputAmount * midPrice
 *
 *   3. Compute the raw price impact:
 *        rawPriceImpact = (expectedQuoteAmount - quoteAmount) / expectedQuoteAmount
 *
 *   4. Adjust for liquidity provider fee (if applicable):
 *        finalPriceImpact = rawPriceImpact - liquidityProviderFee
 *
 * Note: The Dex uses a Price class and precise arithmetic, so differences in rounding or unit scaling can result in different numbers.
 *
 * Also, the displayed price impact is shown as a negative number in the UI (by multiplying by -1),
 * even if the computed price impact is a positive fraction.
 */
export function calculatePriceImpact(
	inputAmount: number,
	quoteAmount: number,
	inputTokenPrice: number,
	quoteTokenPrice: number,
	liquidityProviderFee: number
): number {
	// Mid price derived from market prices
	const midPrice = inputTokenPrice / quoteTokenPrice;
	const expectedQuoteAmount = inputAmount * midPrice;

	// Calculate raw price impact
	const rawPriceImpact = (expectedQuoteAmount - quoteAmount) / expectedQuoteAmount;

	// Adjust for liquidity provider fee
	const adjustedPriceImpact = rawPriceImpact - liquidityProviderFee;

	return adjustedPriceImpact;
}

/**
 * Calculate the price impact based on input parameters.
 *
 * @param inputAmount - The amount of input token
 * @param quoteAmount - The actual quoted output amount obtained from the trade
 * @param inputTokenPrice - The price of the input token (in same unit as quote token price, e.g., USD)
 * @param quoteTokenPrice - The price of the output token (e.g., USD)
 * @param liquidityProviderFee - The fee percentage taken by the liquidity provider (as a decimal; e.g., 0.003 for 0.3%)
 * @returns The price impact as a percentage (as a decimal)
 */
export function calculatePriceImpact2(
	inputAmount: number,
	quoteAmount: number,
	inputTokenPrice: number,
	quoteTokenPrice: number,
	liquidityProviderFee: number
): number {
	// 1. Compute the expected output based on mid price:
	// Mid price (output per input) = inputTokenPrice / quoteTokenPrice
	const midPrice = inputTokenPrice / quoteTokenPrice;
	const expectedQuoteAmount = inputAmount * midPrice;

	// 2. Calculate the raw price impact
	const rawPriceImpact = (expectedQuoteAmount - quoteAmount) / expectedQuoteAmount;

	// 3. Adjust for liquidity provider fee
	const adjustedPriceImpact = rawPriceImpact - liquidityProviderFee;

	return adjustedPriceImpact;
}
