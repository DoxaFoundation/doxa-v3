<script lang="ts">
	import { twMerge } from 'tailwind-merge';
	import { Button, Dropdown, DropdownItem } from 'flowbite-svelte';
	import { ChevronDownOutline } from 'flowbite-svelte-icons';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	export let value: string;
	export let placeholder: string = 'Select option...';

	let activeClass = 'font-medium font-bold text-center py-2 px-4 text-sm bg-slate-300';
	let defaultClass =
		'font-medium font-bold text-center py-2 px-4 text-sm hover:bg-gray-100 dark:hover:bg-gray-600';

	let selectImg: string;
	let selectName: string;

	let dropdownOpen = false;

	export let items: { id: number; value: string; img: string; name: string }[];

	function handleSelect(item: { id: number; value: string; img: string; name: string }) {
		value = item.value;
		selectImg = item.img;
		selectName = item.name;
		dispatch('change', { value, selectImg });
		dropdownOpen = false;
	}

	items.find((item) => {
		if (item.value === value) {
			selectImg = item.img;
			selectName = item.name;
			dispatch('change', { value, selectImg });
		}
	});
</script>

<Button
	class={twMerge(
		'text-black w-40 h-16 bg-white hover:bg-slate-300 border-2 drop-shadow-md flex justify-between',
		$$props.class
	)}
>
	{#if selectImg}
		<img src={selectImg} alt={selectName + ' Icon'} class="w-7 mr-2" />
	{/if}
	{value ? (selectName ? selectName : placeholder) : placeholder}
	<ChevronDownOutline class="w-6 h-6 text-black dark:text-white" />
</Button>
<Dropdown activeContent={true} bind:open={dropdownOpen}>
	{#each items as item (item.id)}
		<DropdownItem
			on:click={() => handleSelect(item)}
			defaultClass={value === item.value ? activeClass : defaultClass}
		>
			<img src={item.img} class="w-7 inline mr-2" alt="{item.name} Icon" />
			{item.name}</DropdownItem
		>
	{/each}
</Dropdown>
