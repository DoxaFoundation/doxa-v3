import type { ActorSubclass } from '@dfinity/agent';

import type { _SERVICE as MINTER_SERVICE } from '@declarations/stablecoin_minter/stablecoin_minter.did';
import type { _SERVICE as ICRC_LEDGER_SERVICE } from '@dfinity/ledger-icrc/dist/candid/icrc_ledger';
import type { _SERVICE as STAKING_SERVICE } from '@declarations/staking_canister/staking_canister.did';
import type { _SERVICE as SWAP_FACTORY_SERVICE } from '@declarations/SwapFactory/SwapFactory.did';
import type { _SERVICE as SWAP_POOL_SERVICE } from '@declarations/SwapPool/SwapPool.did';
import type { _SERVICE as ICP_LEDGER_SERVICE } from '@declarations/icp_ledger/icp_ledger.did.d.ts';
import type { _SERVICE as UTILITY_SERVICE } from '@declarations/utility_canister/utility_canister.did';

export { idlFactory as stablecoinMinterIdlFactory } from '@declarations/stablecoin_minter/stablecoin_minter.did.js';
export { idlFactory as icrcLedgerIdlFactory } from '@dfinity/ledger-icrc/dist/candid/icrc_ledger.idl';
export { idlFactory as stakingCanisterIdlFactory } from '@declarations/staking_canister';
export { idlFactory as swapFactoryIdlFactory } from '@declarations/SwapFactory/SwapFactory.did';
export { idlFactory as swapPoolIdlFactory } from '@declarations/SwapPool/SwapPool.did';
export { idlFactory as icpLedgerIdlFactory } from '@declarations/icp_ledger/icp_ledger.did.js';
export { idlFactory as utilityIdlFactory } from '@declarations/utility_canister/utility_canister.did.js';

export type StablecoinMinterActor = ActorSubclass<MINTER_SERVICE>;

export type IcrcLedgerActor = ActorSubclass<ICRC_LEDGER_SERVICE>;

export type IcpLedgerActor = ActorSubclass<ICP_LEDGER_SERVICE>;

export type StakingActor = ActorSubclass<STAKING_SERVICE>;

export type Actors = {
	stablecoinMinter: StablecoinMinterActor;
	ckUSDC: IcrcLedgerActor;
	USDx: IcrcLedgerActor;
	staking: StakingActor;
};

export type SwapFactoryActor = ActorSubclass<SWAP_FACTORY_SERVICE>;

export type SwapPoolActor = ActorSubclass<SWAP_POOL_SERVICE>;

export type UtilityActor = ActorSubclass<UTILITY_SERVICE>;
