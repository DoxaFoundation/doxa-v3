import { type Identity, type ActorSubclass, AnonymousIdentity } from '@dfinity/agent';
import type { _SERVICE as ICRC_LEDGER_SERVICE } from '@dfinity/ledger-icrc/dist/candid/icrc_ledger';
import type { _SERVICE as MINTER_SERVICE } from '../../../../declarations/stablecoin_minter/stablecoin_minter.did';
import { writable, type Readable, get } from 'svelte/store';
import { AuthClient } from '@dfinity/auth-client';
import { getActors } from '../actor';
import { goto } from '$app/navigation';
import { type Principal } from '@dfinity/principal';
import { getActorsFromPlug } from '$lib/plug';

export interface AuthStoreData {
	isAuthenticated: boolean;
	// identity: Identity;
	stablecoinMinter: ActorSubclass<MINTER_SERVICE>;
	ckUsdc: ActorSubclass<ICRC_LEDGER_SERVICE>;
	usdx: ActorSubclass<ICRC_LEDGER_SERVICE>;
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
const anonPrincipal: Principal = anonIdentity.getPrincipal();
const anonActors = await getActors(anonIdentity);

const init = async (): Promise<AuthStore> => {
	const { subscribe, set } = writable<AuthStoreData>({
		isAuthenticated: false,
		// identity: new AnonymousIdentity(),
		stablecoinMinter: anonActors.stablecoinMinterActor,
		identityProvider: 'anonymous',
		principal: anonPrincipal,
		ckUsdc: anonActors.ckUsdcActor,
		usdx: anonActors.usdxActor
	});

	checkPlugConnectionIfTrueUpdateAuth(set);

	return {
		subscribe,
		sync: async () => {
			authClient = authClient ?? (await AuthClient.create());
			const isAuthenticated: boolean = await authClient.isAuthenticated();

			if (isAuthenticated) {
				const signIdentity = authClient.getIdentity();
				const { stablecoinMinterActor, ckUsdcActor, usdxActor } = await getActors(signIdentity);
				return set({
					isAuthenticated,
					// identity: signIdentity,
					stablecoinMinter: stablecoinMinterActor,
					ckUsdc: ckUsdcActor,
					usdx: usdxActor,
					identityProvider: 'ii',
					principal: signIdentity.getPrincipal()
				});
			}
			return set({
				isAuthenticated,
				// identity: anonIdentity,
				stablecoinMinter: anonActors.stablecoinMinterActor,
				identityProvider: 'anonymous',
				principal: anonPrincipal,
				ckUsdc: anonActors.ckUsdcActor,
				usdx: anonActors.usdxActor
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
				stablecoinMinter: anonActors.stablecoinMinterActor,
				identityProvider: 'anonymous',
				principal: anonPrincipal,
				ckUsdc: anonActors.ckUsdcActor,
				usdx: anonActors.usdxActor
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
		const { stablecoinMinterActor, ckUsdcActor, usdxActor } = await getActorsFromPlug();
		const principal = await plug.getPrincipal();

		set({
			isAuthenticated,
			// identity: publicKey,
			stablecoinMinter: stablecoinMinterActor,
			identityProvider: 'plug',
			principal,
			ckUsdc: ckUsdcActor,
			usdx: usdxActor
		});
	}
};

const onConnectionUpdateHelper = async (set: (this: void, value: AuthStoreData) => void) => {
	let isAuthenticated = await plug?.isConnected();
	if (isAuthenticated) {
		const { stablecoinMinterActor, ckUsdcActor, usdxActor } = await getActorsFromPlug();
		const principal = await plug.getPrincipal();

		set({
			isAuthenticated,
			// identity: publicKey,
			stablecoinMinter: stablecoinMinterActor,
			identityProvider: 'plug',
			principal,
			ckUsdc: ckUsdcActor,
			usdx: usdxActor
		});
	} else {
		set({
			isAuthenticated: false,
			// identity: anonIdentity,
			stablecoinMinter: anonActors.stablecoinMinterActor,
			identityProvider: 'anonymous',
			principal: anonPrincipal,
			ckUsdc: anonActors.ckUsdcActor,
			usdx: anonActors.usdxActor
		});
	}
};

const connectPlug = async (set: (this: void, value: AuthStoreData) => void) => {
	if (plug) {
		try {
			const STABLECOIN_MINTER_CANISTER_ID = import.meta.env
				.VITE_STABLECOIN_MINTER_CANISTER_ID as string;
			const USDX_CANISTER_ID = import.meta.env.VITE_USDX_LEDGER_CANISTER_ID as string;
			const CKUSDC_CANISTER_ID = import.meta.env.VITE_CKUSDC_LEDGER_CANISTER_ID as string;

			const host = import.meta.env.VITE_HOST as string;

			const whitelist = [STABLECOIN_MINTER_CANISTER_ID, USDX_CANISTER_ID, CKUSDC_CANISTER_ID];

			const onConnectionUpdate = async () => {
				await onConnectionUpdateHelper(set);
			};

			const publicKey = await plug.requestConnect({
				whitelist,
				host,
				onConnectionUpdate
			});
			await onConnectionUpdateHelper(set);
			goto('/');
		} catch (e) {
			console.log(e);
			set({
				isAuthenticated: false,
				// identity: anonIdentity,
				stablecoinMinter: anonActors.stablecoinMinterActor,
				identityProvider: 'anonymous',
				principal: anonPrincipal,
				ckUsdc: anonActors.ckUsdcActor,
				usdx: anonActors.usdxActor
			});
		}
	} else {
		window.open('https://plugwallet.ooo/', '_blank');
		set({
			isAuthenticated: false,
			// identity: anonIdentity,
			stablecoinMinter: anonActors.stablecoinMinterActor,
			identityProvider: 'anonymous',
			principal: anonPrincipal,
			ckUsdc: anonActors.ckUsdcActor,
			usdx: anonActors.usdxActor
		});
	}
};

export const authStore: AuthStore = await init();
const sync = async () => await authStore.sync();
