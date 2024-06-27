<script lang="ts">
	import { Badge, Card, Toast, Tooltip } from 'flowbite-svelte';
	import { CheckCircleOutline } from 'flowbite-svelte-icons';

	$: open = copied;

	let copied = false;

	function copyPrincipalToClipboard() {
		navigator.clipboard
			.writeText(text)
			.then(() => {
				copied = true;
				setTimeout(() => {
					copied = false;
				}, 2000);
			})
			.catch((err) => {
				console.error('Failed to copy text: ', err);
			});
	}
	export let badge: string;
	export let text: string;

	// function getTextWithBreaks(text: string) {
	// 	if (text.length > 41) {
	// 		const firstPart = text.slice(0, 41);
	// 		const secondPart = text.slice(41);
	// 		return `<span class="math-inline">${firstPart}<br\></span>${secondPart}`;
	// 	} else {
	// 		return text;
	// 	}
	// }
</script>

<Card size="lg">
	<Badge rounded border class="w-fit">{badge}</Badge>
	<button on:click={copyPrincipalToClipboard}>
		<p
			class="font-normal text-gray-700 dark:text-gray-400 leading-tight hover:underline text-start whitespace-pre-wrap"
		>
			{text}
		</p>
	</button>
	<Tooltip>Copy</Tooltip>
</Card>

<Toast color="none" bind:open position="top-right">
	<CheckCircleOutline slot="icon" />
	Copied!
</Toast>
