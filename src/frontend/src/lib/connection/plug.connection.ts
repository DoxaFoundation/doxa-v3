import { goto } from '$app/navigation';
import { getActorsFromPlug } from '$lib/actors/actors.plug';
import type { AuthStoreData } from '$lib/stores/auth.store';
import { HOST } from '@constants/app.constants';
import { connectAnonymously } from './anonymous.connection';
import type { ResultSuccess } from '$lib/types/utils';
import { getWhitelist } from '@utils/wallet.utils';

// @ts-ignore: next-line
const plug = window?.ic?.plug;

// This function check Plug wallet Connection If True Update Authstore (automaticaly login) used in authStore.sync
export const syncPlugConnection = async (
	set: (this: void, value: AuthStoreData) => void
): Promise<ResultSuccess> => {
	let isAuthenticated = await plug?.isConnected();
	if (isAuthenticated) {
		const authenticatedActor = await getActorsFromPlug();
		const principal = await plug.getPrincipal();

		set({
			isAuthenticated,
			// identity: publicKey,
			identityProvider: 'plug',
			principal,
			...authenticatedActor
		});
	}

	return { success: isAuthenticated };
};

const onConnectionUpdateHelper = async (set: (this: void, value: AuthStoreData) => void) => {
	let isAuthenticated = await plug?.isConnected();
	if (isAuthenticated) {
		const authenticatedActor = await getActorsFromPlug();
		const principal = await plug.getPrincipal();

		set({
			isAuthenticated,
			// identity: publicKey,

			identityProvider: 'plug',
			principal,
			...authenticatedActor
		});
	} else {
		await connectAnonymously(set);
	}
};

export const connectPlug = async (set: (this: void, value: AuthStoreData) => void) => {
	if (plug) {
		try {
			const whitelist = await getWhitelist();

			const onConnectionUpdate = () => onConnectionUpdateHelper(set);

			const publicKey = await plug.requestConnect({
				whitelist,
				host: HOST,
				onConnectionUpdate
			});
			await onConnectionUpdateHelper(set);
			goto('/');
		} catch (e) {
			console.error(e);
			await connectAnonymously(set);
		}
	} else {
		window.open('https://plugwallet.ooo/', '_blank');

		await connectAnonymously(set);
	}
};

export const disconnectPlug: () => Promise<void> = () => plug?.disconnect();
