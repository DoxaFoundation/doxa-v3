<script lang="ts">
	import type { AliasAccount, TransactionType } from '$lib/types/transactions';
	import { ICP_LEDGER_CANISTER_ID } from '@constants/app.constants';
	import { AccountIdentifier } from '@dfinity/ledger-icp';
	import { LedgerMetadata } from '@states/ledger-metadata.svelte';
	import { authStore } from '@stores/auth.store';

	type Props = {
		type: TransactionType;
		amount: number;
		ledgerId: string;
		to?: AliasAccount | undefined;
		from?: AliasAccount | undefined;
	};

	let { type, amount, ledgerId, to, from }: Props = $props();

	let sign: '+' | '-' | '' = $derived.by(() => {
		if (type === 'Receive' || type === 'Mint') {
			return '+';
		} else if (type === 'Send' || type === 'Stake' || type === 'Burn') {
			return '-';
		} else if (type === 'Swap') {
			if (ledgerId === ICP_LEDGER_CANISTER_ID) {
				if (
					from?.encodedAccount ===
					AccountIdentifier.fromPrincipal({ principal: $authStore.principal }).toHex()
				) {
					return '-';
				} else {
					return '+';
				}
			} else if (from?.encodedAccount === $authStore.principal.toString()) {
				return '-';
			} else {
				return '+';
			}
		} else {
			return '';
		}
	});
</script>

<div class="text-right" class:text-green-500={sign === '+'}>
	<span>{sign}</span>
	<span>{amount}</span>

	<span>{LedgerMetadata[ledgerId]?.symbol}</span>
</div>
