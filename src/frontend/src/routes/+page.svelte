<script lang="ts">
	import { authStore } from '$lib/stores/auth.store';
	import { Principal } from '@dfinity/principal';
	import { onMount, onDestroy, tick } from 'svelte';
	import { Button, Tooltip } from 'flowbite-svelte';
	import { balanceStore, from6Decimals, to6Decimals } from '$lib/stores/balance.store';
	import { Select, Label, Input } from 'flowbite-svelte';
	import ProgressSteps from '$lib/components/ProgressSteps.svelte';
	import type { Account, BlockIndex } from '@dfinity/ledger-icrc/dist/candid/icrc_ledger';
	import { ArrowLeftOutline } from 'flowbite-svelte-icons';

	let selectedToken: string = 'ckUSDC';
	let selectedMint: string = 'USDx';
	let mintUsing = [
		{ value: 'ckUSDC', name: 'ckUSDC' },
		{ value: 'ICP', name: 'ICP' },
		{ value: 'ckETH', name: 'ckETH' },
		{ value: 'ckBTC', name: 'ckBTC' }
	];
	let mintToken = [
		{ value: 'USDx', name: 'Doxa Dollar' },
		{ value: 'Doxa Euro', name: 'Doxa Euro' },
		{ value: 'Doxa GBP', name: 'Doxa GBP' }
	];

	let selectTokenAmount_ckUSDC = 0;
	// let mintAmount_usdx = 0;

	let mintButtonDisable = true;
	let buttonMessage = 'Mint';

	function setMaxCkUSDC() {
		let balance = from6Decimals($balanceStore.ckUsdc);
		if (balance > 0) {
			selectTokenAmount_ckUSDC = balance - 0.01;
		}
		disableMintButton();
	}

	function disableMintButton() {
		if (!$authStore.isAuthenticated) {
			mintButtonDisable = true;
			buttonMessage = 'Connect to mint';
			return;
		} else if (selectedToken !== 'ckUSDC') {
			buttonMessage = 'Minting using ' + selectedToken + ' is comming soon...';
			mintButtonDisable = true;
			return;
		} else if (selectedMint !== 'USDx') {
			buttonMessage = selectedMint + ' is comming soon...';
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
	let steps = getInitialSteps();

	async function mintAndUpdateBalance() {
		await mintUSDxWithCkUSDC();
		await balanceStore.sync();
	}

	async function mintUSDxWithCkUSDC() {
		try {
			let ckUSDCBlockIndex = await transferCkusdcToReserve();
			let usdxBlockIndex = await notifyStablecoinMinter(ckUSDCBlockIndex);
			steps[3].status = 'completed';
			steps[3].text = 'USDX minted at blockIndex ' + usdxBlockIndex.toString();
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
			const transferResult = await $authStore.ckUsdc.icrc1_transfer({
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

	let toggleMintForm = true;

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

<div class="flex flex-col items-center justify-center m-2">
	<div class="md:p-8 p-4 dark:bg-sky-200 md:w-fit w-full rounded-2xl border">
		{#if toggleMintForm}
			<div>
				<Label class="m-6">
					Minting using
					<div class="md:flex gap-2">
						<Select
							placeholder="Choose token"
							size="sm"
							class="mt-2 w-fit shadow-md shadow-gray-400"
							items={mintUsing}
							bind:value={selectedToken}
							on:change={disableMintButton}
						/>
						<div class="md:flex md:flex-col-reverse md:pl-2 max-md:mt-3">
							<Input
								bind:value={selectTokenAmount_ckUSDC}
								class="py-2 w-fit shadow-md"
								type="number"
								placeholder="Enter amount"
								size="md"
								on:input={disableMintButton}
							>
								<svelte:fragment slot="right">
									{#if selectTokenAmount_ckUSDC + 0.01 !== from6Decimals($balanceStore.ckUsdc) && selectedToken === 'ckUSDC'}
										<button class="text-center" on:click={setMaxCkUSDC}>Max</button>
									{/if}
								</svelte:fragment>
							</Input>
							<Tooltip>Enter amount</Tooltip>
						</div>
					</div>
				</Label>

				<Label class="m-6">
					Select currency to mint
					<div class="md:flex gap-2">
						<Select
							placeholder="Choose token"
							size="sm"
							class="mt-2 w-fit shadow-inner "
							items={mintToken}
							bind:value={selectedMint}
							on:change={disableMintButton}
						/>

						<div class="md:flex md:flex-col-reverse md:pl-2 max-md:mt-3">
							<Input
								bind:value={selectTokenAmount_ckUSDC}
								class="py-2  shadow-inner block w-52 disabled:cursor-not-allowed disabled:opacity-50 rtl:text-right"
								type="number"
								placeholder="Enter amount"
								size="md"
								on:change={disableMintButton}
								disabled
							/>
						</div>
					</div>
				</Label>

				<div class="flex justify-center">
					<Button
						class="bg-black text-base p-6 w-44 md:w-60 rounded-3xl font-light  hover:bg-blue-400"
						disabled={mintButtonDisable}
						on:click={onClickMintButton}
					>
						{buttonMessage}
					</Button>
				</div>
			</div>
		{:else}
			<ProgressSteps {steps} />
			<div class="flex justify-center">
				<button on:click={onClickBackButton}>
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
</style>
