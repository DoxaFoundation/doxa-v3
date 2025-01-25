import type { TransferParams } from '$lib/types/icrc';
import { IcrcTransferError, toTransferArg } from '@dfinity/ledger-icrc';
import type { BlockIndex } from '@dfinity/ledger-icrc/dist/candid/icrc_ledger';
import { authStore } from '@stores/auth.store';
import { toast } from 'svelte-sonner';
import { get } from 'svelte/store';

let id: string | undefined | number;
export const transfer = async ({ token, ...args }: TransferParams): Promise<BlockIndex> => {
	const { icrc1_transfer } = get(authStore)[token];

	let transferArgs = toTransferArg(args);

	const response = await icrc1_transfer(transferArgs);

	if ('Err' in response) {
		throw new IcrcTransferError({
			errorType: response.Err,
			msg: 'Failed to transfer'
		});
	}
	return response.Ok;
};
