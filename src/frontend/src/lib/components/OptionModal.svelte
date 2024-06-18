<script lang="ts">
	import { ArrowRightToBracketOutline } from 'flowbite-svelte-icons';
	import { Modal, Button } from 'flowbite-svelte';
	import CopyCard from './CopyCard.svelte';
	import { authStore } from '$lib/stores/auth.store';

	export let open = false;
</script>

<Modal size="xs" bind:open autoclose outsideclose placement="top-right" color="primary">
	<CopyCard badge="Principal" text={$authStore.principal.toText()} />
	<!-- <CopyCard badge="Account ID" text={window.ic.plug.accountId} /> -->

	<Button class="w-full" on:click={authStore.signOut}
		><ArrowRightToBracketOutline class="pr-1" />Log Out</Button
	>
</Modal>
