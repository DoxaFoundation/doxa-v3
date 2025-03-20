import { getActors } from '$lib/actors/actors.ic';
import type { AuthStoreData } from '$lib/stores/auth.store';
import type { Actors } from '$lib/types/actors';
import type { Option } from '$lib/types/utils';
import { AnonymousIdentity } from '@dfinity/agent';
import type { Principal } from '@dfinity/principal';
import { isNullish } from '@dfinity/utils';

export const anonIdentity = new AnonymousIdentity();

export const anonPrincipal: Principal = anonIdentity.getPrincipal();

let anonActors: Option<Actors> = undefined;

export const getAnonymousActors = async (): Promise<Actors> => {
	if (isNullish(anonActors)) {
		anonActors = await getActors(anonIdentity);
		return anonActors;
	}

	return anonActors;
};

export const connectAnonymously = async (set: (this: void, value: AuthStoreData) => void) => {
	const anonActors = await getAnonymousActors();

	set({
		isAuthenticated: false,
		// identity: anonIdentity,
		identityProvider: 'anonymous',
		principal: anonPrincipal,
		...anonActors
	});
};
