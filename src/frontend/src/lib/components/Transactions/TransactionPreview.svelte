<script lang="ts">
	import type { TransformedICPTransaction, TransformedTransaction } from '$lib/types/transactions';
	import { LedgerMetadata } from '@states/ledger-metadata.svelte';
	import TransactionAddress from './TransactionAddress.svelte';
	import TransactionAmount from './TransactionAmount.svelte';
	import TransactionTypeIcon from './TransactionTypeIcon.svelte';
	import TransactionTypeTitle from './TransactionTypeTitle.svelte';

	type Props = {
		transaction: TransformedTransaction | TransformedICPTransaction;
	};

	let { transaction }: Props = $props();
</script>

<div
	class="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 w-full box-border h-[118px] sm:h-[92px] flex items-center"
>
	<div class="flex gap-2 py-1 items-center w-full">
		<TransactionTypeIcon type={transaction.type} />
		<!-- <img
			src={LedgerMetadata[transaction.ledgerId]?.logo}
			alt="{LedgerMetadata[transaction.ledgerId]?.name} Icon"
			class="drop-shadow-md w-4 sm:w-6 md:w-8"
		/> -->

		<div class="flex flex-col w-full">
			<div class="flex gap-2 justify-between">
				<div class="flex gap-1 items-center">
					<TransactionTypeTitle type={transaction.type} />
					<!-- <TransactionTypeIcon
						type={transaction.type}
					/> -->

					<img
						src={LedgerMetadata[transaction.ledgerId]?.logo}
						alt="{LedgerMetadata[transaction.ledgerId]?.name} Icon"
						class="drop-shadow-md w-6"
					/>
				</div>

				<TransactionAmount
					type={transaction.type}
					amount={transaction.amount}
					ledgerId={transaction.ledgerId}
					to={transaction.to}
					from={transaction.from}
				/>
				<!-- <TransactionAddress tx={transaction} /> -->
			</div>

			<div class="sm:flex gap-3 sm:justify-between text-left">
				<TransactionAddress tx={transaction} />
				<p class="text-sm text-nowrap mt-1.5 sm:mt-0">{transaction?.at?.local_date_time}</p>
			</div>
		</div>
	</div>
</div>
