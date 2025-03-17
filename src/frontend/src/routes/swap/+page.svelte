<script lang="ts">
	import ConfirmSwapModal from '@components/Swap/ConfirmSwapModal.svelte';
	import FlipSelection from '@components/Swap/FlipSelection.svelte';
	import ReclaimUnusedToken from '@components/Swap/ReclaimUnusedToken.svelte';
	import SlippageModal from '@components/Swap/SlippageModal.svelte';
	import SwapInputBox from '@components/Swap/SwapInputBox.svelte';
	import SwapSelection from '@components/Swap/SwapSelection.svelte';
	import { getQuote, swapToken } from '@services/swap.service';
	import { balances } from '@states/ledger-balance.svelte';
	import { LedgerMetadata } from '@states/ledger-metadata.svelte';
	import { fetchPrices, price } from '@states/tokens-price.svelte';
	import { authStore } from '@stores/auth.store';
	import { getFee } from '@utils/icrc-ledger.utils';
	import { isPoolExists } from '@utils/swap.utils';
	import { Loader } from 'lucide-svelte';

	let from = $state('');
	let to = $state('');

	let give = $state('0');
	let get = $state('0');

	let slippage = $state<string>('0.5');

	let buttonMessage = $state('Swap');

	let loader = $state(false);
	let swapOngoing = $state(false);

	let quoteUpdateTimeout: NodeJS.Timeout | string | number | undefined;

	$inspect(from);
	$inspect(to);

	$effect(() => {
		if (!from || !to) {
			buttonMessage = 'Select Token';
		} else if (!$authStore?.isAuthenticated) {
			buttonMessage = 'Connect Wallet';
			debounceUpdateQuote();
		} else if (!isPoolExists(from, to)) {
			buttonMessage = 'Pool does not exist';
			get = '0';
		} else if (give === '' || Number(give) <= 0) {
			buttonMessage = 'Enter Amount';
			get = '0';
		} else if (!swapOngoing) {
			debounceUpdateQuote();

			if (
				Number(give) > (balances[from]?.number ?? 0) - 2 * getFee(from) ||
				balances[from]?.number <= 2 * getFee(from)
			) {
				buttonMessage = 'Insufficient Balance';
			} else {
				buttonMessage = 'Swap';
			}
		}

		fetchPrices();
		return () => {
			clearTimeout(quoteUpdateTimeout);
		};
	});

	const updateQuote = async () => {
		let previousButtonMessage = buttonMessage;
		buttonMessage = 'Getting Quote...';
		loader = true;
		const { decimals } = LedgerMetadata[to];
		const quote = await getQuote(from, to, give);
		get = quote?.toFixed(decimals) ?? '0';

		loader = false;
		buttonMessage = previousButtonMessage;
		calculateValueDiff();
	};

	const debounceUpdateQuote = () => {
		if (give === '' || give === '0') return;
		clearTimeout(quoteUpdateTimeout);
		console.log('debounce initated');
		quoteUpdateTimeout = setTimeout(updateQuote, 500);
	};

	const swap = async () => {
		clearTimeout(quoteUpdateTimeout);
		let previousButtonMessage = buttonMessage;
		buttonMessage = 'Swapping...';
		swapOngoing = true;
		const result = await swapToken(from, to, give, get, Number(slippage));

		if (result.success) {
			give = '';
			get = '';
		}
		swapOngoing = false;

		buttonMessage = previousButtonMessage;
	};

	let open = $state(false);

	let valueDiff = $state('');

	const calculateValueDiff = () => {
		let receivedValue = (price[to] ?? 0) * Number(get);
		let paidValue = (price[from] ?? 0) * Number(give);

		valueDiff = (((receivedValue - paidValue) / paidValue) * 100).toFixed(2);
	};
</script>

<ConfirmSwapModal bind:open {from} {to} {give} {get} {slippage} onclick={swap} />
<br />
<div class="max-w-xl mx-auto space-y-2 rounded-lg px-1.5 md:px-0">
	<div class="flex justify-end"><SlippageModal bind:value={slippage} /></div>
	<div class="w-full border rounded-lg p-4 space-y-2.5">
		<div class="flex w-full items-center justify-between gap-2">
			<span class="text-2xl font-semibold">You Give</span>
			<SwapSelection bind:selected={from} disableTokenList={[to, from]} />
		</div>
		<SwapInputBox bind:value={give} ledgerId={from} maxOn />
	</div>

	<FlipSelection bind:from bind:to bind:give bind:get />

	<div class="w-full border rounded-lg p-4 space-y-2.5">
		<div class="flex w-full items-center justify-between gap-2">
			<span class="text-2xl font-semibold">You Get</span>
			<SwapSelection bind:selected={to} disableTokenList={[to, from]} />
		</div>
		<SwapInputBox bind:value={get} ledgerId={to} disabled={true} {valueDiff} />
	</div>

	<div>
		<button
			class="w-full mt-4 p-4 rounded-lg flex items-center justify-center gap-2 disabled:opacity-70 {loader
				? 'bg-transparent border text-black dark:text-white'
				: 'text-white bg-primary-900 hover:bg-primary-700 dark:bg-primary-600 dark:hover:bg-primary-700'}"
			class:disabled:opacity-100={swapOngoing || loader}
			class:hover:bg-primary-900={swapOngoing}
			class:dark:hover:bg-primary-600={swapOngoing}
			class:bg-white={loader}
			disabled={buttonMessage !== 'Swap'}
			onclick={() => (open = true)}
			>{#if loader || swapOngoing}<Loader class="animate-spin" />{/if}
			{buttonMessage}
		</button>
	</div>

	<br />
	<ReclaimUnusedToken tokenX={from} tokenY={to} />
</div>
