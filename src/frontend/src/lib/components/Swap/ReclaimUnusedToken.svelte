<script lang="ts">
	import { getUserUnusedBalance } from '$lib/api/swap.pool.api';
	import type { PoolData } from '@declarations/SwapFactory/SwapFactory.did';
	import { withdrawUnusedToken } from '@services/swap.service';
	import { poolsMap } from '@states/swap-pool-data.svelte';
	import { authStore } from '@stores/auth.store';
	import { getPoolKeyStoreKey } from '@utils/swap.utils';

	let { tokenX, tokenY } = $props();

	let unusedTokens = $state({
		balance0: 0,
		balance1: 0
	});

	$effect(() => {
		const key = getPoolKeyStoreKey(tokenX, tokenY);

		let pool = poolsMap.get(key);

		if (pool) {
			fetchUserUnusedBalance(pool);
		}
	});

	const fetchUserUnusedBalance = async (pool: PoolData) => {
		const response = await getUserUnusedBalance({
			canisterId: pool.canisterId.toString(),
			principal: $authStore.principal
		});
		if ('ok' in response) {
			const { balance0, balance1 } = response.ok;

			unusedTokens = {
				balance0: Number(balance0),
				balance1: Number(balance1)
			};
		}
	};

	const onclick = async () => {
		const key = getPoolKeyStoreKey(tokenX, tokenY);

		let pool = poolsMap.get(key);

		if (pool) {
			await withdrawUnusedToken(pool);
			await fetchUserUnusedBalance(pool);
		}
	};
</script>

{#if unusedTokens.balance0 !== 0 || unusedTokens.balance1 !== 0}
	<div class="flex justify-center w-full">
		<button class="hover:underline text-sm text-center" {onclick}
			>Missing tokens? please withdraw your unused token</button
		>
	</div>
{/if}
