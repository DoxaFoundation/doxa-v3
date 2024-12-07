<script lang="ts">
	import {
		SortHorizontalOutline,
		FireOutline,
		LandmarkOutline,
		BadgeCheckOutline
	} from 'flowbite-svelte-icons';
	import { Badge } from 'flowbite-svelte';

	export let type: string;
</script>

{#if type === 'Transfer'}
	<Badge color="purple"><SortHorizontalOutline class="h-4" />Transfer</Badge>
{:else if type === 'Mint'}
	<Badge color="green"><LandmarkOutline class="h-4" />Mint</Badge>
{:else if type === 'Burn'}
	<Badge color="red"><FireOutline class="h-4" />Burn</Badge>
{:else if type === 'Approve'}
	<Badge color="yellow"><BadgeCheckOutline class="h-4" />Approve</Badge>
{/if}
