<script lang="ts">
	let { href = '', children, ...rest } = $props();
	let liClass = 'block py-2 pe-4 ps-3 lg:p-0 rounded lg:border-0';
</script>

<li>
	<svelte:element
		this={href ? 'a' : 'div'}
		role={href ? undefined : 'link'}
		{href}
		{...rest}
		class={liClass}
	>
		{@render children()}
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
