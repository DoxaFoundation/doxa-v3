<script lang="ts">
	import { Button, Dropdown, DropdownItem } from 'flowbite-svelte';
	import { ChevronDownOutline } from 'flowbite-svelte-icons';

	let value: string = 'ICP';
	let activeClass = 'font-medium py-2 px-4 text-sm bg-slate-300';
	let defaultClass = 'font-medium py-2 px-4 text-sm hover:bg-gray-100 dark:hover:bg-gray-600';
</script>

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
