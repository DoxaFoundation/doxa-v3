<script lang="ts">
	import { authStore } from '$lib/stores/auth.store';
	import { onMount, onDestroy, tick } from 'svelte';
	import { Button, Tooltip } from 'flowbite-svelte';
	import { Input } from 'flowbite-svelte';
	import SelectDropDown from '$lib/components/SelectDropDown.svelte';
	import { ckUsdcBase64 } from '../assets/base64-svg';
	import { balances } from '@states/ledger-balance.svelte';
	import { Loader } from 'lucide-svelte';
	import {
		CKUSDC_LEDGER_CANISTER_ID,
		DUSD_LEDGER_CANISTER_ID,
		ICP_LEDGER_CANISTER_ID,
		CKETH_LEDGER_CANISTER_ID,
		CKBTC_LEDGER_CANISTER_ID
	} from '@constants/app.constants';
	import EmailPopUp from '@components/NewsLetter/EmailPopUp.svelte';
	import { getFee } from '@utils/icrc-ledger.utils';
	import { LedgerMetadata } from '@states/ledger-metadata.svelte';
	import { getQuote } from '@services/swap.service';
	import { mintDusd } from '@services/dusd-mint.service';
	import { fetchSwapPoolData, poolsMap } from '@states/swap-pool-data.svelte';
	import { getPoolKeyStoreKey } from '@utils/swap.utils';

	type Item = {
		id: number;
		value: string;
		img: string;
		name: string;
		ledgerId: string;
	};

	let selectedToken: string = $state('ckUSDC');
	let selectTokenAmount = $state(0);
	let selectedTknLedgerId: string = $state(CKUSDC_LEDGER_CANISTER_ID);

	let selectedMintingToken: string = $state('DUSD');

	let mintButtonDisable = $state(true);
	let buttonMessage = $state('Mint');
	let isMinting = $state(false);

	let expectedMintAmount = $state(0);
	let loader = $state(false);
	let quoteUpdateTimeout: NodeJS.Timeout | undefined;
	let quoteCkUsdAmount = 0;

	let minimumSelectAmountForMint = $state(
		new Map<string, number>([[CKUSDC_LEDGER_CANISTER_ID, 1.01]])
	);

	let balance = $derived(balances[selectedTknLedgerId]?.number ?? 0);
	let fee = $derived.by(() => {
		try {
			return getFee(selectedTknLedgerId);
		} catch (e) {
			console.error(e);
			return 0;
		}
	});

	let mintUsing: Item[] = [
		{
			id: 1,
			value: 'ckUSDC',
			img: ckUsdcBase64,
			name: 'ckUSDC',
			ledgerId: CKUSDC_LEDGER_CANISTER_ID
		},
		{
			id: 2,
			value: 'ICP',
			img: '/images/ICP-Token-dark.svg',
			name: 'ICP',
			ledgerId: ICP_LEDGER_CANISTER_ID
		},
		{
			id: 3,
			value: 'ckETH',
			img: '/images/ckETH-Token.svg',
			name: 'ckETH',
			ledgerId: CKETH_LEDGER_CANISTER_ID
		},
		{
			id: 4,
			value: 'ckBTC',
			img: '/images/ckBTC-Token.svg',
			name: 'ckBTC',
			ledgerId: CKBTC_LEDGER_CANISTER_ID
		}
	];
	let mintingToken: Item[] = [
		{
			id: 1,
			value: 'DUSD',
			name: 'Doxa USD',
			img: '/images/DUSD-black.svg',
			ledgerId: DUSD_LEDGER_CANISTER_ID
		}
	];

	// Optimized effect - only run when necessary
	$effect(() => {
		if (selectTokenAmount > 0 && selectedToken !== 'ckUSDC') {
			debounceUpdateQuote();
		} else if (selectTokenAmount > 0 && selectedToken === 'ckUSDC') {
			// Handle ckUSDC case immediately without debounce
			updateCkUSDCExpectedAmount();
		}
		return () => {
			if (quoteUpdateTimeout) {
				clearTimeout(quoteUpdateTimeout);
			}
		};
	});

	// Combined effect for balance and button state
	$effect(() => {
		balances;
		disableMintButton();
	});

	// Only update minimum amounts when pools data changes
	$effect(() => {
		if (poolsMap.size > 0) {
			updateMinimumSelectAmountForMint();
		}
	});

	function setMaxCkUSDC() {
		if (balance > 0) {
			selectTokenAmount = balance - 0.01;
		}
		disableMintButton();
	}

	const max = () => {
		if (selectedToken === 'ckUSDC') {
			setMaxCkUSDC();
		} else {
			// for other tokens
			if (balance > 2 * fee) {
				selectTokenAmount = balance - 2 * fee;
			}
			disableMintButton();
		}
	};

	function disableMintButton() {
		// Don't change button message if currently minting
		if (isMinting) return;

		if (!$authStore?.isAuthenticated) {
			mintButtonDisable = true;
			buttonMessage = 'Connect to mint';
			return;
		} else if (selectedMintingToken !== 'DUSD') {
			buttonMessage = selectedMintingToken + ' is coming soon...';
			mintButtonDisable = true;
			return;
		} else {
			let minimumBalance = minimumSelectAmountForMint.get(selectedTknLedgerId);

			if (!minimumBalance) {
				mintButtonDisable = true;
				return;
			}

			// for other tokens, fee is swap transfer fee
			let transferFeeForMint = selectedTknLedgerId === CKUSDC_LEDGER_CANISTER_ID ? fee : 2 * fee;

			if (balance < minimumBalance) {
				buttonMessage = `Not enough balance, minimum ${minimumBalance} ${selectedToken}`;
				mintButtonDisable = true;
				return;
			} else if (selectTokenAmount > balance - transferFeeForMint) {
				buttonMessage = 'Not enough balance';
				mintButtonDisable = true;
				return;
			} else if (selectTokenAmount < minimumBalance) {
				buttonMessage = `Minimum ${minimumBalance} ${selectedToken}`;
				mintButtonDisable = true;
				return;
			}

			mintButtonDisable = false;
			buttonMessage = 'Mint';
		}
	}

	async function onclick() {
		await tick();
		isMinting = true;
		loader = true;
		buttonMessage = 'Minting...';

		try {
			await mintDusd(selectedTknLedgerId, selectTokenAmount, quoteCkUsdAmount.toString());
		} catch (error) {
			console.error('Error minting DUSD:', error);
		} finally {
			// Reset all states in the correct order
			isMinting = false;
			loader = false;
			selectTokenAmount = 0;
			expectedMintAmount = 0;
			// Ensure UI updates before changing button message
			await tick();
			disableMintButton();
		}
	}

	function change(item: Item) {
		selectedTknLedgerId = item.ledgerId;
		selectTokenAmount = 0;
		expectedMintAmount = 0;
		quoteCkUsdAmount = 0;
		disableMintButton();
	}

	// Optimized function to update minimum amounts
	let updateMinimumSelectAmountForMint = async () => {
		// Only process non-ckUSDC items
		const nonCkUSDCItems = mintUsing.filter((item) => item.ledgerId !== CKUSDC_LEDGER_CANISTER_ID);

		// Process all items in parallel for better performance
		const promises = nonCkUSDCItems.map((item) => getAMinimumAmount(item.ledgerId));
		await Promise.allSettled(promises);
	};

	const getAMinimumAmount = async (ledgerId: string) => {
		// Check if pool exists before getting quote
		const key = getPoolKeyStoreKey(ledgerId, CKUSDC_LEDGER_CANISTER_ID);
		const pool = poolsMap.get(key);

		if (!pool) return;

		try {
			const quote = await getQuote(CKUSDC_LEDGER_CANISTER_ID, ledgerId, '1.1');
			minimumSelectAmountForMint.set(ledgerId, quote ?? 0);
		} catch (error) {
			console.error(`Failed to get minimum amount for ${ledgerId}:`, error);
		}
	};

	// Separate function for ckUSDC expected amount calculation
	const updateCkUSDCExpectedAmount = () => {
		const minimumMintAmount = minimumSelectAmountForMint.get(selectedTknLedgerId);
		if (minimumMintAmount) {
			expectedMintAmount = selectTokenAmount < minimumMintAmount ? 0 : selectTokenAmount;
		} else {
			expectedMintAmount = 0;
		}
	};

	const updateQuote = async () => {
		// Early return if ckUSDC
		if (selectedToken === 'ckUSDC') return;

		const minimumMintAmount = minimumSelectAmountForMint.get(selectedTknLedgerId);

		let previousButtonMessage = buttonMessage;
		// Only update button message if not currently minting
		if (!isMinting) {
			buttonMessage = 'Getting Quote...';
		}
		loader = true;

		try {
			const quote = await getQuote(
				selectedTknLedgerId,
				CKUSDC_LEDGER_CANISTER_ID,
				selectTokenAmount.toString()
			);
			quoteCkUsdAmount = quote ?? 0;
			let outputckUSDCAmountMinusFee = quoteCkUsdAmount - fee;

			if (minimumMintAmount) {
				expectedMintAmount =
					outputckUSDCAmountMinusFee < minimumMintAmount ? 0 : outputckUSDCAmountMinusFee;
			} else {
				expectedMintAmount = 0;
			}
		} catch (error) {
			console.error('Error getting quote:', error);
			expectedMintAmount = 0;
		} finally {
			loader = false;
			// Only restore button message if not currently minting
			if (!isMinting) {
				buttonMessage = previousButtonMessage;
			}
		}
	};

	const debounceUpdateQuote = () => {
		if (selectTokenAmount === 0) return;

		// Clear existing timeout
		if (quoteUpdateTimeout) {
			clearTimeout(quoteUpdateTimeout);
		}

		// Set new timeout
		quoteUpdateTimeout = setTimeout(updateQuote, 500);
	};

	onMount(async () => {
		disableMintButton();

		// Run both async operations in parallel for faster loading
		await Promise.all([
			fetchSwapPoolData(),
			// Small delay to ensure pools data is available
			new Promise((resolve) => setTimeout(resolve, 100))
		]);

		// Update minimum amounts after pools data is loaded
		await updateMinimumSelectAmountForMint();
		disableMintButton();
	});

	const unsubscribe = authStore.subscribe((value) => {
		disableMintButton();
	});

	onDestroy(() => {
		if (quoteUpdateTimeout) {
			clearTimeout(quoteUpdateTimeout);
		}
		unsubscribe();
	});
