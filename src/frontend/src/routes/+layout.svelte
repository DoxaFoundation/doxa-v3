<script lang="ts">
	import Navbar from '$lib/components/Navbar.svelte';
	import { balanceStore } from '$lib/stores/balance.store';
	import { onDestroy, onMount } from 'svelte';
	import '../app.css';
	import { authStore } from '$lib/stores/auth.store';
	import { Toaster, toast } from 'svelte-sonner';

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

<Toaster />

<div class="flex flex-col items-stretch">
	<div>
		<Navbar />
	</div>

	<div class="px-2 self-stretch">{@render children()}</div>
</div>
