<script>
	import { flip } from '@utils/transition.utils';

	// @ts-nocheck
	import { ChevronDoubleDownOutline, ChevronDoubleUpOutline } from 'flowbite-svelte-icons';

	let {
		size = '24',
		color = 'currentColor',
		isOpen = false,
		ariaLabel = 'toggle menu',
		class: className = '',
		onclick,
		...restProps
	} = $props();
</script>

<div role="button" tabindex="0" class={className} {...restProps} aria-label={ariaLabel} {onclick}>
	{#if isOpen}
		<div in:flip={{ duration: 300, axis: 'x' }}>
			<ChevronDoubleUpOutline class="size-[{size}px]" {color} />
		</div>
	{:else}
		<div in:flip={{ duration: 300, axis: 'x' }}>
			<ChevronDoubleDownOutline class="size-[{size}px]" {color} />
		</div>
	{/if}
</div>

<!--
@component
[Go to docs](https://flowbite-svelte.com/)
## Props
@prop export let size = '24';
@prop export let color = 'currentColor';
@prop export let variation: 'solid' | 'outline' = 'outline';
@prop export let ariaLabel = 'bars 3';
-->
