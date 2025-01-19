<script lang="ts">
	import { Principal } from '@dfinity/principal';
	import { Button } from 'flowbite-svelte';
	import { onMount, onDestroy } from 'svelte';
	import { Modal } from 'flowbite-svelte';
	import { balanceStore } from '$lib/stores/balance.store';
	import { authStore } from '$lib/stores/auth.store';
	import { type IcrcTransferArg } from '@dfinity/ledger-icrc';
	import { Toast } from 'flowbite-svelte';
	import { CheckCircleSolid, CloseCircleSolid } from 'flowbite-svelte-icons';
	import { Select, Label, Input, Spinner } from 'flowbite-svelte';
	import { fly } from 'svelte/transition';
	import { assertNonNullish } from '@dfinity/utils';
	import { from6Decimals, to6Decimals } from '@utils/decimals.utils';

	interface Props {
		openTransferModal: boolean;
	}

	let { openTransferModal = $bindable() }: Props = $props();
	let selectedToken = $state('');
	let tokenslist = [
		{ value: 'USDx', name: 'Doxa Dollar' },
		{ value: 'ckUSDC', name: 'ckUSDC' }
	];

	let disableButton = false;
	let amount = $state<number>();
	let textPrincipal: string = $state('');
	let principal: Principal;

	let buttomMessage = $state('Confirm Transfer');
	let buttonDisable = $state(true);

	let transferSuccessToast = $state(false);
	let transferFailedToast = $state(false);

	function disableTransferButton() {
		if (selectedToken === '') {
			buttonDisable = true;
			buttomMessage = 'Select Token';
			return;
		}

		if (textPrincipal === '') {
			buttonDisable = true;
			buttomMessage = 'Enter Principal';
			return;
		}
		try {
			principal = Principal.fromText(textPrincipal);
		} catch (error) {
			buttonDisable = true;
			buttomMessage = 'Invalid Principal';
			return;
		}

		if (amount === undefined) {
			buttonDisable = true;
			buttomMessage = 'Enter Amount';
			return;
		} else {
			let balance = getCurrentSelectTokenBalance();
			if (balance <= 0.01) {
				buttonDisable = true;
				buttomMessage = 'Not enough balance';
				return;
			}
			if (amount > balance - 0.01) {
				buttonDisable = true;
				buttomMessage = 'Not enough balance';
				return;
			}

			buttonDisable = false;
			buttomMessage = 'Confirm Transfer';
		}
	}

	function getCurrentSelectTokenBalance(): number {
		if (selectedToken === 'USDx') {
			return from6Decimals($balanceStore.usdx);
		} else if (selectedToken === 'ckUSDC') {
			return from6Decimals($balanceStore.ckUsdc);
		} else {
			return 0;
		}
	}

	let amountPlaceholder = $state('Amount');
	function changeAmountPlaceholder() {
		if (selectedToken === 'USDx') {
			amountPlaceholder = 'Balance: ' + from6Decimals($balanceStore.usdx);
		} else if (selectedToken === 'ckUSDC') {
			amountPlaceholder = 'Balance: ' + from6Decimals($balanceStore.ckUsdc);
		} else {
			amountPlaceholder = 'Amount';
		}
	}

	function selectOnChange() {
		// @ts-ignore: next-line
		amount = undefined;
		changeAmountPlaceholder();
		disableTransferButton();
	}
	function onClickMaxButton() {
		if (selectedToken === 'USDx') {
			let balance = from6Decimals($balanceStore.usdx);
			if ($balanceStore.usdx > 0) {
				amount = balance - 0.01;
			}
		} else if (selectedToken === 'ckUSDC') {
			let balance = from6Decimals($balanceStore.ckUsdc);
			if ($balanceStore.ckUsdc > 0) {
				amount = balance - 0.01;
			}
		}
		disableTransferButton();
	}

	async function transferToken() {
		assertNonNullish(amount, 'Amount is undefined');
		let transferArg: IcrcTransferArg = {
			to: { owner: principal, subaccount: [] },
			fee: [],
			memo: [],
			from_subaccount: [],
			created_at_time: [],
			amount: to6Decimals(amount)
		};
		try {
			if (selectedToken === 'USDx') {
				let transferResult = await $authStore.USDx.icrc1_transfer(transferArg);
				if ('Ok' in transferResult) {
					transferSuccessToast = true;
				} else if ('Err' in transferResult) {
					transferFailedToast = true;
					console.error(JSON.stringify(transferResult.Err));
				}
			} else if (selectedToken === 'ckUSDC') {
				let transferResult = await $authStore.ckUSDC.icrc1_transfer(transferArg);
				if ('Ok' in transferResult) {
					transferSuccessToast = true;
				} else if ('Err' in transferResult) {
					transferFailedToast = true;
					console.error(JSON.stringify(transferResult.Err));
				}
			}
		} catch (error) {
			transferFailedToast = true;
			console.error(error);
		}
	}

	let loadSpinner = $state(false);
	async function onClickTransferButton() {
		loadSpinner = true;
		buttonDisable = true;
		transferSuccessToast = false;
		transferFailedToast = false;
		buttomMessage = 'Transferring...';
		await transferToken();
		loadSpinner = false;
		// @ts-ignore: next-line
		amount = undefined;
		textPrincipal = '';
		selectedToken = '';
		openTransferModal = false;
		changeAmountPlaceholder();
		disableTransferButton();
		await balanceStore.sync();
	}

	onMount(() => {
		disableTransferButton();
	});
	const unsubscribe = authStore.subscribe((value) => {
		disableTransferButton();
	});
	onDestroy(unsubscribe);

	const unsubscribe2 = balanceStore.subscribe((value) => {
		disableTransferButton();
	});
	onDestroy(unsubscribe2);
