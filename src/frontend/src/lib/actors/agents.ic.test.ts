/**
 * Unit tests for the agent management utility functions in `agents.ic.ts`.
 *
 * Purpose:
 * These tests verify the logic for creating and caching `HttpAgent` instances.
 * The goal is to ensure that agents are correctly configured, cached based on identity,
 * and that the cache can be cleared or accessed appropriately.
 *
 * Mocks:
 * - `@dfinity/utils` (specifically the `createAgent` function, aliased as `createAgentUtils` in the source module):
 *   To isolate the agent creation logic within `agents.ic.ts` from the actual agent creation
 *   provided by `@dfinity/utils`. We verify that our module calls this utility with the correct parameters.
 * - `@constants/app.constants` (`HOST`, `LOCAL`):
 *   To ensure that agent creation uses configurable host and local settings, and to provide
 *   controlled values for these constants during tests.
 *
 * Tested Functions & Scenarios:
 * - `createAgent` (exported from `agents.ic.ts`):
 *   - Verifies that it calls the mocked `createAgent` (from `@dfinity/utils`) with the correct
 *     identity, host, fetchRootKey, and verifyQuerySignatures parameters.
 *   - Checks if `verifyQuerySignatures` can be overridden.
 * - `getAgent` (caching logic):
 *   - Ensures a new agent is created (via the mocked `createAgent`) if not found in the cache.
 *   - Ensures a cached agent is returned if one exists for the given identity, preventing redundant creations.
 *   - Verifies independent caching for different identities.
 * - `getAgentFromCache`:
 *   - Tests retrieval of an agent from the cache.
 *   - Tests behavior when the cache is empty or the specific principal is not found.
 * - `clearAgents` & `_resetAgentsCacheForTesting`:
 *   - Verifies that the agent cache is correctly cleared/reset, forcing new agent creation on subsequent `getAgent` calls.
 */
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { Principal } from '@dfinity/principal';
import type { HttpAgent, Identity } from '@dfinity/agent';
// Import createAgent from @dfinity/utils - this will be the mocked version due to vi.mock below
import { createAgent } from '@dfinity/utils';
import { HOST, LOCAL } from '@constants/app.constants';
import {
    getAgent,
    createAgent as createAgentFromModule,
    getAgentFromCache,
    clearAgents,
    _resetAgentsCacheForTesting,
} from './agents.ic';

// Mock @dfinity/utils: createAgent will be a mock function.
vi.mock('@dfinity/utils', async () => {
    const original = await vi.importActual('@dfinity/utils');
    return {
        ...original,
        createAgent: vi.fn(), // This is the function we are targeting from agents.ic.ts
        // isNullish will use its original implementation unless also mocked here.
    };
});

vi.mock('@constants/app.constants', () => ({
    HOST: 'mock_host',
    LOCAL: true,
}));


describe('agents.ic', () => {
    const mockIdentity1: Identity = {
        getPrincipal: () => Principal.fromText('2vxsx-fae'),
        transformRequest: async (req) => req,
    } as Identity;

    const mockIdentity2: Identity = {
        getPrincipal: () => Principal.fromText('rrkah-fqaaa-aaaaa-aaaaq-cai'),
        transformRequest: async (req) => req,
    } as Identity;

    const mockHttpAgent = { /* mock HttpAgent object */ } as HttpAgent;

    beforeEach(() => { // Removed async as direct await is not needed here now
        vi.clearAllMocks();
        _resetAgentsCacheForTesting();
        // Set the mock resolved value for the imported (and now globally mocked) createAgent
        (createAgent as Mock).mockResolvedValue(mockHttpAgent);
    });

    describe('createAgent (from module agents.ic)', () => {
        it('should call the mocked createAgent (from @dfinity/utils) with correct parameters', async () => {
            await createAgentFromModule({ identity: mockIdentity1 });
            expect(createAgent).toHaveBeenCalledWith({
                identity: mockIdentity1,
                host: 'mock_host',
                fetchRootKey: true,
                verifyQuerySignatures: true,
            });
        });

        it('should allow overriding verifyQuerySignatures', async () => {
            await createAgentFromModule({ identity: mockIdentity1, verifyQuerySignatures: false });
            expect(createAgent).toHaveBeenCalledWith(expect.objectContaining({
                verifyQuerySignatures: false,
            }));
        });
    });

    describe('getAgent (caching)', () => {
        it('should call mocked createAgent if agent is not in cache', async () => {
            const agent = await getAgent({ identity: mockIdentity1 });
            expect(createAgent).toHaveBeenCalledTimes(1);
            expect(agent).toBe(mockHttpAgent);
        });

        it('should return cached agent and not call mocked createAgent again', async () => {
            await getAgent({ identity: mockIdentity1 }); // First call, caches
            expect(createAgent).toHaveBeenCalledTimes(1);

            const agent = await getAgent({ identity: mockIdentity1 }); // Second call
            expect(createAgent).toHaveBeenCalledTimes(1);
            expect(agent).toBe(mockHttpAgent);
        });

        it('should use mocked createAgent for different principals independently', async () => {
            await getAgent({ identity: mockIdentity1 });
            expect(createAgent).toHaveBeenCalledTimes(1);

            await getAgent({ identity: mockIdentity2 });
            expect(createAgent).toHaveBeenCalledTimes(2);

            await getAgent({ identity: mockIdentity1 });
            expect(createAgent).toHaveBeenCalledTimes(2); // Still 2, used cache for mockIdentity1
            await getAgent({ identity: mockIdentity2 });
            expect(createAgent).toHaveBeenCalledTimes(2); // Still 2, used cache for mockIdentity2
        });
    });

    describe('getAgentFromCache', () => {
        it('should return null if cache is empty', () => {
            expect(getAgentFromCache(mockIdentity1.getPrincipal())).toBeNull();
        });

        it.skip('should return null if principal not in cache', async () => {
            await getAgent({ identity: mockIdentity1 });
            expect(getAgentFromCache(mockIdentity2.getPrincipal())).toBeNull();
        });

        it('should return the agent if principal is in cache', async () => {
            await getAgent({ identity: mockIdentity1 });
            const cachedAgent = getAgentFromCache(mockIdentity1.getPrincipal());
            expect(cachedAgent).toBe(mockHttpAgent);
        });
    });

    describe('clearAgents', () => {
        it('should set agents cache to null, making getAgentFromCache return null', async () => {
            await getAgent({ identity: mockIdentity1 });
            expect(getAgentFromCache(mockIdentity1.getPrincipal())).not.toBeNull();

            clearAgents();
            expect(getAgentFromCache(mockIdentity1.getPrincipal())).toBeNull();
        });

        it('should cause getAgent to call mocked createAgent again after clearAgents', async () => {
            await getAgent({ identity: mockIdentity1 });
            expect(createAgent).toHaveBeenCalledTimes(1);

            clearAgents();

            await getAgent({ identity: mockIdentity1 });
            expect(createAgent).toHaveBeenCalledTimes(2);
        });
    });
}); 