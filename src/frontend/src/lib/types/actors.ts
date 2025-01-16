import type { ActorSubclass } from '@dfinity/agent';

import type { _SERVICE as MINTER_SERVICE } from '@declarations/stablecoin_minter/stablecoin_minter.did';
import type { _SERVICE as ICRC_LEDGER_SERVICE } from '@dfinity/ledger-icrc/dist/candid/icrc_ledger';
import type { _SERVICE as STAKING_SERVICE } from '@declarations/staking_canister/staking_canister.did';

export { idlFactory as stablecoinMinterIdlFactory } from '@declarations/stablecoin_minter/stablecoin_minter.did.js';
export { idlFactory as icrcLedgerIdlFactory } from '@dfinity/ledger-icrc/dist/candid/icrc_ledger.idl';
export { idlFactory as stakingCanisterIdlFactory } from '@declarations/staking_canister';

export type StablecoinMinterActor = ActorSubclass<MINTER_SERVICE>;

export type IcrcLedgerActor = ActorSubclass<ICRC_LEDGER_SERVICE>;

export type StakingActor = ActorSubclass<STAKING_SERVICE>;

export type Actors = {
	stablecoinMinter: StablecoinMinterActor;
	ckUsdc: IcrcLedgerActor;
	usdx: IcrcLedgerActor;
	staking: StakingActor;
};
