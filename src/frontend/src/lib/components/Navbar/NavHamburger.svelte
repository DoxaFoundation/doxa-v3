<script lang="ts">
	import { getContext } from 'svelte';
	import { writable, type Writable } from 'svelte/store';
	// import ToolbarButton from '../toolbar/ToolbarButton.svelte';
	import Menu from './Menu.svelte';
	let hiddenStore: Writable<boolean> = getContext('navHidden') ?? writable(true);
	const toggle = (ev: any) => hiddenStore.update((h) => !h);

	import { ToolbarButton } from 'flowbite-svelte';
	interface Props {
		menuClass?: string;
		onClick?: any;
		btnClass?: string;
		[key: string]: any;
	}

	let {
		menuClass = 'h-6 w-6 shrink-0',
		onclick = undefined,
		btnClass = 'ms-3',
		...rest
	}: Props = $props();
</script>

<ToolbarButton name="Open main menu" onclick={onclick || toggle} {...rest} class={btnClass}>
	<Menu class={menuClass} />
</ToolbarButton>

<!--d
@component
[Go to docs](https://flowbite-svelte.com/)
## Props
@prop export let menuClass: string = 'h-6 w-6 shrink-0';
@prop export let onClick: (() => void) | undefined = undefined;
-->
