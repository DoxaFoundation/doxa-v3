import type {
	Error as SwapFactoryError,
	PoolData
} from '@declarations/SwapFactory/SwapFactory.did';
import type {
	PoolMetadata,
	Error as SwapPoolError,
	Value
} from '@declarations/SwapPool/SwapPool.did';
import type { MetadataValue, Subaccount } from '@dfinity/ledger-icrc/dist/candid/icrc_ledger';
import type { Principal } from '@dfinity/principal';

export type CanisterApiFunctionParams<T = unknown> = T & {
	canisterId: string;
};

export declare enum IcrcMetadataResponseEntries {
	SYMBOL = 'icrc1:symbol',
	NAME = 'icrc1:name',
	DECIMALS = 'icrc1:decimals',
	FEE = 'icrc1:fee',
	LOGO = 'icrc1:logo'
}

export type IcrcTokenMetadataResponse = [string | IcrcMetadataResponseEntries, MetadataValue][];

export interface IcrcAccount {
	owner: Principal;
	subaccount?: Subaccount;
}

export type GetPoolResponse = { ok: PoolData } | { err: SwapFactoryError };

export type GetPoolsResponse = { ok: PoolData[] } | { err: SwapFactoryError };

export type SwapPoolResponse = { ok: bigint } | { err: SwapPoolError };

export type GetUserUnusedBalanceResponse =
	| { ok: { balance0: bigint; balance1: bigint } }
	| { err: SwapPoolError };

export interface TokenMetadata {
	token0: Array<[string, Value]>;
	token1: Array<[string, Value]>;
	token0Fee: [] | [bigint];
	token1Fee: [] | [bigint];
}

export type MetadataResponse = { ok: PoolMetadata } | { err: SwapPoolError };
