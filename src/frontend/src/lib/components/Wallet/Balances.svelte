<script lang="ts">
	import { balances, updateBalance } from '@states/ledger-balance.svelte';
	import { LedgerMetadata } from '@states/ledger-metadata.svelte';
	import { Tooltip } from 'flowbite-svelte';
	import { RefreshOutline } from 'flowbite-svelte-icons';

	let isRefresh = $state('');
</script>

<div class="grid grid-cols-1 gap-2">
	{#each Object.entries(balances) as [canisterId, balance]}
		<div class="border p-2 md:p-4 rounded-lg">
			<div class="flex items-center justify-between">
				<div class="flex items-center">
					<img
						src={LedgerMetadata[canisterId].logo}
						alt="{LedgerMetadata[canisterId].name} Icon"
						class="drop-shadow-md w-10 max-sm:w-6"
					/>
					<span class="ml-2">{LedgerMetadata[canisterId].name}</span>
				</div>
				<button
					onclick={async () => {
						isRefresh = canisterId;
						await updateBalance(canisterId);
						isRefresh = '';
					}}
				>
					<RefreshOutline class={isRefresh === canisterId ? 'animate-spin' : ''} /></button
				>
				<Tooltip>Refresh</Tooltip>
			</div>

			<p
				class="text-3xl max-sm:text-2xl font-normal text-gray-700 leading-tight block break-words overflow-hidden"
			>
				{balance.format} <span class="text-base">{LedgerMetadata[canisterId].symbol}</span>
			</p>
		</div>
	{/each}
</div>