</script>

<EmailPopUp />

<div class="flex flex-col items-center justify-center mt-2">
	<div class="md:p-8 p-4 dark:bg-sky-200 md:w-fit w-full rounded-2xl border box mb-4">
		<div class="max-sm:flex max-sm:flex-col max-sm:items-center">
			<div class="m-6">
				<div class="flex items-center gap-2 justify-between">
					<span class="font-bold">Minting using</span>
					{#if balance > 2 * fee}
						<Button
							type="button"
							class="px-2.5 py-1 rounded-lg h-5"
							color="alternative"
							size="xs"
							onclick={max}>Max</Button
						>
					{/if}
				</div>
				<div class="md:flex gap-2">
					<SelectDropDown
						items={mintUsing}
						placeholder="Choose token"
						class="mt-2 max-md:w-full"
						{change}
						bind:value={selectedToken}
					/>
					<div class="md:flex md:flex-col-reverse md:pl-2 max-md:mt-3">
						<Input
							bind:value={selectTokenAmount}
							class="h-16 font-medium text-base w-fit max-md:w-full box bg-white border shadow-md text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
							type="number"
							placeholder="Enter amount"
							size="md"
							on:input={disableMintButton}
						>
							<!-- <svelte:fragment slot="right">
									{#if selectTokenAmount + 0.01 !== balances[CKUSDC_LEDGER_CANISTER_ID]?.number && selectedToken === 'ckUSDC'}
										<button class="text-center" on:click={setMaxCkUSDC}>Max</button>
									{/if}
								</svelte:fragment> -->
						</Input>
						<Tooltip>Enter amount</Tooltip>
					</div>
				</div>

				{#if balances[selectedTknLedgerId]?.format && LedgerMetadata[selectedTknLedgerId]?.symbol}
					<div class="flex justify-end items-center gap-1 mt-2">
						<span class="text-sm font-normal">Available:</span>
						<span class="text-sm font-medium">
							{balances[selectedTknLedgerId]?.format}
							{LedgerMetadata[selectedTknLedgerId]?.symbol}
						</span>
					</div>
				{/if}
			</div>

			<div class="m-6">
				<span class="font-bold">Select currency to mint</span>
				<div class="md:flex gap-2">
					<SelectDropDown
						items={mintingToken}
						placeholder="Choose token"
						class="mt-2 max-md:w-full"
						change={disableMintButton}
						bind:value={selectedMintingToken}
					/>

					<div class="md:flex md:flex-col-reverse md:pl-2 max-md:mt-3">
						<Input
							bind:value={expectedMintAmount}
							class="h-16 font-medium text-base w-fit max-md:w-full box bg-white border shadow-md text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
							type="number"
							placeholder="Enter amount"
							size="md"
							on:change={disableMintButton}
							disabled
						/>
					</div>
				</div>
			</div>
		</div>
		<div class="flex justify-center">
			<Button
				class="bg-black text-base p-6 w-44 md:w-60 rounded-3xl font-light  hover:bg-blue-400"
				disabled={mintButtonDisable || isMinting || loader}
				{onclick}
				>{#if isMinting}<Loader class="animate-spin" />{/if}
				{buttonMessage}
			</Button>
		</div>
	</div>
</div>

<style lang="postcss">
	:global(html) {
	}

	.box {
		box-shadow: 0px 1px 5px 0px rgba(0, 0, 0, 0.1);
	}
</style>
