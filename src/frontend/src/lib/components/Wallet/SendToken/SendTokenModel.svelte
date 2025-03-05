<script lang="ts">
	import { ICP_LEDGER_CANISTER_ID } from '@constants/app.constants';
	import { AccountIdentifier } from '@dfinity/ledger-icp';
	import { decodeIcrcAccount, type IcrcAccount } from '@dfinity/ledger-icrc';
	import { transferToken } from '@services/ledger.service';
	import { balances } from '@states/ledger-balance.svelte';
	import { LedgerMetadata } from '@states/ledger-metadata.svelte';
	import { fromDecimals } from '@utils/decimals.utils';
	import { preventDefault } from '@utils/event-handler.utils';
	import { formatNumber } from '@utils/fromat.utils';

	import { Button, Modal, Label, Input, Helper, Tooltip } from 'flowbite-svelte';
	import { CheckCheck, CircleHelp, Send, SendHorizontal } from 'lucide-svelte';
	import type { Snippet } from 'svelte';

	let formModal = $state(false);

	type Props = {
		ledgerId: string;
		iconSize?: number;
		children?: Snippet;
		class?: string;
	};

	let { ledgerId, iconSize, children, class: className }: Props = $props();

	let metadata = $derived(LedgerMetadata[ledgerId]);
	let balance = $derived(balances[ledgerId]);
	let fee = $derived(fromDecimals(metadata?.fee, ledgerId));

	let recipient = $state('');
	let amount = $state('');

	let recipientError = $state('');
	let amountError = $state('');

	let validAddressMessage = $state('');

	let isLoading = $state(false);

	let amountTouched = $state(false);
	let recipientTouched = $state(false);

	let disabled = $derived<boolean>(recipientError !== '' || amountError !== '' || isLoading);

	let to: IcrcAccount | AccountIdentifier;

	const max = () => {
		if (balance.number > fee) {
			amount = (balance.number - fee).toString();
			validateAmount(amount);
		} else {
			amountError = 'Insufficient balance for transfer + fee';
		}
		amountTouched = true;
	};

	$inspect(validAddressMessage);
	// 47c3a3eb6a0efa93e4a9063e319468deb8d7ad5a6f040ee4643047f574d2638c
	function validateAmount(value: string) {
		if (!value) {
			amountError = 'Amount is required';
			return;
		}

		const numValue = parseFloat(value);
		if (isNaN(numValue) || numValue <= 0) {
			amountError = 'Amount must be greater than 0';
			return;
		}

		const maxAmount = balance.number - fee;

		if (numValue > maxAmount) {
			amountError = 'Insufficient balance for transfer + fee';
			return;
		}

		amountError = '';
	}

	$effect(() => {
		let value = amount.replace(/[^0-9.]/g, '');

		const parts = value.split('.');
		if (parts.length > 2) {
			value = `${parts[0]}.${parts[1]}`;
		}

		if (parts[1]?.length > metadata?.decimals) {
			value = `${parts[0]}.${parts[1].slice(0, metadata?.decimals)}`;
		}

		amount = value;
		validateAmount(value);
	});

	// function handleAmountInput(event: Event) {
	// 	const input = event.target as HTMLInputElement;
	// 	let value = input.value.replace(/[^0-9.]/g, '');

	// 	const parts = value.split('.');
	// 	if (parts.length > 2) {
	// 		value = `${parts[0]}.${parts[1]}`;
	// 	}

	// 	if (parts[1]?.length > metadata?.decimals) {
	// 		value = `${parts[0]}.${parts[1].slice(0, metadata?.decimals)}`;
	// 	}

	// 	amount = value;
	// 	validateAmount(value); // Remove errorMessage = "" to let validation set proper message
	// }

	function validateICRC1Account(address: string): IcrcAccount | null {
		try {
			if (address.length < 8) return null; // Minimum length of principal id is 8 (aaaaa-aa)
			return decodeIcrcAccount(address);
		} catch (error) {
			console.error(error);
			return null;
		}
	}

	function validateAccountIdentifier(address: string): AccountIdentifier | null {
		try {
			// Check for Account ID (64 character hex string)
			if (address.length === 64 && isValidHex(address)) {
				return AccountIdentifier.fromHex(address);
			}
		} catch (error) {
			console.error(error);
		}
		return null;
	}

	function isValidHex(str: string): boolean {
		const hexRegex = /^[0-9a-fA-F]+$/;
		return hexRegex.test(str);
	}

	$effect(() => {
		recipient = recipient.trim();

		// Perform validation once and store results
		const icrcAccount = validateICRC1Account(recipient);
		const accountId =
			ledgerId === ICP_LEDGER_CANISTER_ID ? validateAccountIdentifier(recipient) : null;

		// Set validation message based on results
		if (icrcAccount) {
			recipientError = ''; // Valid address, clear error
			to = icrcAccount;
			if (icrcAccount.subaccount) {
				validAddressMessage = 'Valid ICRC-1 Account';
			} else {
				validAddressMessage = 'Valid Principal ID';
			}
		} else if (accountId) {
			recipientError = ''; // Valid address, clear error
			to = accountId;
			validAddressMessage = 'Valid Account ID';
		} else {
			validAddressMessage = '';

			// Set appropriate error message
			if (!recipient) {
				recipientError = 'Recipient is required';
			} else {
				recipientError = 'Invalid Address';
			}
		}
	});

	async function handleSubmit() {
		isLoading = true;
		await transferToken(Number(amount), to, ledgerId);
		isLoading = false;
	}
