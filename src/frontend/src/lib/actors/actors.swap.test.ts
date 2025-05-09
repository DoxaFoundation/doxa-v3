/**
 * Unit tests for actor creation functions in `actors.swap.ts`.
 *
 * Purpose:
 * These tests verify `getSwapFactoryActor` and `getSwapPoolActor`.
 * - For `getSwapFactoryActor`: Ensures it always uses an anonymous agent and the correct
 *   IDL factory and canister ID for the Swap Factory.
 * - For `getSwapPoolActor`: Ensures it correctly selects an agent based on the identity provider
 *   (similar to ICRC/Root actor getters) and uses the correct IDL factory and the provided canister ID.
 *
 * Mocks:
 * - `svelte/store` (`get` for `authStore`): For `getSwapPoolActor` to control `identityProvider` and `principal`.
 * - `@stores/auth.store`: Mock `authStore` for `getSwapPoolActor`.
 * - `./agents.ic` (`getAgent`, `getAgentFromCache`): Mock agent retrieval for both functions.
 * - `./actors.plug` (`getSwapPoolActorFromPlug`): Mock Plug Wallet actor creation for `getSwapPoolActor`.
 * - `@dfinity/agent` (`Actor.createActor`): Verify parameters for both actor types.
 * - `$lib/connection/anonymous.connection` (`anonIdentity`): Mock anonymous identity.
 * - `@constants/swap.constants` (`SWAP_FACTORY_CANISTER_ID`): Mock factory canister ID.
 * - `@dfinity/utils` (`assertNonNullish`): For `getSwapPoolActor` to verify non-null agent assertion.
 *
 * Tested Scenarios:
 * - `getSwapFactoryActor`:
 *   - Always uses anonymous agent.
 *   - Uses correct IDL and canister ID.
 * - `getSwapPoolActor`:
 *   - Correct actor creation for 'ii', 'nfid', 'plug', and 'anonymous' providers.
 *   - Handling of nullish agents from cache.
 *   - Error handling for invalid identity providers.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Principal } from '@dfinity/principal';
import { Actor } from '@dfinity/agent';
import { authStore } from '@stores/auth.store';
import { get } from 'svelte/store';
import { getAgent, getAgentFromCache } from './agents.ic'; // Mocked
import { getSwapPoolActorFromPlug } from './actors.plug'; // Mocked
import { anonIdentity } from '$lib/connection/anonymous.connection'; // Mocked
import { swapFactoryIdlFactory, swapPoolIdlFactory } from '$lib/types/actors'; // Actual IDLs
import { SWAP_FACTORY_CANISTER_ID } from '@constants/swap.constants'; // Mocked
import { getSwapFactoryActor, getSwapPoolActor } from './actors.swap';
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
        anonIdentity: { getPrincipal: () => Principal.fromText('2vxsx-fae') }, // Or any other mock principal
        anonPrincipal: Principal.anonymous()
    };
});
vi.mock('@constants/swap.constants', () => ({ SWAP_FACTORY_CANISTER_ID: 'mock_swap_factory_id' }));
vi.mock('@dfinity/utils', async () => {
    const original = await vi.importActual('@dfinity/utils');
    return { ...original, assertNonNullish: vi.fn((val, msg) => { if (val == null) throw new Error(msg); return val; }) };
});

const mockUserPrincipal = Principal.fromText('rrkah-fqaaa-aaaaa-aaaaq-cai');
const mockAgent = { /* Mock agent object */ fetchRootKey: vi.fn() };
const mockActorInstance = { /* Mock actor instance */ };

