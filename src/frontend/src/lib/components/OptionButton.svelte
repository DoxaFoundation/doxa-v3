<script lang="ts">
	import OptionModal from './OptionModal.svelte';
	import { WalletOutline } from 'flowbite-svelte-icons';
	import { authStore } from '$lib/stores/auth.store';

	let open = $state(false);
	function shortenText(text: string): string {
		return text.slice(0, 8) + '...' + text.slice(-6);
	}
</script>

<button
	onclick={() => (open = true)}
	class="bg-black text-white font-light rounded-full py-4 px-5 text-xs flex flex-row items-center hover:bg-gray-800 active:bg-gray-700 focus:outline-none focus:ring focus:ring-zinc-400"
>
	{shortenText($authStore.principal.toText())}
	<div class="pl-1">
		<WalletOutline />
	</div>
</button>
<OptionModal bind:open />
