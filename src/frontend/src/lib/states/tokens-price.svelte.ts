import type { TokensPriceState } from '$lib/types/states';
import { getAllTokenPrices, getPricesFromCkusdcPools } from '$lib/api/utility.canister.api';
import { LOCAL } from '@constants/app.constants';

export const price = $state<TokensPriceState>({});

export const fetchPrices = async () => {
	const prices = LOCAL ? await getPricesFromCkusdcPools() : await getAllTokenPrices();

	prices.forEach(([tokenId, tokenPrice]) => {
		price[tokenId] = tokenPrice;
	});
};
