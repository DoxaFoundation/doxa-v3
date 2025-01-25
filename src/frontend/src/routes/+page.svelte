<script lang="ts">
	import { authStore } from '$lib/stores/auth.store';
	import { Principal } from '@dfinity/principal';
	import { onMount, onDestroy, tick } from 'svelte';
	import { Button, Tooltip } from 'flowbite-svelte';
	import { balanceStore } from '$lib/stores/balance.store';
	import { Select, Label, Input } from 'flowbite-svelte';
	import ProgressSteps from '$lib/components/ProgressSteps.svelte';
	import type { Account, BlockIndex } from '@dfinity/ledger-icrc/dist/candid/icrc_ledger';
	import { ArrowLeftOutline } from 'flowbite-svelte-icons';
	import SelectDropDown from '$lib/components/SelectDropDown.svelte';
	import { ckUsdcBase64 } from '../assets/base64-svg';
	import { from6Decimals, to6Decimals } from '@utils/decimals.utils';

	let selectedToken: string = $state('ckUSDC');
	let selectedMint: string = $state('USDx');
	let mintUsing = [
		{ id: 1, value: 'ckUSDC', img: ckUsdcBase64, name: 'ckUSDC' },
		{ id: 2, value: 'ICP', img: '/images/ICP-Token-dark.svg', name: 'ICP' },
		{ id: 3, value: 'ckETH', img: '/images/ckETH-Token.svg', name: 'ckETH' },
		{ id: 4, value: 'ckBTC', img: '/images/ckBTC-Token.svg', name: 'ckBTC' }
	];
	let mintToken_ = [
		{
			id: 1,
			value: 'USDx',
			name: 'Doxa Dollar',
			img: '/images/USDx-black.svg'
		}
	];
	let mintToken = [
		{ value: 'USDx', name: 'Doxa Dollar' },
		{ value: 'Doxa Euro', name: 'Doxa Euro' },
		{ value: 'Doxa GBP', name: 'Doxa GBP' }
	];

	let selectTokenAmount_ckUSDC = $state(0);
	// let mintAmount_usdx = 0;

	let mintButtonDisable = $state(true);
	let buttonMessage = $state('Mint');

	function setMaxCkUSDC() {
		let balance = from6Decimals($balanceStore.ckUsdc);
		if (balance > 0) {
			selectTokenAmount_ckUSDC = balance - 0.01;
		}
		disableMintButton();
	}

	function disableMintButton() {
		if (!$authStore?.isAuthenticated) {
			mintButtonDisable = true;
			buttonMessage = 'Connect to mint';
			return;
		} else if (selectedToken !== 'ckUSDC') {
			buttonMessage = 'Minting using ' + selectedToken + ' is coming soon...';
			mintButtonDisable = true;
			return;
		} else if (selectedMint !== 'USDx') {
			buttonMessage = selectedMint + ' is coming soon...';
			mintButtonDisable = true;
			return;
		} else {
			let minimumBalance = 1.01;
			let currentBalance = from6Decimals($balanceStore.ckUsdc);

			if (currentBalance < minimumBalance) {
				buttonMessage = 'Not enough balance, minimum 1 ckUSDC + fee';
				mintButtonDisable = true;
				return;
			} else if (selectTokenAmount_ckUSDC > currentBalance - 0.01) {
				buttonMessage = 'Not enough balance';
				mintButtonDisable = true;
				return;
			} else if (selectTokenAmount_ckUSDC < 1) {
				buttonMessage = 'Minimum 1 ckUSDC + fee';
				mintButtonDisable = true;
				return;
			}

			mintButtonDisable = false;
			buttonMessage = 'Mint';
		}
	}

	/// Mint code
	type Status = 'completed' | 'in-progress' | 'error' | 'pending';
	function getInitialSteps() {
		return [
			{
				id: 1,
				text: 'Connection with ckUSDC, Stablecoin minter and USDx canisters',
				status: 'completed' as Status
			},
			{ id: 2, text: 'Sending ckUSDC to USDx Reserve Account', status: 'in-progress' as Status },
			{ id: 3, text: 'Notifying stablecoin minter', status: 'pending' as Status },
			{ id: 4, text: 'Minting USDx', status: 'pending' as Status }
		];
	}
	let steps = $state(getInitialSteps());

	async function mintAndUpdateBalance() {
		await mintUSDxWithCkUSDC();
		await balanceStore.sync();
	}

	async function mintUSDxWithCkUSDC() {
		try {
			let ckUSDCBlockIndex = await transferCkusdcToReserve();
			let usdxBlockIndex = await notifyStablecoinMinter(ckUSDCBlockIndex);
			steps[3].status = 'completed';
			steps[3].text = selectTokenAmount_ckUSDC + ' USDX minted in your Wallet ';
			steps = [...steps]; // Trigger reactivity
		} catch (error) {
			steps[3].status = 'error';
			steps = [...steps]; // Trigger reactivity
			console.error(error);
		}
	}

	async function transferCkusdcToReserve(): Promise<BlockIndex> {
		try {
			const usdxReserveAccount: Account = getUsdxReserveAccount();
			const transferResult = await $authStore.ckUSDC.icrc1_transfer({
				to: usdxReserveAccount,
				fee: [],
				memo: [],
				created_at_time: [],
				amount: to6Decimals(selectTokenAmount_ckUSDC),
				from_subaccount: []
			});
			if ('Ok' in transferResult) {
				steps[1].status = 'completed';
				steps[2].status = 'in-progress';
				steps = [...steps]; // Trigger reactivity
				return transferResult.Ok;
			} else {
				steps[1].status = 'error';
				steps = [...steps]; // Trigger reactivity
				throw new Error(
					'Error in transferCkusdcToReserve 1: ' + JSON.stringify(transferResult.Err)
				);
			}
		} catch (error) {
			steps[1].status = 'error';
			steps = steps; // Trigger reactivity
			// console.error(error);
			throw new Error('Error in transferCkusdcToReserve 2: ' + error);
		}
	}
	async function notifyStablecoinMinter(ckusdc_block_index: BlockIndex): Promise<BlockIndex> {
		try {
			const notifyResult = await $authStore.stablecoinMinter.notify_mint_with_ckusdc({
				minting_token: { USDx: null },
				ckusdc_block_index
			});
			if ('ok' in notifyResult) {
				steps[2].status = 'completed';
				steps[3].status = 'in-progress';
				steps = [...steps]; // Trigger reactivity
				return notifyResult.ok;
			} else {
				steps[2].status = 'error';
				steps = [...steps]; // Trigger reactivity
				throw new Error('Error in notify_mint_with_ckusdc: ' + JSON.stringify(notifyResult.err));
			}
		} catch (error) {
			steps[2].status = 'error';
			steps = [...steps]; // Trigger reactivity
			// console.error(error);
			throw new Error('Error in notify_mint_with_ckusdc: ' + error);
		}
	}

	function getUsdxReserveAccount(): Account {
		const array: number[] = new Array(32).fill(0);
		array[31] = 1;
		return {
			owner: Principal.fromText(import.meta.env.VITE_STABLECOIN_MINTER_CANISTER_ID),
			subaccount: [new Uint8Array(array)]
		};
	}
	async function getUsdxReserveAccount_(): Promise<Account> {
		return await $authStore.stablecoinMinter.get_ckusdc_reserve_account_of({
			token: { USDx: null }
		});
	}

	let toggleMintForm = $state(true);

	async function onClickMintButton() {
		await tick();
		toggleMintForm = !toggleMintForm;
		await mintAndUpdateBalance();
	}

	async function onClickBackButton() {
		toggleMintForm = !toggleMintForm;
		steps = getInitialSteps();
		selectTokenAmount_ckUSDC = 0;
		disableMintButton();
	}

	/////////////////////////////
	onMount(async () => {
		disableMintButton();
	});
	const unsubscribe = authStore.subscribe((value) => {
		disableMintButton();
	});
	onDestroy(unsubscribe);

	const unsubscribe2 = balanceStore.subscribe((value) => {
		disableMintButton();
	});
	onDestroy(unsubscribe2);
