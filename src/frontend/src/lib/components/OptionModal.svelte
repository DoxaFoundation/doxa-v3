<script lang="ts">
	import { ArrowRightToBracketOutline, ArrowUpFromBracketOutline } from 'flowbite-svelte-icons';
	import { Modal, Button } from 'flowbite-svelte';
	import CopyCard from './CopyCard.svelte';
	import { authStore } from '$lib/stores/auth.store';
	import TransferModal from './TransferModal.svelte';
	import Balances from './Wallet/Balances.svelte';

	interface Props {
		open?: boolean;
	}

	let { open = $bindable(false) }: Props = $props();

	let openTransferModal = $state(false);
</script>

<Modal size="sm" bind:open outsideclose placement="top-right" color="primary" class="pt-2">
	<CopyCard badge="Principal" text={$authStore.principal.toText()} />
	<!-- <CopyCard badge="Account ID" text={window.ic.plug.accountId} /> -->
	<TransferModal bind:openTransferModal />
	<div class="grid grid-cols-2 gap-2">
		<Button outline color="alternative" class="w-full" on:click={() => (openTransferModal = true)}
			><ArrowUpFromBracketOutline />Transfer Token</Button
		>

		<Button outline class="w-full" color="alternative" on:click={authStore.signOut}
			><ArrowRightToBracketOutline class="pr-1" />Log Out</Button
		>
	</div>

	<Balances />
</Modal>
