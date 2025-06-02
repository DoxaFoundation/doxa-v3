import type { TransferParams as IcrcTransferParams } from '@dfinity/ledger-icrc';

export interface TransferParams extends IcrcTransferParams {
	token: 'DUSD' | 'ckUSDC';
}

export type Token = 'DUSD' | 'ckUSDC';
