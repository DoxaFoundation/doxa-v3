import { writable, type Readable, get } from 'svelte/store';
import { type Principal } from '@dfinity/principal';
import type { IcrcLedgerActor, StablecoinMinterActor, StakingActor } from '$lib/types/actors';
import {
	authClientLogin,
	authClientLogout,
	syncAuthClient
} from '$lib/connection/authclient.connection';
import { connectPlug, disconnectPlug, syncPlugConnection } from '$lib/connection/plug.connection';
import { connectAnonymously } from '$lib/connection/anonymous.connection';
import { nfidLogin, nfidLogout } from '$lib/connection/nfid.connection';
import type { IdentityProvider } from '$lib/types/auth';
import type { OptionIdentity } from '$lib/types/identity';

export interface AuthStoreData {
	isAuthenticated: boolean;
	identity: OptionIdentity;
	stablecoinMinter: StablecoinMinterActor;
	ckUSDC: IcrcLedgerActor;
	DUSD: IcrcLedgerActor;
	identityProvider: IdentityProvider;
	principal: Principal;
	staking: StakingActor;
}

export interface AuthSignInParams {
	// domain?: 'ic0.app' | 'internetcomputer.org';
	identityProvider?: IdentityProvider;
}

export interface AuthStore extends Readable<AuthStoreData> {
	sync: () => Promise<void>;
	signIn: (authSignInParams: AuthSignInParams) => Promise<void>;
	signOut: () => Promise<void>;
}

const init = (): AuthStore => {
	const { subscribe, set } = writable<AuthStoreData>();

	return {
		subscribe,
		sync: async () => {
			const authClientResult = await syncAuthClient(set);
			if (authClientResult.success) return;

			const plugResult = await syncPlugConnection(set);
			if (plugResult.success) return;

			await connectAnonymously(set);
		},
		signIn: async ({ identityProvider }) => {
			const provider = identityProvider ?? 'ii';

			if (provider === 'ii') {
				await authClientLogin(set);
			} else if (provider === 'nfid') {
				await nfidLogin(set);
			} else if (provider === 'plug') {
				await connectPlug(set);
			}
		},
		signOut: async () => {
			const { identityProvider } = get(authStore);

			if (identityProvider === 'ii') {
				await authClientLogout();
			} else if (identityProvider === 'plug') {
				await disconnectPlug();
			} else if (identityProvider === 'nfid') {
				nfidLogout();
			}

			await connectAnonymously(set);
		}
	};
};

export const authStore: AuthStore = init();
