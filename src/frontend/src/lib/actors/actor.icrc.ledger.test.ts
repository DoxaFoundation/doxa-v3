/**
 * Unit tests for the `getIcrcLedgerActor` function in `actor.icrc.ledger.ts`.
 *
 * Purpose:
 * These tests verify that the `getIcrcLedgerActor` function correctly creates and returns
 * an ICRC-1 ledger actor instance based on the current authentication state (identity provider).
 * It ensures the correct agent (anonymous, cached, or Plug) is used and that the
 * actor is created with the appropriate IDL factory and canister ID.
 *
 * Mocks:
 * - `svelte/store` (specifically the `get` function for `authStore`):
 *   To control the `identityProvider` and `principal` returned by the `authStore`.
 * - `@stores/auth.store`: To provide a mock `authStore` object.
 * - `$lib/actors/agents.ic` (`getAgent`, `getAgentFromCache`):
 *   To control the agent instances returned for different identity scenarios.
 * - `$lib/actors/actors.plug` (`getIcrcLedgerActorFromPlug`):
 *   To mock the actor creation via Plug Wallet.
 * - `@dfinity/agent` (`Actor.createActor`):
 *   To verify it's called with correct parameters (IDL, agent, canisterId) and to return a mock actor.
 * - `$lib/connection/anonymous.connection` (`anonIdentity`):
 *   To provide a mock anonymous identity.
 * - `@dfinity/utils` (`assertNonNullish`):
 *   To verify it's called and to control its behavior for nullish agent scenarios.
 *
 * Tested Scenarios:
 * - Behavior for 'ii' (Internet Identity) and 'nfid' identity providers (using cached agent).
 * - Behavior for 'plug' identity provider (delegating to `getIcrcLedgerActorFromPlug`).
 * - Behavior for 'anonymous' identity provider (creating a new anonymous agent).
 * - Handling of nullish agents when fetched from cache.
 * - Error handling for invalid or unsupported identity providers.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Principal } from '@dfinity/principal';
import { Actor } from '@dfinity/agent';
import { authStore } from '@stores/auth.store';
import { get } from 'svelte/store';
import { getAgent, getAgentFromCache } from '$lib/actors/agents.ic';
import { getIcrcLedgerActorFromPlug } from '$lib/actors/actors.plug';
import { anonIdentity } from '$lib/connection/anonymous.connection';
import { icrcLedgerIdlFactory } from '$lib/types/actors'; // Assuming this is the actual IDL
import { getIcrcLedgerActor } from './actor.icrc.ledger';
import { assertNonNullish } from '@dfinity/utils';

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
vi.mock('$lib/actors/agents.ic');
vi.mock('$lib/actors/actors.plug');
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
        anonIdentity: { getPrincipal: () => Principal.fromText('2vxsx-fae') }, // Assuming a mock principal or use Principal.anonymous()
        anonPrincipal: Principal.anonymous()
    };
});
vi.mock('@dfinity/utils', async () => {
    const originalUtils = await vi.importActual('@dfinity/utils');
    return {
        ...originalUtils,
        assertNonNullish: vi.fn((val, msg) => {
            if (val === null || val === undefined) {
                throw new Error(msg || 'Value is null or undefined');
            }
            return val;
        }),
    };
});


describe('getIcrcLedgerActor', () => {
    const mockCanisterId = 'ryjl3-tyaaa-aaaaa-aaaba-cai';
    const mockUserPrincipal = Principal.fromText('rrkah-fqaaa-aaaaa-aaaaq-cai'); // Changed from '裒'
    const mockAgent = { /* Mock agent object */ fetchRootKey: vi.fn() };
    const mockActorInstance = { /* Mock actor instance */ };

    beforeEach(() => {
        vi.clearAllMocks();
        (Actor.createActor as any).mockReturnValue(mockActorInstance);
        (getAgentFromCache as any).mockReturnValue(mockAgent);
        (getAgent as any).mockResolvedValue(mockAgent);
        (getIcrcLedgerActorFromPlug as any).mockResolvedValue(mockActorInstance);
    });

    const setupAuthStore = (identityProvider: string | null, principal: Principal | null = mockUserPrincipal) => {
        (get as any).mockImplementation((store: any) => {
            if (store === authStore) {
                return { identityProvider, principal };
            }
            return undefined;
        });
    };

    it('should throw error for invalid identity provider', async () => {
        setupAuthStore('invalid-provider');
        await expect(getIcrcLedgerActor(mockCanisterId)).rejects.toThrow('Invalid identity provider');
    });

    describe("when identityProvider is 'ii' or 'nfid'", () => {
        const providers = ['ii', 'nfid'];
        providers.forEach(provider => {
            it(`should use agent from cache for '${provider}' provider`, async () => {
                setupAuthStore(provider);
                const actor = await getIcrcLedgerActor(mockCanisterId);

                expect(getAgentFromCache).toHaveBeenCalledWith(mockUserPrincipal);
                expect(assertNonNullish).toHaveBeenCalledWith(mockAgent, 'Agent is Nullish value');
                expect(Actor.createActor).toHaveBeenCalledWith(
                    icrcLedgerIdlFactory,
                    expect.objectContaining({ agent: mockAgent, canisterId: mockCanisterId })
                );
                expect(actor).toBe(mockActorInstance);
            });

            it(`should throw if agent from cache is nullish for '${provider}' provider`, async () => {
                setupAuthStore(provider);
                (getAgentFromCache as any).mockReturnValue(null);
                (assertNonNullish as any).mockImplementationOnce((val: null | undefined, msg: any) => { // ensure this specific call throws
                    if (val === null || val === undefined) {
                        throw new Error(msg || 'Value is null or undefined');
                    }
                    return val;
                });
                await expect(getIcrcLedgerActor(mockCanisterId)).rejects.toThrow('Agent is Nullish value');
                expect(getAgentFromCache).toHaveBeenCalledWith(mockUserPrincipal);
                expect(Actor.createActor).not.toHaveBeenCalled();
            });
        });
    });

    describe("when identityProvider is 'plug'", () => {
        it('should use getIcrcLedgerActorFromPlug', async () => {
            setupAuthStore('plug');
            const actor = await getIcrcLedgerActor(mockCanisterId);

            expect(getIcrcLedgerActorFromPlug).toHaveBeenCalledWith(mockCanisterId);
            expect(Actor.createActor).not.toHaveBeenCalled(); // createActor is called within the plug function
            expect(actor).toBe(mockActorInstance);
        });
    });

    describe("when identityProvider is 'anonymous'", () => {
        it('should create an actor with an anonymous agent', async () => {
            setupAuthStore('anonymous', null); // Principal is null for anonymous in some setups
            const actor = await getIcrcLedgerActor(mockCanisterId);

            expect(getAgent).toHaveBeenCalledWith({ identity: anonIdentity });
            expect(Actor.createActor).toHaveBeenCalledWith(
                icrcLedgerIdlFactory,
                expect.objectContaining({ agent: mockAgent, canisterId: mockCanisterId })
            );
            expect(actor).toBe(mockActorInstance);
        });
    });
}); 