<script lang="ts">
	import { Tooltip } from 'flowbite-svelte';
	import { CircleHelp } from 'lucide-svelte';
	import type { Snippet } from 'svelte';

	type Props = {
		label?: string;
		value?: string;
		tip?: string;
		children?: Snippet;
	};
	let { label = '', value = '', tip, children }: Props = $props();
</script>

<div>
	<div class="w-full flex justify-between">
		<span class="text-sm text-gray-500 flex items-center text-left"
			>{label}

			{#if tip}
				<CircleHelp size={16} class="ml-1" />
				<Tooltip>{tip}</Tooltip>
			{/if}
		</span>
		<span class="text-sm text-gray-900 font-normal dark:text-white text-right">{value}</span>
	</div>
	{#if children}
		<div class="space-y-1 ml-8">{@render children()}</div>
	{/if}
</div>
