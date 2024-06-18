<script lang="ts">
	import { getContext } from 'svelte';
	import { writable, type Writable } from 'svelte/store';
	// import ToolbarButton from '../toolbar/ToolbarButton.svelte';
	import Menu from './Menu.svelte';
	export let menuClass = 'h-6 w-6 shrink-0';
	export let onClick = undefined;
	export let btnClass = 'ms-3';
	let hiddenStore: Writable<boolean> = getContext('navHidden') ?? writable(true);
	const toggle = (ev: any) => hiddenStore.update((h) => !h);

	import { ToolbarButton } from 'flowbite-svelte';
</script>

<ToolbarButton name="Open main menu" on:click={onClick || toggle} {...$$restProps} class={btnClass}>
	<Menu class={menuClass} />
</ToolbarButton>

<!--
@component
[Go to docs](https://flowbite-svelte.com/)
## Props
@prop export let menuClass: string = 'h-6 w-6 shrink-0';
@prop export let onClick: (() => void) | undefined = undefined;
-->
