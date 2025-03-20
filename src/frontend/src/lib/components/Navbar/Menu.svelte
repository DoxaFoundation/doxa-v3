<script>
	import { ChevronDoubleDownOutline } from 'flowbite-svelte-icons';

	let {
		size = 32,
		color = 'currentColor',
		isOpen = false,
		ariaLabel = 'toggle menu',
		class: className = '',
		onclick,
		...restProps
	} = $props();
</script>

<div role="button" tabindex="0" class={className} {...restProps} aria-label={ariaLabel} {onclick}>
	<div class="icon-wrapper" class:open={isOpen}>
		<ChevronDoubleDownOutline class="size-[{size}px]" {color} />
	</div>
</div>

<style>
	.icon-wrapper {
		transition: transform 300ms ease-out;
	}

	.icon-wrapper.open {
		transform: rotateX(180deg);
	}
</style>
