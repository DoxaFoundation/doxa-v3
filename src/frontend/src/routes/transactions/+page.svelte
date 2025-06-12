<script lang="ts">
	import type {
		TransformedICPTransaction,
		TransformedTransaction,
		TransformedTransactions
	} from '$lib/types/transactions';
	import TransactionModal from '@components/Transactions/TransactionModal.svelte';
	import TransactionPreview from '@components/Transactions/TransactionPreview.svelte';
	import { getAllSortedTransactions, transactionsState } from '@states/transactions.svelte';
	import { authStore } from '@stores/auth.store';

	let transactions: TransformedTransactions = $derived.by(() => {
		transactionsState;
		return getAllSortedTransactions();
	});
	let open: boolean = $state(false);

	let selectedTransaction = $state<TransformedTransaction | TransformedICPTransaction>();
</script>

<TransactionModal bind:open transaction={selectedTransaction} />
<div class="max-w-xl mx-auto space-y-2 rounded-lg px-1.5 md:px-0">
	<h1 class="text-xl text-black">Your Transactions</h1>
	<hr class="w-full border-b-[3px] border-stone-200 mt-4" />

	{#each transactions as transaction}
		<button
			class="hover:opacity-75 w-full"
			onclick={() => {
				selectedTransaction = transaction;
				open = true;
			}}
		>
			<TransactionPreview {transaction} />
		</button>
	{/each}

	{#if !$authStore.isAuthenticated}
		<p class="text-center text-gray-500 mt-10">please login to view transactions</p>
	{:else if transactions.length === 0}
		<p class="text-center text-gray-500 mt-10">You have no transactions</p>
	{/if}
</div>
