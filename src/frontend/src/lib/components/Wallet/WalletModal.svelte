<script lang="ts">
	import { Modal, Button } from 'flowbite-svelte';
	import { authStore } from '$lib/stores/auth.store';
	import { LogOut, Wallet } from 'lucide-svelte';
	import AddressModal from './AddressModal.svelte';
	import Balances from './Balances.svelte';

	let open = $state(false);
	function shortenText(text: string): string {
		return text.slice(0, 8) + '...' + text.slice(-6);
	}
</script>

<button
	onclick={() => (open = true)}
	class="bg-black text-white font-light rounded-full px-2.5 sm:py-4 sm:px-5 text-xs flex flex-row items-center hover:bg-gray-800 active:bg-gray-700 focus:outline-none focus:ring focus:ring-zinc-400"
>
	{shortenText($authStore.principal.toText())}
	<div class="pl-1">
		<Wallet size={20} />
	</div>
</button>

<Modal size="sm" bind:open outsideclose placement="top-right" color="primary">
	<div class="w-full h-1"></div>
	<div class="grid grid-cols-2 gap-2 mt-10">
		<AddressModal />

		<Button outline class="w-full" color="alternative" on:click={authStore.signOut}
			><LogOut size={24} class="mr-1" />Log Out</Button
		>
	</div>

	<Balances />
</Modal>
