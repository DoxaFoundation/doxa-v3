<script lang="ts">
	import { balances, updateBalance } from '@states/ledger-balance.svelte';
	import { LedgerMetadata } from '@states/ledger-metadata.svelte';
	import { Tooltip } from 'flowbite-svelte';
	import { RefreshCw } from 'lucide-svelte';
	import SendTokenModel from './SendToken/SendTokenModel.svelte';

	let isRefresh = $state('');
</script>

<div class="grid grid-cols-1 gap-2 md:gap-4">
	{#each Object.entries(balances) as [canisterId, balance]}
		<div class="border p-2 md:p-4 rounded-lg">
			<div class="flex items-center justify-between">
				<div class="flex items-center">
					<img
						src={LedgerMetadata[canisterId].logo}
						alt="{LedgerMetadata[canisterId].name} Icon"
						class="drop-shadow-md w-6 sm:w-8 md:w-10"
					/>
					<span class="ml-2">{LedgerMetadata[canisterId].name}</span>
				</div>

				<div class="space-x-4 flex items-center w-fit">
					<div>
						<SendTokenModel ledgerId={canisterId} class="hover:text-gray-500" />
						<Tooltip class="sm:block hidden" trigger="hover">Send</Tooltip>
					</div>
					<div>
						<button
							type="button"
							class="hover:text-gray-500"
							onclick={async () => {
								isRefresh = canisterId;
								await updateBalance(canisterId);
								isRefresh = '';
							}}
						>
							<RefreshCw class={isRefresh === canisterId ? 'animate-spin' : ''} /></button
						>
						<Tooltip class="sm:block hidden" trigger="hover">Refresh</Tooltip>
					</div>
				</div>
			</div>

			<p
				class="text-xl sm:text-2xl md:text-3xl font-normal text-gray-700 leading-tight block break-words overflow-hidden"
			>
				{balance.format} <span class="text-base">{LedgerMetadata[canisterId].symbol}</span>
			</p>
		</div>
	{/each}
</div>