</script>

<button type="button" class={className} onclick={() => (formModal = true)}
	><Send size={iconSize} />{@render children?.()}</button
>

<Modal bind:open={formModal} size="sm" autoclose={false} class="w-full" outsideclose>
	<form onsubmit={preventDefault(handleSubmit)} class="flex flex-col space-y-6" action="#">
		<h3 class="text-xl font-medium text-gray-900 dark:text-white">
			Send {metadata?.name ?? 'Token'}
		</h3>

		{#if metadata}
			<div class="flex gap-3 p-2 rounded-lg border border-gray-300 bg-gray-100">
				{#if metadata?.logo}
					<img src={metadata.logo} alt={metadata.name} class="size-11 rounded-full" />
				{:else}
					<div class="size-11 rounded-full bg-gray-200"></div>
				{/if}
				<div>
					<p class="text-base font-medium text-gray-900">{metadata?.name}</p>

					<p class="text-sm text-gray-500">Balance: {balance?.number ?? '0'} {metadata?.symbol}</p>
				</div>
			</div>
		{/if}
		<Label class="space-y-2" for="recipient">
			<span class="flex"
				>Recipient Address <button type="button" id="address-help"
					><CircleHelp size={18} class="ml-1" /></button
				>
				<Tooltip type="custom" triggeredBy="#address-help" trigger="hover"
					>You can input a Principal ID {ledgerId === ICP_LEDGER_CANISTER_ID
						? 'or an Account ID '
						: ''}or an Encoded ICRC-1 Account.</Tooltip
				></span
			>

			<Input
				type="text"
				name="recipient"
				bind:value={recipient}
				placeholder="Enter Recipient Address"
				color={recipientError && recipientTouched ? 'red' : 'base'}
				oninput={() => {
					recipientTouched = true;
				}}
			/>
			{#if recipientTouched}
				<Helper class="mt-2" color="red">
					{recipientError}
				</Helper>
			{/if}
			{#if validAddressMessage}
				<Helper class="mt-2" color="green"
					><div class="flex items-center">
						<CheckCheck size={16} class="mr-2" />{validAddressMessage}
					</div></Helper
				>
			{/if}
		</Label>
		<Label
			for="send-amount"
			class="space-y-2"
			color={amountError && amountTouched ? 'red' : 'gray'}
		>
			<div class="flex justify-between">
				<span>Amount</span>
				<Button
					type="button"
					class="px-4 py-0 rounded-lg"
					color="alternative"
					size="xs"
					onclick={max}>Max</Button
				>
			</div>
			<Input
				type="text"
				id="send-amount"
				placeholder="Enter Amount"
				bind:value={amount}
				oninput={() => {
					amountTouched = true;
				}}
				color={amountError && amountTouched ? 'red' : 'base'}
			/>
			{#if amountTouched}
				<Helper class="mt-2" color="red">
					{amountError}
				</Helper>
			{/if}
		</Label>
		<div class="flex justify-between text-sm">
			<p>Fee:</p>
			<p>{formatNumber(fee, ledgerId)} {metadata?.symbol}</p>
		</div>
		<Button type="submit" class="w-full" {disabled}
			><SendHorizontal /> <span class="ml-2">Send {metadata?.symbol ?? 'Token'}</span></Button
		>
	</form>
</Modal>
