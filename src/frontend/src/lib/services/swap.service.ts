import { approve } from '$lib/api/icrc.ledger.api';
import { getPool } from '$lib/api/swap.factory.api';
import { depositFrom, getUserUnusedBalance, quote, swap, withdraw } from '$lib/api/swap.pool.api';
import type { ResultSuccess } from '$lib/types/utils';
import type { GetPoolArgs, PoolData } from '@declarations/SwapFactory/SwapFactory.did';
import { Principal } from '@dfinity/principal';
import { updateBalance } from '@states/ledger-balance.svelte';
import { LedgerMetadata } from '@states/ledger-metadata.svelte';
import { authStore } from '@stores/auth.store';
import { fromBigIntDecimals, toBigIntDecimals } from '@utils/decimals.utils';
import { displayBigIntBalanceInFormat } from '@utils/fromat.utils';
import { getFee, getFeeWithDecimals } from '@utils/icrc-ledger.utils';
import { getPoolData, getPoolsArgsToFetch, getSwapArgs } from '@utils/swap.utils';
import { toast } from 'svelte-sonner';
import { get } from 'svelte/store';

let toastId: string | number;

export const fetchPools = async (): Promise<PoolData[]> => {
	const tokenParsArgs: GetPoolArgs[] = getPoolsArgsToFetch();

	try {
		// Fire off all pool requests concurrently using Promise.all.
		const poolResults = await Promise.all(
			tokenParsArgs.map(async (args) =>
				getPool(args)
					.then((result) => {
						if ('ok' in result) {
							return result.ok; //return the pool data
						} else {
							console.error(
								`Error fetching pool for tokens ${args.token0.address} and ${args.token1.address}:`,
								result.err
							);
							return null; //return null if there is an err
						}
					})
					.catch((error) => {
						console.error(
							`Exception fetching pool for tokens ${args.token0.address} and ${args.token1.address}:`,
							error
						);
						return null; //return null if there is an err
					})
			)
		);

		return poolResults.filter((pool) => pool !== null) as PoolData[];
	} catch (error) {
		console.error('Error fetching pools:', error);
		toast.error('Error fetching pools');
		return [];
	}
};

export const fetchPoolsCanisterIds = async (): Promise<string[]> => {
	const pools = await fetchPools();
	return pools.map((pool) => pool.canisterId.toString());
};

export const getRateQuote = async (base: string, _quote: string): Promise<number | null> => {
	try {
		const pool = getPoolData(base, _quote);
		const swapArgs = getSwapArgs(base, _quote, 1, '0', 0);

		const response = await quote({
			canisterId: pool.canisterId.toString(),
			...swapArgs
		});

		if ('ok' in response) {
			return fromBigIntDecimals(response.ok, _quote);
		} else {
			console.error('Error getting quote:', response.err);
			return null;
		}
	} catch (error) {
		console.error('Error getting quote:', error);
		return null;
	}
};

export const getQuote = async (
	from: string,
	to: string,
	amount: string
): Promise<number | null> => {
	try {
		const pool = getPoolData(from, to);
		const swapArgs = getSwapArgs(from, to, Number(amount), '0', 0);

		const response = await quote({
			canisterId: pool.canisterId.toString(),
			...swapArgs
		});

		if ('ok' in response) {
			return fromBigIntDecimals(response.ok, to);
		} else {
			console.error('Error getting quote:', response.err);
			toast.error(`Failed to get quote, ${JSON.stringify(response.err)}`);
			return null;
		}
	} catch (error) {
		console.error('Error getting quote:', error);
		toast.error(`Failed to get quote, ${JSON.stringify(error)}`);
		return null;
	}
};

export const swapToken = async (
	from: string,
	to: string,
	amount: string,
	quoteAmount: string,
	slippage: number
) => {
	try {
		const pool = getPoolData(from, to);
		const fee = getFee(from);
		console.log('amount', amount);
		const approveAmount = Number(amount) + fee;
		const approveResult = await approveSwapPool(approveAmount, from, pool.canisterId);
		console.log('approveAmount', approveAmount);
		if (approveResult.success) {
			const depositAmount = Number(amount);
			console.log('depostAmount', depositAmount);
			const depositResult = await depositTokenSwapPool(pool.canisterId, from, depositAmount);

			if (depositResult.success) {
				toastId = toast.loading(
					`Swapping ${LedgerMetadata[from]?.symbol ?? 'token'} for ${LedgerMetadata[to]?.symbol ?? 'token'}...`,
					{ id: toastId }
				);

				const swapArgs = getSwapArgs(from, to, depositAmount, quoteAmount, slippage);
				console.log('swap amount', depositAmount);
				console.log('swapArgs', swapArgs);
				const swapResponse = await swap({ canisterId: pool.canisterId.toString(), ...swapArgs });

				// { ok: bigint } | { err: SwapPoolError }

				if ('ok' in swapResponse) {
					// response.ok is the amount deposited
					const outputToken = swapResponse.ok;
					console.log('outputToken', outputToken);
					const withdrawResult = await withdrawTokenSwapPool(pool.canisterId, to, outputToken);

					if (withdrawResult.success) {
						toast.success('Swap Successful.');
					}

					return withdrawResult;
				} else {
					console.error('Error swapping token:', swapResponse.err);

					if (
						'InternalError' in swapResponse.err &&
						swapResponse.err.InternalError ===
							'Slippage is over range, please withdraw your unused token'
					) {
						await withdrawUnusedToken(pool);
						toast.error('Swap Failed. Slippage is over range');
					} else {
						toastId = toast.error(`Failed to swap token, ${JSON.stringify(swapResponse.err)}`, {
							id: toastId
						});
					}

					return { success: false, err: swapResponse.err };
				}
			} else return depositResult;
		} else return approveResult;
	} catch (error) {
		console.error('Error swapping token:', error);
		toastId = toast.error(`Failed to swap token`, { id: toastId });
		return { success: false, err: error };
	}
};

