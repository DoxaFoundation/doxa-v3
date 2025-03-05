<script lang="ts">
	import { authStore } from '$lib/stores/auth.store';
	import { WalletOutline } from 'flowbite-svelte-icons';
	import WalletModal from './Wallet/WalletModal.svelte';
</script>

{#if $authStore?.isAuthenticated}
	<WalletModal />
{:else}
	<a
		href="/connect"
		class="bg-black text-white font-light rounded-full py-4 px-5 text-xs flex flex-row items-center hover:bg-gray-800 active:bg-gray-700 focus:outline-none focus:ring focus:ring-zinc-400"
	>
		CONNECT WALLET <div class="pl-1">
			<WalletOutline />
		</div>
	</a>
{/if}
