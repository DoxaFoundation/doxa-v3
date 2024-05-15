<script lang="ts">
	import Auth from '$lib/components/Auth.svelte';
	import { authStore } from '$lib/stores/auth.store';

	let input = '';
	let disabled = false;
	let greeting = '';

	let whoami = '';
</script>

<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to read the documentation</p>

<main>
	<br />
	<br />

	<form
		on:submit={async () => {
			greeting = await $authStore.actor.greet(input);
		}}
	>
		<label for="name">Enter your name: &nbsp;</label>
		<input id="name" alt="Name" type="text" bind:value={input} {disabled} />
		<button type="submit">Click Me!</button>
	</form>

	<section id="greeting">
		{greeting}
	</section>

	<br />
	<br />

	<section style="text-align: center;">
		<Auth />
		<button
			on:click={async () => {
				whoami = await $authStore.actor.whoami();
			}}>Who ami</button
		>
		<p class="whoami-style">{whoami}</p>
	</section>
</main>

<style>
	.whoami-style {
		margin: 10px auto;
		padding: 10px 60px;
		border: 1px solid #e01717;
	}

	form {
		display: flex;
		justify-content: center;
		gap: 0.5em;
		flex-flow: row wrap;
		max-width: 40vw;
		margin: auto;
		align-items: baseline;
		font-family: sans-serif;
		font-size: 1.5rem;
	}

	button[type='submit'] {
		padding: 5px 20px;
		margin: 10px auto;
		float: right;
	}

	#greeting {
		margin: 10px auto;
		padding: 10px 60px;
		border: 1px solid #222;
	}

	#greeting:empty {
		display: none;
	}
</style>
