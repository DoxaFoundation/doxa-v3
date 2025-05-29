<script lang="ts">
	import type { TransactionType } from '$lib/types/transactions';
	type Props = {
		type: TransactionType;
	};

	let { type }: Props = $props();
</script>

{#if type === 'Receive'}
	<h3 class="text-lg font-medium">Received</h3>
{:else if type === 'Send'}
	<h3 class="text-lg font-medium">Sent</h3>
{:else if type === 'Approve'}
	<h3 class="text-lg font-medium">Approved</h3>
{:else if type === 'Mint'}
	<h3 class="text-lg font-medium">Minted</h3>
{:else if type === 'Swap'}
	<h3 class="text-lg font-medium">Swapped</h3>
{:else if type === 'Stake'}
	<h3 class="text-lg font-medium">Staked</h3>
{:else if type === 'Burn'}
	<h3 class="text-lg font-medium">Burned</h3>
{:else if type === 'Transfer'}
	<h3 class="text-lg font-medium">Transferred</h3>
{/if}
