import { getPool } from '$lib/api/swap.factory.api';
import type { GetPoolArgs, PoolData } from '@declarations/SwapFactory/SwapFactory.did';
import { getPoolsArgsToFetch } from '@utils/swap.utils';
import { toast } from 'svelte-sonner';

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
