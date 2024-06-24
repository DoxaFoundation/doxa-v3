<script lang="ts">
	import ProgressSteps from '$lib/components/ProgressSteps.svelte';
	import { authStore } from '$lib/stores/auth.store';
	import type { Account, BlockIndex } from '@dfinity/ledger-icrc/dist/candid/icrc_ledger';
	import { Principal } from '@dfinity/principal';
	import { Button } from 'flowbite-svelte';
	import { onMount } from 'svelte';
	import { balanceStore } from '$lib/stores/balance.store';
</script>

<h1 class="text-2xl text-black">Swap page</h1>
