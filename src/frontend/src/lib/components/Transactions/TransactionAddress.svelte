<script lang="ts">
	import type { TransformedICPTransaction, TransformedTransaction } from '$lib/types/transactions';
	import { ICP_LEDGER_CANISTER_ID } from '@constants/app.constants';
	import { AccountIdentifier } from '@dfinity/ledger-icp';
	import { authStore } from '@stores/auth.store';
	type Props = {
		tx: TransformedTransaction | TransformedICPTransaction;
	};

	let { tx }: Props = $props();
</script>

{#if tx.type === 'Receive'}
	<p class="text-wrap break-all text-sm">
		<span>From: </span>
		<span>{tx.from?.name ?? tx.from?.encodedAccount}</span>
	</p>
{:else if tx.type === 'Send'}
	<p class="text-wrap break-all text-sm">
		<span>To: </span>
		<span>{tx.to?.name ?? tx.to?.encodedAccount}</span>
	</p>
{:else if tx.type === 'Approve'}
	<p class="text-wrap break-all text-sm">
		<span>Spender: </span>
		<span>{tx.spender?.name ?? tx.spender?.encodedAccount}</span>
	</p>
{:else if tx.type === 'Mint'}
	<p class="text-wrap break-all text-sm">
		<span>From: </span>
		<span>Minting Account</span>
	</p>
{:else if tx.type === 'Swap'}
	<p class="text-wrap break-all text-sm">
		<span>Swap Pool: </span>
		{#if tx.ledgerId === ICP_LEDGER_CANISTER_ID}
			{#if tx.from?.encodedAccount === AccountIdentifier.fromPrincipal( { principal: $authStore.principal } ).toHex()}
				<span>{tx.to?.name ?? tx.to?.encodedAccount}</span>
			{:else}
				<span>{tx.from?.name ?? tx.from?.encodedAccount}</span>
			{/if}
		{:else if tx.from?.encodedAccount === $authStore.principal.toString()}
			<span>{tx.to?.name ?? tx.to?.encodedAccount}</span>
		{:else}
			<span>{tx.from?.name ?? tx.from?.encodedAccount}</span>
		{/if}
	</p>
{:else if tx.type === 'Stake'}
	<p class="text-wrap break-all text-sm">
		<span>To: </span>
		<span>Staking Account</span>
	</p>
{:else if tx.type === 'Burn'}
	<p class="text-wrap break-all text-sm">
		<span>To: </span>
		<span>Minting Account</span>
	</p>
{:else if tx.type === 'Transfer'}
	<p class="text-wrap break-all text-sm">
		<span>To: </span>
		<span>{tx.to?.name ?? tx.to?.encodedAccount}</span>
	</p>
{/if}
