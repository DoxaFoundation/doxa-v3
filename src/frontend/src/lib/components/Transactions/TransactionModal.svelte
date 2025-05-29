<script lang="ts">
	import type { TransformedICPTransaction, TransformedTransaction } from '$lib/types/transactions';
	import { LedgerMetadata } from '@states/ledger-metadata.svelte';
	import { formatRawNumber } from '@utils/fromat.utils';
	import { getFee } from '@utils/icrc-ledger.utils';
	import { Modal } from 'flowbite-svelte';
	import TransactionKeyValuePair from './TransactionKeyValuePair.svelte';
	import TransferTypeBadge from './TransferTypeBadge.svelte';
	import { ICP_LEDGER_CANISTER_ID } from '@constants/app.constants';

	type Props = {
		open?: boolean;
		transaction?: TransformedTransaction | TransformedICPTransaction;
	};
	let { transaction, open = $bindable(false) }: Props = $props();

	/// text size key 12px above xl: 14px
	/// text size value 16 px above xl: 18px
	// logo 24x24 above xl: 28x28

	/* key box 
    above sm 199x73
    above xl 220x73
    
    
    */

	let symbol: string = $derived(LedgerMetadata[transaction?.ledgerId ?? '']?.symbol);

	let fromTip: string = $derived.by(() => {
		if (transaction?.type !== 'Approve') {
			return `The account that ${symbol} tokens were transferred from.
            
            Mint transactions are transfers from the Minting Account.`;
		} else {
			return `The account whose owner has authorized the "Spender Account" to transfer a designated amount of ${symbol} tokens from the account on their behalf.`;
		}
	});
	let fromValue: string = $derived(
		transaction?.type === 'Mint'
			? 'Minting Account'
			: transaction?.from?.encodedAccount +
					(transaction?.from?.name ? ` | ${transaction?.from?.name}` : '')
	);

	let toValue: string = $derived(
		transaction?.type === 'Burn'
			? 'Minting Account'
			: transaction?.to?.encodedAccount +
					(transaction?.to?.name ? ` | ${transaction?.to?.name}` : '')
	);

	let amountTip: string = $derived.by(() => {
		if (transaction?.type === 'Send') {
			return `The amount of ${symbol} tokens sent.`;
		} else if (transaction?.type === 'Receive') {
			return `The amount of ${symbol} tokens received.`;
		} else if (transaction?.type === 'Approve') {
			return `The designated amount of ${symbol} tokens that the "Spender Account" is authorized to transfer on behalf of the "From" account.`;
		} else if (transaction?.type === 'Mint') {
			return `The amount of ${symbol} tokens minted.`;
		} else if (
			transaction?.type === 'Swap' ||
			transaction?.type === 'Stake' ||
			transaction?.type === 'Transfer'
		) {
			return `The amount of ${symbol} tokens transferred.`;
		} else if (transaction?.type === 'Burn') {
			return `The amount of ${symbol} tokens burned.`;
		}

		return '';
	});

	let fee: string = $derived.by(() => {
		if (transaction?.type === 'Mint' || transaction?.type === 'Burn') {
			return '0';
		} else {
			return formatRawNumber(getFee(transaction?.ledgerId ?? ''));
		}
	});

	let memoTip: string = $derived.by(() => {
		if (transaction?.ledgerId === ICP_LEDGER_CANISTER_ID) {
			return 'An arbitrary number associated with the ICP transaction.';
		} else {
			return `Arbitrary binary data associated with the ${symbol} transaction.`;
		}
	});
</script>

