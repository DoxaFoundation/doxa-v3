<script>
	import { balances } from '@states/ledger-balance.svelte';
	import { LedgerMetadata } from '@states/ledger-metadata.svelte';
	import { price } from '@states/tokens-price.svelte';
	import { formatUsdValue } from '@utils/fromat.utils';
	import { getFee } from '@utils/icrc-ledger.utils';
	import { Button } from 'flowbite-svelte';

	let {
		value = $bindable(),
		ledgerId = $bindable(),
		disabled = $bindable(false),
		oninput = undefined,
		maxOn = false,
		valueDiff = undefined
	} = $props();

	let metadata = $derived(LedgerMetadata[ledgerId]);
	$effect(() => {
		let valueTemp = value.replace(/[^0-9.]/g, '');

		// Remove leading zero if it's followed by a non-decimal digit
		if (valueTemp.length > 1 && valueTemp.startsWith('0') && valueTemp[1] !== '.') {
			valueTemp = valueTemp.substring(1);
		}

		const parts = valueTemp.split('.');
		if (parts.length > 2) {
			valueTemp = `${parts[0]}.${parts[1]}`;
		}

		if (parts[1]?.length > metadata?.decimals) {
			valueTemp = `${parts[0]}.${parts[1].slice(0, metadata?.decimals)}`;
		}

		value = valueTemp;
	});

	let balance = $derived(balances[ledgerId]?.number ?? 0);
	let fee = $derived.by(() => {
		try {
			return getFee(ledgerId);
		} catch (e) {
			console.error(e);
			return 0;
		}
	});

	const max = () => {
		// without trimming fee
		if (balance > 2 * fee) {
			value = (balance - 2 * fee).toString();
		}
	};
</script>

<div class="w-full flex items-center">
	<input
		class="w-full outline-0 focus:outline-none font-medium text-3xl md:text-4xl bg-inherit disabled:bg-inherit"
		type="text"
		placeholder="0.00"
		bind:value
		{disabled}
		{oninput}
	/>

	<!-- without trimming fee -->
	<!-- {#if balance > fee && maxOn} -->
	{#if balance > 2 * fee && maxOn}
		<Button
			type="button"
			class="px-2.5 py-1 rounded-lg h-5"
			color="alternative"
			size="xs"
			onclick={max}>Max</Button
		>
	{/if}
</div>
<div class="flex w-full items-center justify-between gap-2">
	<div class="flex items-center gap-1">
		<span class="text-sm font-normal">Value:</span>
		<span class="text-sm font-medium">${formatUsdValue((price[ledgerId] ?? 0) * value)}</span>
		{#if valueDiff}
			<span class="text-sm font-normal">({valueDiff}%)</span>
		{/if}
	</div>

	{#if balances[ledgerId]?.format && LedgerMetadata[ledgerId]?.symbol}
		<div class="flex items-center gap-1">
			<span class="text-sm font-normal">Available:</span>
			<span class="text-sm font-medium">
				{balances[ledgerId]?.format}
				{LedgerMetadata[ledgerId]?.symbol}
			</span>
		</div>
	{/if}
</div>