describe('actors.swap.ts', () => {

    beforeEach(() => {
        vi.clearAllMocks();
        (Actor.createActor as any).mockReturnValue(mockActorInstance);
        (getAgentFromCache as any).mockReturnValue(mockAgent);
        (getAgent as any).mockResolvedValue(mockAgent);
        (getSwapPoolActorFromPlug as any).mockResolvedValue(mockActorInstance);
    });

    // Tests for getSwapFactoryActor
    describe('getSwapFactoryActor', () => {
        it('should always use an anonymous agent', async () => {
            await getSwapFactoryActor();
            expect(getAgent).toHaveBeenCalledWith({ identity: anonIdentity });
        });

        it('should call Actor.createActor with correct factory, agent, and canisterId', async () => {
            await getSwapFactoryActor();
            expect(Actor.createActor).toHaveBeenCalledWith(
                swapFactoryIdlFactory,
                expect.objectContaining({ agent: mockAgent, canisterId: 'mock_swap_factory_id' })
            );
        });

        it('should return the created actor instance', async () => {
            const actor = await getSwapFactoryActor();
            expect(actor).toBe(mockActorInstance);
        });
    });

    // Tests for getSwapPoolActor (similar to getIcrcLedgerActor tests)
    describe('getSwapPoolActor', () => {
        const mockPoolCanisterId = 'mock-pool-id';

        const setupAuthStore = (identityProvider: string | null, principal: Principal | null = mockUserPrincipal) => {
            (get as any).mockImplementation((store: any) => store === authStore ? { identityProvider, principal } : undefined);
        };

        it('should throw error for invalid identity provider', async () => {
            setupAuthStore('invalid-provider');
            await expect(getSwapPoolActor(mockPoolCanisterId)).rejects.toThrow('Invalid identity provider');
        });

        describe("when identityProvider is 'ii' or 'nfid'", () => {
            ['ii', 'nfid'].forEach(provider => {
                it(`should use agent from cache for '${provider}'`, async () => {
                    setupAuthStore(provider);
                    const actor = await getSwapPoolActor(mockPoolCanisterId);
                    expect(getAgentFromCache).toHaveBeenCalledWith(mockUserPrincipal);
                    expect(assertNonNullish).toHaveBeenCalledWith(mockAgent, 'Agent is Nullish value');
                    expect(Actor.createActor).toHaveBeenCalledWith(
                        swapPoolIdlFactory,
                        expect.objectContaining({ agent: mockAgent, canisterId: mockPoolCanisterId })
                    );
                    expect(actor).toBe(mockActorInstance);
                });

                it(`should throw if agent from cache is nullish for '${provider}'`, async () => {
                    setupAuthStore(provider);
                    (getAgentFromCache as any).mockReturnValue(null);
                    (assertNonNullish as any).mockImplementationOnce((val: any, msg: string) => { if (val == null) throw new Error(msg); return val; });
                    await expect(getSwapPoolActor(mockPoolCanisterId)).rejects.toThrow('Agent is Nullish value');
                    expect(getAgentFromCache).toHaveBeenCalledWith(mockUserPrincipal);
                    expect(Actor.createActor).not.toHaveBeenCalled();
                });
            });
        });

        describe("when identityProvider is 'plug'", () => {
            it('should use getSwapPoolActorFromPlug', async () => {
                setupAuthStore('plug');
                const actor = await getSwapPoolActor(mockPoolCanisterId);
                expect(getSwapPoolActorFromPlug).toHaveBeenCalledWith(mockPoolCanisterId);
                expect(Actor.createActor).not.toHaveBeenCalled();
                expect(actor).toBe(mockActorInstance);
            });
        });

        describe("when identityProvider is 'anonymous'", () => {
            it('should create an actor with an anonymous agent', async () => {
                setupAuthStore('anonymous', null);
                const actor = await getSwapPoolActor(mockPoolCanisterId);
                expect(getAgent).toHaveBeenCalledWith({ identity: anonIdentity });
                expect(Actor.createActor).toHaveBeenCalledWith(
                    swapPoolIdlFactory,
                    expect.objectContaining({ agent: mockAgent, canisterId: mockPoolCanisterId })
                );
                expect(actor).toBe(mockActorInstance);
            });
        });
    });
}); 