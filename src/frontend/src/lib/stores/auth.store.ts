import { type Identity, type ActorSubclass, AnonymousIdentity } from '@dfinity/agent';
import type { _SERVICE } from '../../../../declarations/stablecoin_minter/stablecoin_minter.did';
import { writable, type Readable, get } from 'svelte/store';
import { AuthClient } from '@dfinity/auth-client';
import { getStablecoinMinterActor } from '../actor';
import { goto } from '$app/navigation';
import { type Principal } from '@dfinity/principal';
import type { Canister } from '@dfinity/utils';
import type { IcrcLedgerCanister } from '@dfinity/ledger-icrc';
import { getCkUsdcActor, getUsdxActor } from '$lib/icrc';
import { balanceStore } from './balance.store';
import { onDestroy } from 'svelte';

export interface AuthStoreData {
	isAuthenticated: boolean;
	// identity: Identity;
	stablecoinMinter: ActorSubclass<_SERVICE>;
	ckUsdc: IcrcLedgerCanister;
	usdx: IcrcLedgerCanister;
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
const anonActor: ActorSubclass<_SERVICE> = await getStablecoinMinterActor(anonIdentity);
const anonPrincipal: Principal = anonIdentity.getPrincipal();

const anonCkUsdcActor = await getCkUsdcActor(anonIdentity);
const anonUsdxActor = await getUsdxActor(anonIdentity);

const init = async (): Promise<AuthStore> => {
	const { subscribe, set } = writable<AuthStoreData>({
		isAuthenticated: false,
		// identity: new AnonymousIdentity(),
		stablecoinMinter: anonActor,
		identityProvider: 'anonymous',
		principal: anonPrincipal,
		ckUsdc: anonCkUsdcActor,
		usdx: anonUsdxActor
	});

	checkPlugConnectionIfTrueUpdateAuth(set);

	return {
		subscribe,
		sync: async () => {
			authClient = authClient ?? (await AuthClient.create());
			const isAuthenticated: boolean = await authClient.isAuthenticated();

			if (isAuthenticated) {
				const signIdentity = authClient.getIdentity();
				const authActor = await getStablecoinMinterActor(signIdentity);
				const authUsdxActor = await getUsdxActor(signIdentity);
				const authCkUsdcActor = await getCkUsdcActor(signIdentity);

				return set({
					isAuthenticated,
					// identity: signIdentity,
					stablecoinMinter: authActor,
					ckUsdc: authCkUsdcActor,
					usdx: authUsdxActor,
					identityProvider: 'ii',
					principal: signIdentity.getPrincipal()
				});
			}
			return set({
				isAuthenticated,
				// identity: anonIdentity,
				stablecoinMinter: anonActor,
				identityProvider: 'anonymous',
				principal: anonPrincipal,
				ckUsdc: anonCkUsdcActor,
				usdx: anonUsdxActor
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
				stablecoinMinter: anonActor,
				identityProvider: 'anonymous',
				principal: anonPrincipal,
				ckUsdc: anonCkUsdcActor,
				usdx: anonUsdxActor
			});
		},
		signInWithPlug: async () => {
			await connectPlug(set);
		}
	};
};

// @ts-ignore: next-line
const plug = window?.ic?.plug;

const checkPlugConnectionIfTrueUpdateAuth = async (
	set: (this: void, value: AuthStoreData) => void
) => {
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
			stablecoinMinter: anonActor,
			identityProvider: 'plug',
			principal,
			ckUsdc: anonCkUsdcActor,
			usdx: anonUsdxActor
		});
	}
};

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
			stablecoinMinter: anonActor,
			identityProvider: 'plug',
			principal,
			ckUsdc: anonCkUsdcActor,
			usdx: anonUsdxActor
		});
	} else {
		set({
			isAuthenticated: false,
			// identity: anonIdentity,
			stablecoinMinter: anonActor,
			identityProvider: 'anonymous',
			principal: anonPrincipal,
			ckUsdc: anonCkUsdcActor,
			usdx: anonUsdxActor
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
				stablecoinMinter: anonActor,
				identityProvider: 'anonymous',
				principal: anonPrincipal,
				ckUsdc: anonCkUsdcActor,
				usdx: anonUsdxActor
			});
		}
	} else {
		window.open('https://plugwallet.ooo/', '_blank');
		set({
			isAuthenticated: false,
			// identity: anonIdentity,
			stablecoinMinter: anonActor,
			identityProvider: 'anonymous',
			principal: anonPrincipal,
			ckUsdc: anonCkUsdcActor,
			usdx: anonUsdxActor
		});
	}
};

export const authStore: AuthStore = await init();
const sync = async () => await authStore.sync();
