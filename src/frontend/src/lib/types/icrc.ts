import type { TransferParams as IcrcTransferParams } from '@dfinity/ledger-icrc';

export interface TransferParams extends IcrcTransferParams {
	token: 'USDx' | 'ckUSDC';
}

export type Token = 'USDx' | 'ckUSDC';
