import { transferICP } from '$lib/api/icp.ledger.api';
import { transfer } from '$lib/api/icrc.ledger.api';
import type { ResultSuccess } from '$lib/types/utils';
import type { TransferResult as IcpTransferResult } from '@declarations/icp_ledger/icp_ledger.did';
import type { AccountIdentifier } from '@dfinity/ledger-icp';
import type { IcrcAccount } from '@dfinity/ledger-icrc';
import type { TransferResult as IcrcTransferResult } from '@dfinity/ledger-icrc/dist/candid/icrc_ledger';
import { updateBalance } from '@states/ledger-balance.svelte';
import { LedgerMetadata } from '@states/ledger-metadata.svelte';
import { toBigIntDecimals } from '@utils/decimals.utils';
import { toast } from 'svelte-sonner';

export const handleTransferResponse = async (
	response: IcrcTransferResult | IcpTransferResult,
	amount: number,
	symbol: string,
	ledgerId: string,
	toastId?: string | number
): Promise<ResultSuccess> => {
	if ('Ok' in response) {
		toast.success(`${amount} ${symbol} sent successfully.`, {
			id: toastId
		});

		await updateBalance(ledgerId);
		return { success: true };
	} else {
		console.error(`Failed to send ${amount} ${symbol}.`, response);
		toast.error(`Failed to send ${amount} ${symbol}.`, {
			id: toastId
		});
		return { success: false, err: response };
	}
};

export const transferToken = async (
	amount: number,
	to: IcrcAccount | AccountIdentifier,
	ledgerId: string
): Promise<ResultSuccess> => {
	let currentToastId: string | number | undefined = undefined;
	try {
		const { fee, symbol } = LedgerMetadata[ledgerId];
		currentToastId = toast.loading(`Sending ${amount} ${symbol}...`);

		if ('owner' in to) {
			const response = await transfer({
				canisterId: ledgerId,
				to: {
					owner: to.owner,
					subaccount: to.subaccount ? [to.subaccount] : []
				},
				amount: toBigIntDecimals(amount, ledgerId)
			});

			return await handleTransferResponse(response, amount, symbol, ledgerId, currentToastId);
		} else {
			const response = await transferICP({
				to: to.toUint8Array(),
				memo: BigInt(0),
				created_at_time: [],
				fee: { e8s: BigInt(fee) },
				from_subaccount: [],
				amount: { e8s: toBigIntDecimals(amount, ledgerId) }
			});
			return await handleTransferResponse(response, amount, symbol, ledgerId, currentToastId);
		}
	} catch (error) {
		console.error(error);
		toast.error('Something went wrong while transferring token.', {
			id: currentToastId
		});
		return { success: false, err: error };
	}
};
