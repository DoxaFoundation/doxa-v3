<script lang="ts">
	import { authStore } from '$lib/stores/auth.store';

	let isAuthenticated = $derived($authStore.isAuthenticated);

	const login = async () => {
		await authStore.signIn({ identityProvider: 'ii' });
	};
</script>

{#if isAuthenticated}
	<button onclick={() => authStore.signOut()}>LOGOUT</button>
{:else}
	<button onclick={() => login()}>LOGIN</button>
{/if}
