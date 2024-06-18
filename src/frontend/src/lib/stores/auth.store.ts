import { type Identity, type ActorSubclass, AnonymousIdentity } from '@dfinity/agent';
import type { _SERVICE } from '../../../../declarations/backend/backend.did';
import { writable, type Readable, get } from 'svelte/store';
import { AuthClient } from '@dfinity/auth-client';
import { getActor } from '../actor';
import { goto } from '$app/navigation';
import { type Principal } from '@dfinity/principal';

export interface AuthStoreData {
	isAuthenticated: boolean;
	// identity: Identity;
	actor: ActorSubclass<_SERVICE>;
	// stablecoinMinter: ActorSubclass<_SERVICE>;
	identityProvider: string;
	principal: Principal;
}

export interface AuthStore extends Readable<AuthStoreData> {
	sync: () => Promise<void>;
	signInWithII: () => Promise<void>;
	signOut: () => Promise<void>;
	signInWithPlug: () => Promise<void>;
}

let authClient: AuthClient | null | undefined;

const anonIdentity = new AnonymousIdentity();
const anonActor: ActorSubclass<_SERVICE> = await getActor(anonIdentity);
const anonPrincipal: Principal = anonIdentity.getPrincipal();

const init = async (): Promise<AuthStore> => {
	const { subscribe, set } = writable<AuthStoreData>({
		isAuthenticated: false,
		// identity: new AnonymousIdentity(),
		actor: anonActor,
		identityProvider: 'anonymous',
		principal: anonPrincipal
	});

	onConnectionUpdateHelper(set);

	return {
		subscribe,
		sync: async () => {
			authClient = authClient ?? (await AuthClient.create());
			const isAuthenticated: boolean = await authClient.isAuthenticated();

			if (isAuthenticated) {
				const signIdentity = authClient.getIdentity();
				const authActor = await getActor(signIdentity);
				console.log(signIdentity.getPrincipal().toText());
				return set({
					isAuthenticated,
					// identity: signIdentity,
					actor: authActor,
					identityProvider: 'ii',
					principal: signIdentity.getPrincipal()
				});
			}
			return set({
				isAuthenticated,
				// identity: anonIdentity,
				actor: anonActor,
				identityProvider: 'anonymous',
				principal: anonPrincipal
			});
		},
		signInWithII: async () =>
			new Promise<void>(async (resolve, reject) => {
				authClient = authClient ?? (await AuthClient.create());

				const identityProvider =
					import.meta.env.VITE_DFX_NETWORK === 'local'
						? 'http://rdmx6-jaaaa-aaaaa-aaadq-cai.localhost:8080'
						: 'https://identity.internetcomputer.org/';

				if (get(authStore).identityProvider === 'plug') {
					await plug?.disconnect();
				}
				await authClient.login({
					identityProvider,
					maxTimeToLive: BigInt(7) * BigInt(24) * BigInt(3_600_000_000_000), // 1 week
					onSuccess: async () => {
						await sync();
						goto('/');
						resolve();
					},
					onError: reject
				});
			}),
		signOut: async () => {
			if (get(authStore).identityProvider === 'ii') {
				const client = authClient ?? (await AuthClient.create());
				client.logout();

				// This fix a "sign in -> sign out -> sign in again" flow without window reload.
				authClient = null;
			} else if (get(authStore).identityProvider === 'plug') {
				await plug?.disconnect();
			}

			set({
				isAuthenticated: false,
				// identity: anonIdentity,
				actor: anonActor,
				identityProvider: 'anonymous',
				principal: anonPrincipal
			});
		},
		signInWithPlug: async () => {
			await connectPlug(set);
		}
	};
};

// @ts-ignore: next-line
const plug = window?.ic?.plug;

const onConnectionUpdateHelper = async (set: (this: void, value: AuthStoreData) => void) => {
	let isAuthenticated = await plug?.isConnected();
	if (isAuthenticated) {
		// let authActor = await plug.createActor({
		// 	canisterId,
		// 	interfaceFactory: idlFactory
		// });

		const principal = await plug.getPrincipal();

		set({
			isAuthenticated,
			// identity: publicKey,
			actor: anonActor,
			identityProvider: 'plug',
			principal
		});
	} else {
		set({
			isAuthenticated: false,
			// identity: anonIdentity,
			actor: anonActor,
			identityProvider: 'anonymous',
			principal: anonPrincipal
		});
	}
};

const connectPlug = async (set: (this: void, value: AuthStoreData) => void) => {
	if (plug) {
		try {
			const canisterId = import.meta.env.VITE_STABLECOIN_MINTER_CANISTER_ID as string;

			const host = import.meta.env.VITE_HOST as string;

			const whitelist = [canisterId];

			const onConnectionUpdate = async () => {
				await onConnectionUpdateHelper(set);
			};

			const publicKey = await plug.requestConnect({
				whitelist,
				// host,
				onConnectionUpdate
			});
			await onConnectionUpdateHelper(set);
			goto('/');
		} catch (e) {
			console.log(e);
			set({
				isAuthenticated: false,
				// identity: anonIdentity,
				actor: anonActor,
				identityProvider: 'anonymous',
				principal: anonPrincipal
			});
		}
	} else {
		window.open('https://plugwallet.ooo/', '_blank');
		set({
			isAuthenticated: false,
			// identity: anonIdentity,
			actor: anonActor,
			identityProvider: 'anonymous',
			principal: anonPrincipal
		});
	}
};

export const authStore: AuthStore = await init();
const sync = async () => await authStore.sync();

authStore.subscribe((value) => console.log(value.principal.toText()));
