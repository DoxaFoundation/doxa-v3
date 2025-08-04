import { approve, transfer } from '$lib/api/icrc.ledger.api';
import type { ResultSuccess } from '$lib/types/utils';
import {
	CKUSDC_LEDGER_CANISTER_ID,
	DUSD_LEDGER_CANISTER_ID,
	RESERVE_ACCOUNT
} from '@constants/app.constants';
import type { BlockIndex } from '@dfinity/ledger-icrc/dist/candid/icrc_ledger';
import { toast } from 'svelte-sonner';
import { authStore } from '@stores/auth.store';
import { get } from 'svelte/store';
import { getFee, getFeeWithDecimals } from '@utils/icrc-ledger.utils';
import { toBigIntDecimals } from '@utils/decimals.utils';
import { getPoolData, getSwapArgs } from '@utils/swap.utils';
import { updateBalance } from '@states/ledger-balance.svelte';
import { depositFromAndSwap } from '$lib/api/swap.pool.api';
import { LedgerMetadata } from '@states/ledger-metadata.svelte';

let toastId: string | number;

const mintDusdUsingCkUSDC = async (amount: bigint): Promise<ResultSuccess> => {
	const ckusdcBlockIndex = await transferCkusdcToReserve(amount);
	if (!ckusdcBlockIndex) {
		return { success: false, err: 'Failed to send ckUSDC to DUSD Reserve' };
	}

	const notifyResult = await notifyStablecoinMinter(ckusdcBlockIndex);

	return notifyResult;
};

const transferCkusdcToReserve = async (amount: bigint): Promise<BlockIndex | null> => {
	try {
		toastId = toast.loading('Sending ckUSDC to DUSD Reserve', {
			duration: 10000, // 10 seconds
			id: toastId
		});
		const transferResult = await transfer({
			canisterId: CKUSDC_LEDGER_CANISTER_ID,
			to: RESERVE_ACCOUNT,
			amount
		});

		updateBalance(CKUSDC_LEDGER_CANISTER_ID);

		if ('Ok' in transferResult) {
			toast.success('ckUSDC sent to DUSD Reserve', {
				id: toastId,
				duration: 5000
			});
			return transferResult.Ok;
		} else {
			console.error('Failed to send ckUSDC to DUSD Reserve', transferResult.Err);
			toast.error('Failed to send ckUSDC to DUSD Reserve', {
				id: toastId,
				duration: 8000
			});
			return null;
		}
	} catch (error) {
		console.error('Failed to send ckUSDC to DUSD Reserve', error);
		toast.error('Failed to send ckUSDC to DUSD Reserve ' + error, {
			id: toastId,
			duration: 8000
		});
		return null;
	}
};

const notifyStablecoinMinter = async (ckusdc_block_index: BlockIndex): Promise<ResultSuccess> => {
	try {
		const { notify_mint_with_ckusdc } = get(authStore).stablecoinMinter;

		toastId = toast.loading('Notifying stablecoin minter', {
			duration: 10000, // 10 seconds,
			id: toastId
		});

		const notifyResult = await notify_mint_with_ckusdc({
			minting_token: { DUSD: null },
			ckusdc_block_index
		});

		if ('ok' in notifyResult) {
			updateBalance(DUSD_LEDGER_CANISTER_ID);
			toast.success('DUSD minted successfully!', {
				id: toastId,
				duration: 8000
			});
			return { success: true };
		} else {
			console.error('Failed to notify stablecoin minter', notifyResult.err);
			toast.error('Failed to notify stablecoin minter', {
				id: toastId,
				duration: 8000
			});
			return { success: false, err: notifyResult.err };
		}
	} catch (error) {
		console.error('Failed to notify stablecoin minter', error);
		toast.error('Failed to notify stablecoin minter ' + error, {
			id: toastId,
			duration: 8000
		});
		return { success: false, err: error };
	}
};

const swapOtherTokenToCkusdc = async (
	ledgerId: string,
	amount: number,
	quoteAmount: string
): Promise<bigint | null> => {
	try {
		const from = ledgerId;
		const to = CKUSDC_LEDGER_CANISTER_ID;

		const pool = getPoolData(from, to);
		const swapPoolId = pool.canisterId;
		const fee = getFee(ledgerId);

		toastId = toast.loading(`Swapping ${LedgerMetadata[from]?.symbol ?? 'token'} to ckUSDC`, {
			duration: 20000 // 20 seconds for swap operations
		});

		const approveAmount = toBigIntDecimals(amount, ledgerId) + BigInt(getFeeWithDecimals(ledgerId));

		const approvalResponse = await approve({
			canisterId: ledgerId,
			spender: {
				owner: swapPoolId,
				subaccount: []
			},
			amount: approveAmount,
			expected_allowance: BigInt(0)
		});

		if ('Ok' in approvalResponse) {
			updateBalance(ledgerId);

			const swapArgs = getSwapArgs(from, to, amount, quoteAmount, 0.5);

			const swapResponse = await depositFromAndSwap({
				canisterId: swapPoolId.toString(),
				tokenInFee: BigInt(getFeeWithDecimals(from)),
				tokenOutFee: BigInt(getFeeWithDecimals(to)),
				...swapArgs
			});

			updateBalance(ledgerId);

			if ('ok' in swapResponse) {
				updateBalance(CKUSDC_LEDGER_CANISTER_ID);
				toast.success('Swapped token to ckUSDC', {
					id: toastId,
					duration: 5000
				});

				return swapResponse.ok;
			} else {
				console.error('Error swapping token:', swapResponse.err);
				toast.error('Failed to swap token', {
					id: toastId,
					duration: 8000
				});
				return null;
			}
		} else {
			console.error('Error approving swap pool: response error: ', approvalResponse.Err);
			toast.error('Failed to approve swap pool', {
				id: toastId,
				duration: 8000
			});
			return null;
		}
	} catch (error) {
		console.error('Something happened while minting DUSD: Failed to swap token:', error);
		toast.error('Something happened while minting DUSD', {
			id: toastId,
			duration: 8000
		});

		return null;
	}
};

export const mintDusd = async (
	ledgerId: string,
	amount: number,
	quoteAmount: string
): Promise<ResultSuccess> => {
	if (ledgerId === CKUSDC_LEDGER_CANISTER_ID) {
		return await mintDusdUsingCkUSDC(toBigIntDecimals(amount, CKUSDC_LEDGER_CANISTER_ID));
	} else {
		// in decimals

		const outputCkUsdcAmount = await swapOtherTokenToCkusdc(ledgerId, amount, quoteAmount);

		if (!outputCkUsdcAmount) {
			return { success: false, err: 'Failed to swap token to ckUSDC' };
		}

		const ckUsdcFee = BigInt(getFeeWithDecimals(CKUSDC_LEDGER_CANISTER_ID));
		const ckUsdcAmount = outputCkUsdcAmount - ckUsdcFee;

		return await mintDusdUsingCkUSDC(ckUsdcAmount);
	}
};
