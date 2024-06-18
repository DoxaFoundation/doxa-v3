<script>
	export let href = '';
	let liClass = 'block py-2 pe-4 ps-3 lg:p-0 rounded lg:border-0';
	// $: console.log()
</script>

<li>
	<svelte:element
		this={href ? 'a' : 'div'}
		role={href ? undefined : 'link'}
		{href}
		{...$$restProps}
		on:blur
		on:change
		on:click
		on:focus
		on:keydown
		on:keypress
		on:keyup
		on:mouseenter
		on:mouseleave
		on:mouseover
		class={liClass}
	>
		<slot />
	</svelte:element>
</li>

<!--
@component
[Go to docs](https://flowbite-svelte.com/)
## Props
@prop export let href: string = '';
@prop export let activeClass: string | undefined = undefined;
@prop export let nonActiveClass: string | undefined = undefined;
-->
