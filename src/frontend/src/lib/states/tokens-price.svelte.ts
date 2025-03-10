import type { TokensPriceState } from '$lib/types/states';
import { getPricesFromCkusdcPools } from '$lib/api/utility.canister.api';

export const price = $state<TokensPriceState>({});

export const fetchPrices = async () => {
	const prices = await getPricesFromCkusdcPools();

	prices.forEach(([tokenId, tokenPrice]) => {
		price[tokenId] = tokenPrice;
	});
};
