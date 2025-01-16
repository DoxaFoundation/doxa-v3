<script lang="ts">
	import Navbar from '$lib/components/Navbar.svelte';
	import { balanceStore } from '$lib/stores/balance.store';
	import { onDestroy, onMount } from 'svelte';
	import '../app.css';
	import { authStore } from '$lib/stores/auth.store';

	let { children } = $props();

	onMount(async () => {
		await authStore.sync();
	});

	const unsubscribe = authStore.subscribe((value) => {
		if (value) {
			balanceStore.sync();
		}
	});
	onDestroy(unsubscribe);
</script>

<!-- solution 1 -->
<div class="flex flex-col items-stretch">
	<div>
		<Navbar />
	</div>

	<div class="px-2 self-stretch">{@render children()}</div>
</div>

<!-- solution 2 -->

<!-- <div class="relative">
	<div class="inset-x-0 top-0"><Navbar /></div>

	<div class="px-2 self-stretch">{@render children()}</div>
</div> -->

<!-- solution 4 -->
<!-- <div class="relative">
	<div class="inset-x-0 top-0"><Navbar /></div>

	<div class="px-2 inset-x-0 top-[73px] lg:top-[75px]">{@render children()}</div>
</div> -->
