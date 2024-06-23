<script>
	import Navbar from '$lib/components/Navbar.svelte';
	import { balanceStore } from '$lib/stores/balance.store';
	import { onDestroy } from 'svelte';
	import '../app.css';
	import { authStore } from '$lib/stores/auth.store';

	const unsubscribe = authStore.subscribe((value) => {
		console.log(value.principal.toText());
		balanceStore.sync();
	});
	onDestroy(unsubscribe);
	const unsubscribe2 = balanceStore.subscribe((value) => console.log(value.usdx, value.ckUsdc));
	onDestroy(unsubscribe2);
</script>

<div class="relative px-8">
	<Navbar />
	<div class="overflow-scroll pb-16 mt-20">
		<slot />
	</div>
</div>
