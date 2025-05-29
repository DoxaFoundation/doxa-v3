<script lang="ts">
	import Navbar from '$lib/components/Navbar.svelte';
	import { onDestroy, onMount } from 'svelte';
	import '../app.css';
	import { authStore } from '$lib/stores/auth.store';
	import { Toaster, toast } from 'svelte-sonner';
	import { syncLedgerMetadata, LedgerMetadata } from '@states/ledger-metadata.svelte';
	import { balances, fetchBalances } from '@states/ledger-balance.svelte';
	import { fetchPrices, price } from '@states/tokens-price.svelte';
	import { fetchSwapPoolData, poolsMap } from '@states/swap-pool-data.svelte';
	import { fetchAllInitialTransactions } from '@services/transaction.service';

	let { children } = $props();

	onMount(async () => {
		await authStore.sync();
		await syncLedgerMetadata();
		fetchPrices();
		fetchSwapPoolData();
	});

	const unsubscribe = authStore.subscribe((value) => {
		if (value && value.isAuthenticated) {
			fetchBalances();
		}

		fetchAllInitialTransactions();
	});
	onDestroy(unsubscribe);

	$inspect('Ledger Metadata', LedgerMetadata);
	$inspect('Balances ', balances);
	$inspect('Prices', price);
	$inspect('Pools', poolsMap);
</script>

<Toaster richColors />

<div class="flex flex-col items-stretch">
	<div>
		<Navbar />
	</div>

	<div class="px-2 self-stretch">{@render children()}</div>
</div>
