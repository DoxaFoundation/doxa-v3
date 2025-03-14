import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface _SERVICE {
  'get_all_token_prices' : ActorMethod<[], Array<[string, number]>>,
  'get_prices_from_ckusdc_pools_local' : ActorMethod<
    [],
    Array<[string, number]>
  >,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
