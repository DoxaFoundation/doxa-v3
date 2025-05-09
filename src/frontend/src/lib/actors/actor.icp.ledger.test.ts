/**
 * Unit tests for the `getIcpLedgerActor` function in `actor.icp.ledger.ts`.
 *
 * Purpose:
 * These tests ensure that `getIcpLedgerActor` correctly creates and returns an ICP Ledger actor.
 * The tests verify the selection of the correct agent based on the `identityProvider`
 * (from `authStore`) and ensure that `Actor.createActor` is called with the appropriate
 * IDL factory (`icpLedgerIdlFactory`), agent, and the hardcoded `ICP_LEDGER_CANISTER_ID`.
 *
 * Mocks:
 * - `svelte/store` (`get` for `authStore`): To control `identityProvider` and `principal`.
 * - `@stores/auth.store`: Mock `authStore` object.
 * - `./agents.ic` (`getAgent`, `getAgentFromCache`): To mock agent retrieval.
 * - `./actors.plug` (`getIcpLedgerActorFromPlug`): To mock actor creation via Plug.
 * - `@dfinity/agent` (`Actor.createActor`): To verify its invocation and parameters.
 * - `$lib/connection/anonymous.connection` (`anonIdentity`): Mock anonymous identity.
 * - `@constants/app.constants` (`ICP_LEDGER_CANISTER_ID`): To provide a mock canister ID.
 * - `@dfinity/utils` (`assertNonNullish`): For verifying non-null agent assertion.
 *
 * Tested Scenarios:
 * - Correct actor creation for 'ii', 'nfid', 'plug', and 'anonymous' identity providers.
 * - Handling of nullish agents from cache.
 * - Error handling for invalid identity providers.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Principal } from '@dfinity/principal';
import { Actor } from '@dfinity/agent';
import { authStore } from '@stores/auth.store';
import { get } from 'svelte/store';
import { getAgent, getAgentFromCache } from './agents.ic'; // Mocked
import { getIcpLedgerActorFromPlug } from './actors.plug'; // Mocked
import { anonIdentity } from '$lib/connection/anonymous.connection'; // Mocked
import { icpLedgerIdlFactory } from '$lib/types/actors'; // Actual IDL
import { ICP_LEDGER_CANISTER_ID } from '@constants/app.constants'; // Mocked
import { getIcpLedgerActor } from './actor.icp.ledger';
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
vi.mock('@constants/app.constants', () => ({ ICP_LEDGER_CANISTER_ID: 'mock_icp_ledger_id' }));
vi.mock('@dfinity/utils', async () => {
    const original = await vi.importActual('@dfinity/utils');
    return { ...original, assertNonNullish: vi.fn((val: any, msg: string) => { if (val == null) throw new Error(msg); return val; }) };
});

describe('getIcpLedgerActor', () => {
    const mockUserPrincipal = Principal.fromText('rrkah-fqaaa-aaaaa-aaaaq-cai');
    const mockAgent = { /* Mock agent object */ fetchRootKey: vi.fn() };
    const mockActorInstance = { /* Mock actor instance */ };

    beforeEach(() => {
        vi.clearAllMocks();
        (Actor.createActor as any).mockReturnValue(mockActorInstance);
        (getAgentFromCache as any).mockReturnValue(mockAgent);
        (getAgent as any).mockResolvedValue(mockAgent);
        (getIcpLedgerActorFromPlug as any).mockResolvedValue(mockActorInstance);
    });

    const setupAuthStore = (identityProvider: string | null, principal: Principal | null = mockUserPrincipal) => {
        (get as any).mockImplementation((store: any) => store === authStore ? { identityProvider, principal } : undefined);
    };

    it('should throw error for invalid identity provider', async () => {
        setupAuthStore('invalid-provider');
        await expect(getIcpLedgerActor()).rejects.toThrow('Invalid identity provider');
    });

    describe("when identityProvider is 'ii' or 'nfid'", () => {
        ['ii', 'nfid'].forEach(provider => {
            it(`should use agent from cache for '${provider}'`, async () => {
                setupAuthStore(provider);
                const actor = await getIcpLedgerActor();
                expect(getAgentFromCache).toHaveBeenCalledWith(mockUserPrincipal);
                expect(assertNonNullish).toHaveBeenCalledWith(mockAgent, 'Agent is Nullish value');
                expect(Actor.createActor).toHaveBeenCalledWith(
                    icpLedgerIdlFactory,
                    expect.objectContaining({ agent: mockAgent, canisterId: 'mock_icp_ledger_id' })
                );
                expect(actor).toBe(mockActorInstance);
            });

            it(`should throw if agent from cache is nullish for '${provider}'`, async () => {
                setupAuthStore(provider);
                (getAgentFromCache as any).mockReturnValue(null);
                (assertNonNullish as any).mockImplementationOnce((val: any, msg: string) => { if (val == null) throw new Error(msg); return val; });
                await expect(getIcpLedgerActor()).rejects.toThrow('Agent is Nullish value');
                expect(getAgentFromCache).toHaveBeenCalledWith(mockUserPrincipal);
                expect(Actor.createActor).not.toHaveBeenCalled();
            });
        });
    });

    describe("when identityProvider is 'plug'", () => {
        it('should use getIcpLedgerActorFromPlug', async () => {
            setupAuthStore('plug');
            const actor = await getIcpLedgerActor();
            // Assuming getIcpLedgerActorFromPlug doesn't take canisterId based on usage
            expect(getIcpLedgerActorFromPlug).toHaveBeenCalled();
            expect(Actor.createActor).not.toHaveBeenCalled();
            expect(actor).toBe(mockActorInstance);
        });
    });

    describe("when identityProvider is 'anonymous'", () => {
        it('should create an actor with an anonymous agent', async () => {
            setupAuthStore('anonymous', null);
            const actor = await getIcpLedgerActor();
            expect(getAgent).toHaveBeenCalledWith({ identity: anonIdentity });
            expect(Actor.createActor).toHaveBeenCalledWith(
                icpLedgerIdlFactory,
                expect.objectContaining({ agent: mockAgent, canisterId: 'mock_icp_ledger_id' })
            );
            expect(actor).toBe(mockActorInstance);
        });
    });
}); 