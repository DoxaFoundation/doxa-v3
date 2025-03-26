import { goto } from '$app/navigation';
import { getActors } from '$lib/actors/actors.ic';
import type { AuthStoreData } from '$lib/stores/auth.store';
import { AuthClient } from '@dfinity/auth-client';
import { connectAnonymously } from './anonymous.connection';
import { FRONTEND_CANISTER_ID, LOCAL, PROD } from '@constants/app.constants';

let authClient: AuthClient | null | undefined;

export const syncAuthClient = async (set: (this: void, value: AuthStoreData) => void) => {
	authClient = authClient ?? (await AuthClient.create());
	const isAuthenticated: boolean = await authClient.isAuthenticated();

	if (isAuthenticated) {
		const signIdentity = authClient.getIdentity();
		const authenticatedActor = await getActors(signIdentity);

		set({
			isAuthenticated,
			identity: signIdentity,
			identityProvider: 'ii',
			principal: signIdentity.getPrincipal(),
			...authenticatedActor
		});
	}

	return { success: isAuthenticated };
};

export const authClientLogin = async (set: (this: void, value: AuthStoreData) => void) =>
	new Promise<void>(async (resolve, reject) => {
		authClient = authClient ?? (await AuthClient.create());

		const identityProvider = LOCAL
			? 'http://rdmx6-jaaaa-aaaaa-aaadq-cai.localhost:8080'
			: 'https://identity.internetcomputer.org/';

		// if (get(authStore).identityProvider === 'plug') {
		// 	await plug?.disconnect();
		// }
		await authClient.login({
			identityProvider,
			derivationOrigin: PROD ? `https://${FRONTEND_CANISTER_ID}.icp0.io` : `http://localhost:5173`,
			maxTimeToLive: BigInt(7) * BigInt(24) * BigInt(3_600_000_000_000), // 1 week
			onSuccess: async () => {
				await syncAuthClient(set);
				goto('/');
				resolve();
			},
			onError: async (error) => {
				await connectAnonymously(set);
				reject(error);
			}
		});
	});

export const authClientLogout = async () => {
	const client: AuthClient = authClient ?? (await AuthClient.create());

	await client.logout();

	// This fix a "sign in -> sign out -> sign in again" flow without window reload.
	authClient = null;
};
