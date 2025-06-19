import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export type EmailPermission = { 'Deny' : null } |
  { 'Allow' : string };
export type Result = { 'ok' : null } |
  { 'err' : string };
export interface _SERVICE {
  'accept_risk_warning' : ActorMethod<[], Result>,
  'get_email_permission' : ActorMethod<[], [] | [EmailPermission]>,
  'get_risk_warning_agreement' : ActorMethod<[], [] | [boolean]>,
  'insert_email' : ActorMethod<[[] | [string]], Result>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
