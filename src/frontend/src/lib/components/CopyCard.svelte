<script lang="ts">
	// @ts-nocheck
	import { Badge, Card, Toast, Tooltip } from 'flowbite-svelte';
	import { CheckCircleOutline } from 'flowbite-svelte-icons';
	import { toast } from 'svelte-sonner';

	let copied = $state(false);

	let toastId: string | number;

	function copyPrincipalToClipboard() {
		navigator.clipboard
			.writeText(text)
			.then(() => {
				// copied = true;
				// setTimeout(() => {
				// 	copied = false;
				// }, 2000);

				toastId = toast.success('Copied!', { id: toastId });
			})
			.catch((err) => {
				console.error('Failed to copy text: ', err);
			});
	}

	let { badge, text } = $props();

	// 	if (text.length > 41) {
	// 		const firstPart = text.slice(0, 41);
	// 		const secondPart = text.slice(41);
	// 		return `<span class="math-inline">${firstPart}<br\></span>${secondPart}`;
	// 	} else {
	// 		return text;
	// 	}
	// }
</script>

<Card size="lg" padding="xs">
	<!-- <Badge rounded border class="w-fit">{badge}</Badge> -->
	<button onclick={copyPrincipalToClipboard}>
		<p
			class="font-normal text-base text-gray-700 dark:text-gray-400 leading-tight hover:underline text-start whitespace-pre-wrap"
		>
			{text}
		</p>
	</button>
	<Tooltip>Copy</Tooltip>
</Card>

<!-- <Toast color="none" bind:toastStatus={copied} position="top-right">
	{#snippet icon()}
		<CheckCircleOutline />
	{/snippet}
	Copied!
</Toast> -->
