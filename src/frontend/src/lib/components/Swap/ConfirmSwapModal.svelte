<script lang="ts">
	import LabelValuePair from '@components/LabelValuePair.svelte';
	import { getRateQuote } from '@services/swap.service';
	import { LedgerMetadata } from '@states/ledger-metadata.svelte';
	import { price } from '@states/tokens-price.svelte';
	import { formatNumber, formatUsdValue } from '@utils/fromat.utils';
	import { getFee } from '@utils/icrc-ledger.utils';
	import { Button, Modal, Tooltip } from 'flowbite-svelte';
	import { CircleHelp } from 'lucide-svelte';

	type Props = {
		open?: boolean;
		from: string;
		to: string;
		give: string;
		get: string;
		slippage: string;
		onclick: () => void | Promise<void>;
	};
	let { open = $bindable(false), from, to, give, get, slippage, onclick }: Props = $props();

	let rate = $state(0);

	$effect(() => {
		getRateQuote(from, to).then((value) => {
			rate = value || 0;
		});
	});

	let liquidityProviderFee = $derived.by(() => {
		if (Number(give) > 0) {
			return (Number(give) - getFee(from)) * (0.3 / 100);
		} else {
			return 0;
		}
	});
	let minReceive = $derived(Number(get) * (1 - Number(slippage) / 100));
</script>

<Modal
	size="sm"
	bind:open
	autoclose
	outsideclose
	title="Confirm Swap"
	class="divide-y-0"
	classHeader="text-gray-900  dark:text-white dark:placeholder-gray-400 bg-gray-100 dark:bg-gray-900"
	bodyClass="px-4 pb-4 md:px-5 md:pb-5 space-y-4"
	defaultClass="relative flex flex-col mx-auto bg-gray-100 dark:bg-gray-900"
>
	<div
		class="border-2 border-gray-300 dark:border-gray-700 rounded-xl bg-gray-200 dark:bg-gray-800"
	>
		<div class="p-3 w-full flex items-center gap-3">
			<img src={LedgerMetadata[from]?.logo} class="size-10" alt={LedgerMetadata[from]?.symbol} />
			<div class="w-full flex flex-col">
				<div class="flex justify-between items-center">
					<span class="text-sm font-normal text-gray-500 flex items-center"
						>You Give <CircleHelp size={16} class="ml-1" />
						<Tooltip>Actual swap amount after deducting deposit fee</Tooltip></span
					>
					<span class="text-sm font-normal text-gray-500"
						>${formatUsdValue((price[from] ?? 0) * Number(give))}</span
					>
				</div>
				<span class="text-xl font-semibold text-gray-900 dark:text-white"
					>{give} {LedgerMetadata[from]?.symbol}</span
				>
			</div>
		</div>

		<div class="p-3 w-full flex items-center gap-3 border-t border-gray-300 dark:border-gray-700">
			<img src={LedgerMetadata[to]?.logo} class="size-10" alt={LedgerMetadata[to]?.symbol} />
			<div class="w-full flex flex-col">
				<div class="flex justify-between items-center">
					<span class="text-sm font-normal text-gray-500">You Get</span>
					<span class="text-sm font-normal text-gray-500"
						>${formatUsdValue((price[to] ?? 0) * Number(get))}</span
					>
				</div>
				<span class="text-xl font-semibold text-gray-900 dark:text-white"
					>{get} {LedgerMetadata[to]?.symbol}</span
				>
			</div>
		</div>
	</div>

	<LabelValuePair
		label="Price"
		value="1 {LedgerMetadata[from].symbol} = {rate} {LedgerMetadata[to].symbol} (${formatUsdValue(
			(price[to] ?? 0) * rate
		)})"
	/>

	<LabelValuePair
		label="Liquidity pool fee"
		value="{formatNumber(liquidityProviderFee, from)} {LedgerMetadata[from]
			.symbol} (${formatUsdValue((price[from] ?? 0) * liquidityProviderFee)})"
		tip="For each trade a 0.3% fee is paid."
	/>

	<LabelValuePair
		label="Slippage tolerance"
		value="{slippage}%"
		tip="Your transaction will revert if the price changes unfavorably by more than this percentage."
	/>

	<LabelValuePair
		label="Minimum received"
		value="{formatNumber(minReceive, to)} {LedgerMetadata[to].symbol} (${formatUsdValue(
			(price[to] ?? 0) * minReceive
		)})"
		tip="Your transaction will revert if there is a large, unfavorable price movement before it is confirmed."
	/>

	<LabelValuePair
		label="Transfer fees for swap"
		tip="Swapping a too small amount might lead to failure!"
	>
		<LabelValuePair label="Deposit fee" value="{2 * getFee(from)} {LedgerMetadata[from].symbol}" />
		<LabelValuePair label="Withdraw fee" value="{getFee(from)} {LedgerMetadata[to].symbol}" />
	</LabelValuePair>

	<Button class="w-full " {onclick}>Confirm Swap</Button>
</Modal>