</script>

<Modal size="xs" title="Transfer tokens" bind:open={openTransferModal} outsideclose>
	<Select
		placeholder="Select a token to transfer"
		class="mt-2"
		items={tokenslist}
		bind:value={selectedToken}
		on:change={selectOnChange}
	/>

	<Label class="space-y-2">
		<span>Destination</span>
		<Input
			on:input={disableTransferButton}
			type="text"
			placeholder="Principal Id"
			size="md"
			bind:value={textPrincipal}
		/>
	</Label>

	<Label class="space-y-2">
		<div class="flex justify-between">
			<span>Amount</span>
			<button onclick={onClickMaxButton}><p class="underline hover:text-neutral-200">Max</p></button
			>
		</div>
		<Input
			on:input={disableTransferButton}
			type="number"
			placeholder={amountPlaceholder}
			size="md"
			bind:value={amount}
		/>
	</Label>

	{#if selectedToken !== ''}
		<p class="text-base leading-relaxed text-gray-500 dark:text-gray-400">
			Transaction Fee : 0.01 {selectedToken}
		</p>
	{/if}

	{#snippet footer()}
		<Button on:click={onClickTransferButton} disabled={buttonDisable} class="w-full">
			{#if loadSpinner}<Spinner class="me-3" size="6" color="white" />{/if}{buttomMessage}</Button
		>
		<!-- <Button color="alternative">Decline</Button> -->
	{/snippet}
</Modal>

<Toast
	transition={fly}
	params={{ x: 200 }}
	bind:toastStatus={transferSuccessToast}
	color="green"
	position="top-right"
>
	{#snippet icon()}
		<CheckCircleSolid class="w-5 h-5" />
		<span class="sr-only">Check icon</span>
	{/snippet}
	Transferred successfully.
</Toast>

<Toast
	transition={fly}
	params={{ x: 200 }}
	bind:toastStatus={transferFailedToast}
	color="red"
	position="top-right"
>
	{#snippet icon()}
		<CloseCircleSolid class="w-5 h-5" />
		<span class="sr-only">Error icon</span>
	{/snippet}
	Transfer Failed.
</Toast>
