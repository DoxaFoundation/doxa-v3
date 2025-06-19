import { getRootCanister } from '$lib/actors/actor.root-canister';
import type { RootActor } from '$lib/types/actors';
import type { EmailPermission, Result } from '@declarations/root_canister/root_canister.did';
import { isNullish } from '@dfinity/utils';
import { authStore } from '@stores/auth.store';
import { get } from 'svelte/store';

let canister: Record<string, RootActor> | undefined = {};

export const getEmailPermission = async (): Promise<[] | [EmailPermission]> => {
	const { get_email_permission } = await rootCanister();

	return get_email_permission();
};

export const insertEmail = async (email?: string): Promise<Result> => {
	const { insert_email } = await rootCanister();

	return insert_email(email ? [email] : []);
};

export const getRiskWarningAgreement = async (): Promise<[] | [boolean]> => {
	const { get_risk_warning_agreement } = await rootCanister();

	return get_risk_warning_agreement();
};

export const acceptRiskWarning = async (): Promise<Result> => {
	const { accept_risk_warning } = await rootCanister();

	return accept_risk_warning();
};

const rootCanister = async (): Promise<RootActor> => {
	const { principal } = get(authStore);
	const cacheKey = principal.toString();

	if (isNullish(canister) || isNullish(canister[cacheKey])) {
		const rootCan = await getRootCanister();

		canister = {
			...(canister ?? {}),
			[cacheKey]: rootCan
		};

		return rootCan;
	}

	return canister[cacheKey];
};
