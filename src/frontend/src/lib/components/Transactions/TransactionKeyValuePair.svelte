<script lang="ts">
	import { nonNullish } from '@dfinity/utils';
	import { Tooltip } from 'flowbite-svelte';
	import { CircleHelp } from 'lucide-svelte';
	import type { Snippet } from 'svelte';

	type Props = {
		key: string;
		value?: string | number;
		tip: string;
		border_top?: boolean;
		valueElement?: Snippet;
	};
	let { key, value, tip, border_top = true, valueElement }: Props = $props();
</script>

<div
	class="sm:flex sm:justify-start sm:items-center"
	class:border-t={border_top}
	class:border-gray-300={border_top}
	class:dark:border-gray-700={border_top}
>
	<div class="xl:w-56 sm:w-48 sm:shrink-0 px-6 pt-[25px] sm:py-[25px] box-border">
		<span class="text-xs xl:text-sm font-normal text-gray-500 flex items-center"
			>{key}<CircleHelp size={16} class="ml-1" />
			<Tooltip>{tip}</Tooltip></span
		>
	</div>

	<div class="px-6 pb-[25px] pt-2 sm:py-[25px] box-border">
		{#if nonNullish(value)}
			<span class="text-base xl:text-lg text-gray-900 dark:text-white break-all text-wrap"
				>{value}</span
			>
		{:else if valueElement}
			{@render valueElement()}
		{/if}
	</div>
</div>
