<script>
	import { Banner } from 'flowbite-svelte';
	import { OctagonAlert } from 'lucide-svelte';
	import RiskWarningModal from './RiskWarningModal.svelte';
	import { authStore } from '@stores/auth.store';
	import { isRiskWarningAccepted } from '@services/risk-warning.svelte';
	import { onDestroy } from 'svelte';

	let bannerVisible = $state(false);

	const unsubscribe = authStore.subscribe(async (authData) => {
		if (authData && authData?.isAuthenticated) {
			const condition = await isRiskWarningAccepted();

			if (!condition) {
				bannerVisible = true;
			}
		}
	});

	onDestroy(unsubscribe);
</script>

{#if bannerVisible}
	<Banner
		bannerType="bottom"
		innerClass="w-full"
		dismissable={false}
		classDiv="bg-gray-200 dark:bg-gray-800"
	>
		<div class="flex items-center justify-between lg:mx-10 xl:mx-48">
			<div class="flex items-center gap-2 flex-wrap">
				<span class="me-3 inline-flex rounded-full bg-gray-200 p-1 dark:bg-gray-600">
					<OctagonAlert class="h-5 w-5 text-gray-500 dark:text-gray-400" />
					<span class="sr-only">Risk Warning</span>
				</span>

				<h2 class="mb-1 shrink-0 text-base font-semibold text-gray-900 dark:text-white">
					IMPORTANT RISK DISCLOSURE
				</h2>
			</div>

			<div class="flex items-center gap-2 justify-end ml-5">
				<RiskWarningModal bind:bannerVisible />
			</div>
		</div>
	</Banner>
{/if}
