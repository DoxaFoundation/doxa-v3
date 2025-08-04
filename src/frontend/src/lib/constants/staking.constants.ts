import type { Account } from '@dfinity/ledger-icrc/dist/candid/icrc_ledger';
import { STAKING_CANISTER_ID } from './app.constants';
import { Principal } from '@dfinity/principal';

// 10 DUSD
export const MINIMUM_STAKE_AMOUNT = 10;
export const MINMUM_STAKE_DURATION_IN_DAYS = 90;
export const MAXIMUM_STAKE_DURATION_IN_DAYS = 365;

export const STAKING_ACCOUNT: Account = {
	owner: Principal.fromText(STAKING_CANISTER_ID),
	subaccount: []
};
