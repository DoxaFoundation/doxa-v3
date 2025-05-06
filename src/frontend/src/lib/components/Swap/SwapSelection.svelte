<script lang="ts">
	import { balances } from '@states/ledger-balance.svelte';
	import { LedgerMetadata } from '@states/ledger-metadata.svelte';
	import { price } from '@states/tokens-price.svelte';
	import { formatUsdValue } from '@utils/fromat.utils';
	import { getIcrcLedgerCanisterIds } from '@utils/icrc-ledger.utils';
	import { Button, Modal } from 'flowbite-svelte';
	import { ChevronDownIcon } from 'lucide-svelte';

	let {
		disableTokenList = [],
		selected = $bindable()
	}: { disableTokenList?: string[]; selected?: string } = $props();

	let open = $state(false);

	const tokens = getIcrcLedgerCanisterIds();

	const onSelect = (ledger: string) => () => {
		selected = ledger;
		open = false;
	};
</script>

<Button outline class="space-x-2 px-3 h-[54px]" onclick={() => (open = true)}>
	{#if selected}
		<img
			src={LedgerMetadata[selected]?.logo}
			class=" size-8"
			alt={LedgerMetadata[selected]?.symbol}
		/>
		<span class="text-lg md:font-semibold">{LedgerMetadata[selected]?.symbol}</span>
	{:else}
		<span class="text-lg md:font-semibold">Select Token</span>
	{/if}
	<ChevronDownIcon data-testid="chevron-down-icon" class="size-4" />
</Button>

<Modal
	title="Token Selection"
	class="divide-y-0"
	border={false}
	bind:open
	size="xs"
	autoclose
	outsideclose
	classHeader="text-gray-900  dark:text-white dark:placeholder-gray-400"
>
	{#each tokens as ledgerId, index (ledgerId)}
		<button
			data-testid={index}
			color="alternative"
			disabled={selected === ledgerId || disableTokenList.includes(ledgerId)}
			class="border rounded-lg p-3 w-full flex items-center gap-2 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
			onclick={onSelect(ledgerId)}
		>
			<img
				src={LedgerMetadata[ledgerId]?.logo}
				class="size-10"
				alt={LedgerMetadata[ledgerId]?.symbol}
			/>

			<div class="flex justify-between w-full text-start text-gray-900 dark:text-white">
				<div class="flex flex-col">
					<span class="font-semibold">{LedgerMetadata[ledgerId]?.symbol}</span>
					<span class="text-sm text-gray-500">{LedgerMetadata[ledgerId]?.name}</span>
				</div>

				<div class="flex flex-col text-right">
					<span class="text-sm">{balances[ledgerId]?.format}</span>
					<span class="text-xs text-gray-500"
						>${formatUsdValue((price[ledgerId] ?? 0) * (balances[ledgerId]?.number ?? 0))}
					</span>
				</div>
			</div>
		</button>
	{/each}
</Modal>
