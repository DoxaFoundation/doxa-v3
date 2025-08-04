<script lang="ts">
	import { isBadActor } from '$lib/api/root.canister.api';
	import { authStore } from '@stores/auth.store';
	import { Modal } from 'flowbite-svelte';
	import { onDestroy } from 'svelte';

	let visible = $state(false);
	const unsubscribe = authStore.subscribe(async (authData) => {
		if (authData && authData?.isAuthenticated) {
			visible = await isBadActor();

			if (visible) {
				await authStore.signOut();
			}
		}
	});

	onDestroy(unsubscribe);
</script>

{#if visible}
	<Modal bind:open={visible} title="Access Blocked" dismissable={false} size="md">
		<div class="text-center space-y-4">
			<div class="mx-auto mb-4 text-red-500">
				<svg class="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
					<path
						fill-rule="evenodd"
						d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
						clip-rule="evenodd"
					></path>
				</svg>
			</div>
			<h3 class="text-xl font-semibold text-gray-900 dark:text-white">Access Denied</h3>
			<p class="text-gray-600 dark:text-gray-400">
				Your account has been flagged for suspicious activity and access has been temporarily
				restricted.
			</p>
			<div
				class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
			>
				<p class="text-sm text-red-700 dark:text-red-300">
					If you believe this is an error, please contact our support team with your account
					details.
				</p>
			</div>
		</div>
	</Modal>
{/if}
