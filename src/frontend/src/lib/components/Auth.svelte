<script lang="ts">
	import { authStore } from '../stores/auth.store';

	$: isAuthenticated = $authStore.isAuthenticated;

	const login = async () => {
		await authStore.signIn();
	};
</script>

{#if isAuthenticated}
	<button on:click={() => authStore.signOut()}>LOGOUT</button>
{:else}
	<button on:click={() => login()}>LOGIN</button>
{/if}
