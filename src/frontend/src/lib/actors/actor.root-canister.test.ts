/**
 * Unit tests for the `getRootCanister` function in `actor.root-canister.ts`.
 *
 * Purpose:
 * These tests verify that `getRootCanister` correctly creates and returns a Root Canister actor.
 * It focuses on ensuring the right agent is selected based on the identity provider
 * (from `authStore`) and that `Actor.createActor` is invoked with the correct IDL factory,
 * agent, and the hardcoded `ROOT_CANISTER_ID`.
 *
 * Mocks:
 * - `svelte/store` (`get` for `authStore`): To control the active `identityProvider` and `principal`.
 * - `@stores/auth.store`: Mock `authStore` object.
 * - `./agents.ic` (`getAgent`, `getAgentFromCache`): To mock agent retrieval mechanisms.
 * - `./actors.plug` (`getRootActorFromPlug`): To mock actor creation via Plug Wallet.
 * - `@dfinity/agent` (`Actor.createActor`): To verify its invocation and parameters.
 * - `$lib/connection/anonymous.connection` (`anonIdentity`): Mock anonymous identity.
 * - `@constants/app.constants` (`ROOT_CANISTER_ID`): To provide a mock canister ID.
 * - `@dfinity/utils` (`assertNonNullish`): To verify non-null agent assertion.
 *
 * Tested Scenarios:
 * - Correct actor creation for 'ii', 'nfid', 'plug', and 'anonymous' identity providers.
 * - Proper handling of nullish agents from cache for 'ii'/'nfid' providers.
 * - Error throwing for invalid identity providers.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Principal } from '@dfinity/principal';
import { Actor } from '@dfinity/agent';
import { authStore } from '@stores/auth.store';
import { get } from 'svelte/store';
import { getAgent, getAgentFromCache } from './agents.ic'; // Mocked
import { getRootActorFromPlug } from './actors.plug'; // Mocked
import { anonIdentity } from '$lib/connection/anonymous.connection'; // Mocked
import { rootCanisterIdlFactory } from '$lib/types/actors'; // Actual IDL
import { ROOT_CANISTER_ID } from '@constants/app.constants'; // Mocked
import { getRootCanister } from './actor.root-canister';
import { assertNonNullish } from '@dfinity/utils'; // Mocked

// Mocking dependencies
vi.mock('svelte/store', () => ({
    get: vi.fn(),
    writable: vi.fn(() => ({
        subscribe: vi.fn(),
        set: vi.fn(),
        update: vi.fn(),
    })),
}));
vi.mock('@stores/auth.store');
vi.mock('./agents.ic');
vi.mock('./actors.plug');
vi.mock('@dfinity/agent', async (importOriginal) => {
    const actual = await importOriginal() as Record<string, unknown>;
    return {
        ...actual,
        Actor: {
            ...(actual.Actor as Record<string, unknown>),
            createActor: vi.fn(),
        },
    };
});
vi.mock('$lib/connection/anonymous.connection', async () => {
    const { Principal } = await import('@dfinity/principal');
    return {
        anonIdentity: { getPrincipal: () => Principal.fromText('2vxsx-fae') },
        anonPrincipal: Principal.anonymous()
    };
});
vi.mock('@constants/app.constants', () => ({ ROOT_CANISTER_ID: 'mock_root_canister_id' }));
vi.mock('@dfinity/utils', async () => {
    const original = await vi.importActual('@dfinity/utils');
    return { ...original, assertNonNullish: vi.fn((val: any, msg: string) => { if (val == null) throw new Error(msg); return val; }) };
});

describe('getRootCanister', () => {
    const mockUserPrincipal = Principal.fromText('rrkah-fqaaa-aaaaa-aaaaq-cai');
    const mockAgent = { /* Mock agent object */ fetchRootKey: vi.fn() };
    const mockActorInstance = { /* Mock actor instance */ };

    beforeEach(() => {
        vi.clearAllMocks();
        (Actor.createActor as any).mockReturnValue(mockActorInstance);
        (getAgentFromCache as any).mockReturnValue(mockAgent);
        (getAgent as any).mockResolvedValue(mockAgent);
        (getRootActorFromPlug as any).mockResolvedValue(mockActorInstance);
    });

    const setupAuthStore = (identityProvider: string | null, principal: Principal | null = mockUserPrincipal) => {
        (get as any).mockImplementation((store: any) => store === authStore ? { identityProvider, principal } : undefined);
    };

    it('should throw error for invalid identity provider', async () => {
        setupAuthStore('invalid-provider');
        await expect(getRootCanister()).rejects.toThrow('Invalid identity provider');
    });

    describe("when identityProvider is 'ii' or 'nfid'", () => {
        ['ii', 'nfid'].forEach(provider => {
            it(`should use agent from cache for '${provider}'`, async () => {
                setupAuthStore(provider);
                const actor = await getRootCanister();
                expect(getAgentFromCache).toHaveBeenCalledWith(mockUserPrincipal);
                expect(assertNonNullish).toHaveBeenCalledWith(mockAgent, 'Agent is Nullish value');
                expect(Actor.createActor).toHaveBeenCalledWith(
                    rootCanisterIdlFactory,
                    expect.objectContaining({ agent: mockAgent, canisterId: 'mock_root_canister_id' })
                );
                expect(actor).toBe(mockActorInstance);
            });

            it(`should throw if agent from cache is nullish for '${provider}'`, async () => {
                setupAuthStore(provider);
                (getAgentFromCache as any).mockReturnValue(null);
                (assertNonNullish as any).mockImplementationOnce((val: any, msg: string) => { if (val == null) throw new Error(msg); return val; });
                await expect(getRootCanister()).rejects.toThrow('Agent is Nullish value');
                expect(getAgentFromCache).toHaveBeenCalledWith(mockUserPrincipal);
                expect(Actor.createActor).not.toHaveBeenCalled();
            });
        });
    });

    describe("when identityProvider is 'plug'", () => {
        it('should use getRootActorFromPlug', async () => {
            setupAuthStore('plug');
            const actor = await getRootCanister();
            expect(getRootActorFromPlug).toHaveBeenCalled();
            expect(Actor.createActor).not.toHaveBeenCalled();
            expect(actor).toBe(mockActorInstance);
        });
    });

    describe("when identityProvider is 'anonymous'", () => {
        it('should create an actor with an anonymous agent', async () => {
            setupAuthStore('anonymous', null);
            const actor = await getRootCanister();
            expect(getAgent).toHaveBeenCalledWith({ identity: anonIdentity });
            expect(Actor.createActor).toHaveBeenCalledWith(
                rootCanisterIdlFactory,
                expect.objectContaining({ agent: mockAgent, canisterId: 'mock_root_canister_id' })
            );
            expect(actor).toBe(mockActorInstance);
        });
    });
}); 