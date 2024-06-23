<script lang="ts">
	import { goto } from '$app/navigation';
	import CopyCard from '$lib/components/CopyCard.svelte';
	import { authStore } from '$lib/stores/auth.store';
	import { Badge, Card, Toast } from 'flowbite-svelte';
	import { ArrowRightToBracketOutline, WalletOutline } from 'flowbite-svelte-icons';
	// import { Dropdown, DropdownItem, DropdownDivider, DropdownHeader } from 'flowbite-svelte';

	import { Button, Dropdown, DropdownItem } from 'flowbite-svelte';
	import { ChevronDownOutline } from 'flowbite-svelte-icons';

	let value: string = 'ICP';
	let activeClass = 'font-medium py-2 px-4 text-sm bg-slate-300';
	let defaultClass = 'font-medium py-2 px-4 text-sm hover:bg-gray-100 dark:hover:bg-gray-600';
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

<Button class="text-black bg-white hover:bg-slate-300 border-2 drop-shadow-md"
	>{value ? value : 'Select a token'}<ChevronDownOutline
		class="w-6 h-6 ms-6 text-black dark:text-white"
	/></Button
>
<Dropdown activeContent={true}>
	<DropdownItem
		on:click={() => (value = 'ckETH')}
		defaultClass={value === 'ckETH' ? activeClass : defaultClass}>ckETH</DropdownItem
	>
	<DropdownItem
		on:click={() => (value = 'ckUSDC')}
		defaultClass={value === 'ckUSDC' ? activeClass : defaultClass}>ckUSDC</DropdownItem
	>
	<DropdownItem
		on:click={() => (value = 'ICP')}
		defaultClass={value === 'ICP' ? activeClass : defaultClass}>ICP</DropdownItem
	>
	<DropdownItem
		on:click={() => (value = 'ckBTC')}
		defaultClass={value === 'ckBTC' ? activeClass : defaultClass}>ckBTC</DropdownItem
	>
</Dropdown>

<style lang="postcss">
</style>
