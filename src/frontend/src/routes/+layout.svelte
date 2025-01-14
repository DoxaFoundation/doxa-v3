<script lang="ts">
	import Navbar from '$lib/components/Navbar.svelte';
	import { balanceStore } from '$lib/stores/balance.store';
	import { onDestroy } from 'svelte';
	import '../app.css';
	import { authStore } from '$lib/stores/auth.store';

	let { children } = $props();

	const unsubscribe = authStore.subscribe((value) => {
		balanceStore.sync();
	});
	onDestroy(unsubscribe);
</script>

<div class="relative px-8">
	<Navbar />
	<div class="overflow-scroll mt-20">
		{@render children()}
	</div>
</div>
