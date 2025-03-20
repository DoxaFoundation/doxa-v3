import type { SwapPoolDataState } from '$lib/types/states';
import { fetchPools } from '@services/swap.service';

export const poolsMap: SwapPoolDataState = $state(new Map());

export const fetchSwapPoolData = async () => {
	const pools = await fetchPools();
	pools.forEach((pool) => {
		poolsMap.set(pool.key, pool);
	});
};
