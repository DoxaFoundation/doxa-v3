<script>
	import { Alert } from 'flowbite-svelte';

	import { DarkMode } from 'flowbite-svelte';
</script>

<h1 class="text-3xl font-bold underline text-cyan-600">Hello world!</h1>

<div class="p-8">
	<Alert>
		<span class="font-medium">Info alert!</span>
		Change a few things up and try submitting again.
	</Alert>
</div>
<!-- src/routes/+layout.svelte -->

<DarkMode />

<style lang="postcss">
	:global(html) {
	}
</style>
