import { get, writable, type Writable } from 'svelte/store';
import { authStore } from './auth.store';
import { onDestroy } from 'svelte';

export interface BalanceStoreData {
	usdx: bigint;
	ckUsdc: bigint;
}

export interface BalanceStore extends Writable<BalanceStoreData> {
	sync: () => Promise<void>;
	updateUsdxBalance: () => Promise<void>;
	updateCkUsdcBalance: () => Promise<void>;
}

const init = async (): Promise<BalanceStore> => {
	let { subscribe, set, update } = writable<BalanceStoreData>({
		usdx: BigInt(0),
		ckUsdc: BigInt(0)
	});

	return {
		subscribe,
		set,
		update,
		sync: async () => {
			if (get(authStore).identityProvider === 'anonymous') return;
			const usdx = await getUsdxBalance();
			const ckUsdc = await getCkUsdcBalance();

			set({ usdx, ckUsdc });
		},
		updateUsdxBalance: async () => {
			if (get(authStore).identityProvider === 'anonymous') return;
			const usdx = await getUsdxBalance();
			update((data) => {
				return { ...data, usdx };
			});
		},
		updateCkUsdcBalance: async () => {
			if (get(authStore).identityProvider === 'anonymous') return;
			const ckUsdc = await getCkUsdcBalance();
			update((data) => {
				return { ...data, ckUsdc };
			});
		}
	};
};

async function getUsdxBalance(): Promise<bigint> {
	if (get(authStore).identityProvider === 'anonymous') return BigInt(0);
	return await get(authStore).usdx.balance({
		owner: get(authStore).principal
	});
}

async function getCkUsdcBalance(): Promise<bigint> {
	if (get(authStore).identityProvider === 'anonymous') return BigInt(0);
	return await get(authStore).ckUsdc.balance({
		owner: get(authStore).principal
	});
}

export const balanceStore: BalanceStore = await init();

// authStore.subscribe(async (value) => await balanceStore.sync());

export function from6Decimals(value: bigint): number {
	return Number(value) / 1000000;
}