const depositTokenSwapPool = async (
	swapPoolId: Principal,
	ledgerId: string,
	amount: number
): Promise<ResultSuccess> => {
	try {
		toastId = toast.loading(
			`Depositing ${LedgerMetadata[ledgerId]?.symbol ?? 'token'} to swap pool...`,
			{ id: toastId }
		);

		const response = await depositFrom({
			canisterId: swapPoolId.toString(),
			token: ledgerId,
			amount: toBigIntDecimals(amount, ledgerId),
			fee: BigInt(getFeeWithDecimals(ledgerId))
		});

		if ('ok' in response) {
			updateBalance(ledgerId);
			// response.ok is the amount deposited
			const depositedAmount = response.ok;
			console.log('depositedAmount', depositedAmount);
			toastId = toast.success(
				`Deposited ${displayBigIntBalanceInFormat(depositedAmount, ledgerId)} ${LedgerMetadata[ledgerId]?.symbol ?? 'token'}`,
				{ id: toastId }
			);
			return { success: true };
		} else {
			console.error('Error depositing token to swap pool:', response.err);
			toastId = toast.error(
				`Failed to deposit token to swap pool, ${JSON.stringify(response.err)}`,
				{
					id: toastId
				}
			);
			return { success: false, err: response.err };
		}
	} catch (error) {
		console.error('Error depositing token to swap pool:', error);
		toastId = toast.error(`Failed to deposit token to swap pool`, { id: toastId });
		return { success: false, err: error };
	}
};

const approveSwapPool = async (
	amount: number,
	ledgerId: string,
	swapPoolId: Principal
): Promise<ResultSuccess> => {
	try {
		toastId = toast.loading('Approving swap pool...', { id: toastId });

		const response = await approve({
			canisterId: ledgerId,
			spender: {
				owner: swapPoolId,
				subaccount: []
			},
			amount: toBigIntDecimals(amount, ledgerId),
			expected_allowance: BigInt(0)
		});

		if ('Ok' in response) {
			updateBalance(ledgerId);
			toastId = toast.success('Approved swap pool', { id: toastId });
			return { success: true };
		} else {
			console.error('Error approving swap pool: response error: ', response.Err);
			toastId = toast.error('Failed to approve swap pool', { id: toastId });
			return { success: false, err: response.Err };
		}
	} catch (error) {
		console.error('Error approving swap pool:', error);
		toastId = toast.error('Failed to approve swap pool', { id: toastId });
		return { success: false, err: error };
	}
};

const withdrawTokenSwapPool = async (swapPoolId: Principal, ledgerId: string, amount: bigint) => {
	try {
		toastId = toast.loading(
			`Withdrawing ${LedgerMetadata[ledgerId]?.symbol ?? 'token'} from swap pool...`,
			{ id: toastId }
		);

		const response = await withdraw({
			canisterId: swapPoolId.toString(),
			amount,
			token: ledgerId,
			fee: BigInt(getFeeWithDecimals(ledgerId))
		});

		if ('ok' in response) {
			updateBalance(ledgerId);
			// response.ok is the amount deposited
			const wthdrawnAmount = response.ok;

			console.log('wthdrawnAmount', wthdrawnAmount);
			toastId = toast.success(
				`Withdrawn ${displayBigIntBalanceInFormat(wthdrawnAmount, ledgerId)} ${LedgerMetadata[ledgerId]?.symbol ?? 'token'}`,
				{ id: toastId }
			);

			return { success: true };
		} else {
			console.error('Error withdrawing token from swap pool:', response.err);
			toastId = toast.error(
				`Failed to withdraw token from swap pool, ${JSON.stringify(response.err)}`,
				{
					id: toastId
				}
			);
			return { success: false, err: response.err };
		}
	} catch (error) {
		console.error('Error withdrawing token from swap pool:', error);
		toastId = toast.error(`Failed to withdraw token from swap pool`, {
			id: toastId
		});
		return { success: false, err: error };
	}
};

export const withdrawUnusedToken = async (pool: PoolData) => {
	try {
		const unusedBalanceResponse = await getUserUnusedBalance({
			canisterId: pool.canisterId.toString(),
			principal: get(authStore).principal
		});

		if ('ok' in unusedBalanceResponse) {
			const { token0, token1 } = pool;
			const { balance0, balance1 } = unusedBalanceResponse.ok;

			const response0 =
				Number(balance0) !== 0
					? await withdrawTokenSwapPool(pool.canisterId, token0.address, balance0)
					: { success: true };

			const response1 =
				Number(balance1) !== 0
					? await withdrawTokenSwapPool(pool.canisterId, token1.address, balance1)
					: { success: true };

			if (response0.success && response1.success) {
				toast.success('Unused token withdrawn from swap pool');

				return { success: true };
			}

			return {
				success: false,
				err: `Error withdrawing unused token from swap pool ${response0.err} ${response1.err}`
			};
		} else {
			console.error('Error withdrawing unused token from swap pool:', unusedBalanceResponse.err);
			toastId = toast.error(
				`Failed to withdraw unused token from swap pool, ${JSON.stringify(unusedBalanceResponse.err)}`,
				{
					id: toastId
				}
			);
			return { success: false, err: unusedBalanceResponse.err };
		}
	} catch (error) {
		console.error('Error withdrawing unused token from swap pool:', error);
		toastId = toast.error(`Failed to withdraw unused token from swap pool`, {
			id: toastId
		});
		return { success: false, err: error };
	}
};