{#if transaction}
	<Modal
		size="xl"
		bind:open
		autoclose
		outsideclose
		title="{symbol} Transaction"
		class="divide-y-0 overflow-y-scroll sm:overflow-y-auto"
		classHeader="text-gray-900  dark:text-white dark:placeholder-gray-400 bg-gray-100 dark:bg-gray-900"
		bodyClass="px-4 pb-4 md:px-5 md:pb-5 space-y-4 overflow-y-scroll sm:overflow-y-auto"
		defaultClass="relative flex flex-col mx-auto bg-gray-100 dark:bg-gray-900"
	>
		<div
			class="border-2 border-gray-300 dark:border-gray-700 rounded-xl bg-gray-200 dark:bg-gray-800"
		>
			<TransactionKeyValuePair
				border_top={false}
				key="Type"
				tip="A transfer transaction transfers {symbol} tokens between accounts."
			>
				{#snippet valueElement()}
					<TransferTypeBadge type={transaction?.type} />
				{/snippet}
			</TransactionKeyValuePair>

			<TransactionKeyValuePair
				key="Index"
				tip="The index of the transaction in the {symbol} ledger."
				value={transaction?.block_id}
			/>

			<TransactionKeyValuePair
				key="At"
				tip="The date the {symbol} ledger constructed the block containing the transaction."
				value={transaction?.at?.local_date_time}
			/>

			<TransactionKeyValuePair key="From" tip={fromTip} value={fromValue} />
			{#if transaction?.type !== 'Approve'}
				<TransactionKeyValuePair
					key="To"
					tip="The account that {symbol} tokens were transferred to.
                
                Burn transactions are transfers to the Minting Account."
					value={toValue}
				/>
			{/if}

			<TransactionKeyValuePair key="Amount" tip={amountTip}>
				{#snippet valueElement()}
					<div class="flex items-center gap-2 text-base xl:text-lg text-gray-900 dark:text-white">
						<img
							src={LedgerMetadata[transaction?.ledgerId]?.logo}
							alt="{LedgerMetadata[transaction?.ledgerId]?.name} Icon"
							class="drop-shadow-md w-6 xl:w-7"
						/>
						<span>{formatRawNumber(transaction?.amount)}</span>
						<span>{symbol}</span>
					</div>
				{/snippet}
			</TransactionKeyValuePair>

			<TransactionKeyValuePair
				key="Fee"
				tip="The {symbol} transaction fee. Mint and burn transactions have no fee."
			>
				{#snippet valueElement()}
					<div class="flex items-center gap-2 text-base xl:text-lg text-gray-900 dark:text-white">
						<img
							src={LedgerMetadata[transaction?.ledgerId]?.logo}
							alt="{LedgerMetadata[transaction?.ledgerId]?.name} Icon"
							class="drop-shadow-md w-6 xl:w-7"
						/>
						<span>{fee}</span>
						<span>{symbol}</span>
					</div>
				{/snippet}
			</TransactionKeyValuePair>

			{#if transaction?.spender}
				<TransactionKeyValuePair
					key="Spender Account"
					tip={`The account that has been authorized to transfer a designated amount of ${
						symbol
					} tokens on behalf of the "From" account.`}
					value={transaction?.spender?.encodedAccount +
						(transaction?.spender?.name ? ` | ${transaction?.spender?.name}` : '')}
				/>
			{/if}

			{#if transaction?.type === 'Approve'}
				<TransactionKeyValuePair
					key="Expected Allowance"
					tip={`If set, this field specifies the ${symbol} token amount that must match the current allowance already set for the "Spender Account" from the "From" account. Meeting this condition is necessary for the "approve" transaction to be successful.`}
					value={transaction?.expected_allowance ?? '-'}
				/>

				<TransactionKeyValuePair
					key="Expires At"
					tip={`The date when the authorization for the "Spender Account" to transfer ${symbol} tokens expires.`}
					value={transaction?.expires_at?.local_date_time}
				/>
			{/if}

			<TransactionKeyValuePair key="Memo" tip={memoTip} value={transaction?.memo ?? '-'} />
			{#if transaction?.ledgerId === ICP_LEDGER_CANISTER_ID}
				<TransactionKeyValuePair
					key="ICRC-1 Memo"
					tip="The ICRC-1 memo, arbitrary binary data associated with the ICP transaction?."
					value={'icrc1_memo' in transaction ? (transaction?.icrc1_memo ?? '-') : '-'}
				/>
			{/if}
		</div>
	</Modal>
{/if}