</script>

<div class="flex flex-col items-center justify-center mt-2">
	<div class="md:p-8 p-4 dark:bg-sky-200 md:w-fit w-full rounded-2xl border box mb-4">
		{#if toggleMintForm}
			<div class="max-sm:flex max-sm:flex-col max-sm:items-center">
				<div class="m-6">
					<span class="font-bold">Minting using</span>
					<div class="md:flex gap-2">
						<SelectDropDown
							items={mintUsing}
							placeholder="Choose token"
							class="mt-2 max-md:w-full"
							change={disableMintButton}
							bind:value={selectedToken}
						/>
						<div class="md:flex md:flex-col-reverse md:pl-2 max-md:mt-3">
							<Input
								bind:value={selectTokenAmount_ckUSDC}
								class="h-16 font-medium text-base w-fit max-md:w-full box bg-white border shadow-md text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
								type="number"
								placeholder="Enter amount"
								size="md"
								on:input={disableMintButton}
							>
								<!-- <svelte:fragment slot="right">
									{#if selectTokenAmount_ckUSDC + 0.01 !== from6Decimals($balanceStore.ckUsdc) && selectedToken === 'ckUSDC'}
										<button class="text-center" on:click={setMaxCkUSDC}>Max</button>
									{/if}
								</svelte:fragment> -->
							</Input>
							<Tooltip>Enter amount</Tooltip>
						</div>
					</div>
				</div>

				<div class="m-6">
					<span class="font-bold">Select currency to mint</span>
					<div class="md:flex gap-2">
						<SelectDropDown
							items={mintToken_}
							placeholder="Choose token"
							class="mt-2 max-md:w-full"
							change={disableMintButton}
							bind:value={selectedMint}
						/>

						<div class="md:flex md:flex-col-reverse md:pl-2 max-md:mt-3">
							<Input
								bind:value={selectTokenAmount_ckUSDC}
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
					disabled={mintButtonDisable}
					on:click={onClickMintButton}
				>
					{buttonMessage}
				</Button>
			</div>
		{:else}
			<ProgressSteps {steps} />
			<div class="flex justify-center">
				<button onclick={onClickBackButton}>
					<ArrowLeftOutline
						size="xl"
						class="bg-black text-white w-fit rounded-full drop-shadow-md"
					/></button
				>
			</div>
		{/if}
	</div>
</div>

<style lang="postcss">
	:global(html) {
	}

	.box {
		box-shadow: 0px 1px 5px 0px rgba(0, 0, 0, 0.1);
	}
</style>
