<script lang="ts">
	import { goto } from '$app/navigation';
	import CopyCard from '$lib/components/CopyCard.svelte';
	import { authStore } from '$lib/stores/auth.store';
	import { Badge, Button, Card, Toast } from 'flowbite-svelte';
	import { ArrowRightToBracketOutline, WalletOutline } from 'flowbite-svelte-icons';
</script>

<div class="text-black bg-white text-sm border-2 border-black py-2 w-fit px-7 rounded-md">
	<p>SWAP</p>
</div>
<div class="text-white bg-black text-sm border-2 border-black py-2 w-fit px-7 rounded-md">
	<p>MINT</p>
</div>

<div class="flex flex-row-reverse m-4">
	<button
		on:click={() => goto('/connect')}
		class="bg-black text-white font-light rounded-full py-4 px-5 text-xs flex flex-row items-center hover:bg-gray-800 active:bg-gray-700 focus:outline-none focus:ring focus:ring-zinc-400"
	>
		CONNECT WALLET <div class="pl-1">
			<WalletOutline />
		</div>
	</button>
</div>
<button
	class=" text-white bg-black text-base p-6 w-64 md:w-72 rounded-3xl font-light hover:bg-gray-800 active:bg-gray-700 focus:outline-none focus:ring focus:ring-zinc-400"
	>Mint</button
>

<button
	class=" text-white bg-black text-base p-6 w-64 md:w-72 rounded-3xl font-light hover:bg-blue-400 active:bg-gray-700 focus:outline-none focus:ring focus:ring-zinc-400"
	>Mint</button
>

<style lang="postcss">
</style>
