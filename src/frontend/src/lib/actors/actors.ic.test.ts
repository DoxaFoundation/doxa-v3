/**
 * Unit tests for various actor creation functions in `actors.ic.ts`.
 *
 * Purpose:
 * These tests verify that functions like `getStablecoinMinterActor`, `getCkUsdcActor`,
 * `getUsdxActor`, `getStakingActor`, `getUtilityActor`, and the aggregator `getActors`
 * correctly create actor instances. The focus is on ensuring that the correct agent
 * (either passed identity or anonymous) is used and that `Actor.createActor` is invoked
 * with the appropriate IDL factory and canister ID for each actor type.
 *
 * Mocks:
 * - `./agents.ic` (`getAgent`): To control the agent instance provided to `Actor.createActor`.
 *   This is crucial as most actor getters in this file depend on `getAgent`.
 * - `$lib/connection/anonymous.connection` (`anonIdentity`): To provide a mock anonymous identity,
 *   used by `getUtilityActor` and potentially others if no identity is passed.
 * - `@dfinity/agent` (`Actor.createActor`): To verify its invocation with the correct parameters
 *   (IDL, agent, canisterId) and to return distinguishable mock actor instances.
 * - `@constants/app.constants` (various canister IDs): To provide mock canister IDs for testing.
 *
 * Tested Functions & Scenarios:
 * - `getUtilityActor`: Verifies use of anonymous identity and correct parameters for `Actor.createActor`.
 * - `getStablecoinMinterActor`: Verifies use of a provided identity and correct parameters.
 * - `getCkUsdcActor` (and by extension `getUsdxActor` due to similar internal calls):
 *   Verifies use of a provided identity and correct parameters, noting the use of the generic `icrcLedgerIdlFactory`.
 * - `getActors` (aggregator function):
 *   - Ensures that `getAgent` is called appropriately for the identities used by the underlying actor getters.
 *   - Verifies that `Actor.createActor` is called for each constituent actor with its specific
 *     IDL factory and canister ID.
 *   - Checks the structure of the returned `Actors` object.
 * - Implicitly tests the internal `getIcrcActor` helper via `getCkUsdcActor` and `getUsdxActor`.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Principal } from '@dfinity/principal';
import { Actor, type Identity } from '@dfinity/agent';
import { getAgent } from './agents.ic'; // Mocked
import { anonIdentity } from '$lib/connection/anonymous.connection'; // Mocked
import {
    stablecoinMinterIdlFactory,
    icrcLedgerIdlFactory,
    stakingCanisterIdlFactory,
    utilityIdlFactory
} from '$lib/types/actors'; // Actual IDLs
import {
    STABLECOIN_MINTER_CANISTER_ID,
    CKUSDC_LEDGER_CANISTER_ID,
    USDX_LEDGER_CANISTER_ID,
    STAKING_CANISTER_ID,
    UTILITY_CANISTER_ID
} from '@constants/app.constants'; // Mocked
import {
    getStablecoinMinterActor,
    getCkUsdcActor,
    getUsdxActor,
    getStakingActor,
    getActors,
    getUtilityActor
} from './actors.ic';

// Mock dependencies
vi.mock('./agents.ic');
vi.mock('$lib/connection/anonymous.connection', () => ({
    anonIdentity: { getPrincipal: () => Principal.fromText('2vxsx-fae'), name: 'anon' } // Added name for clarity
}));
vi.mock('@dfinity/agent', () => ({ Actor: { createActor: vi.fn() } }));
vi.mock('@constants/app.constants', () => ({
    STABLECOIN_MINTER_CANISTER_ID: 'mock_minter_id',
    CKUSDC_LEDGER_CANISTER_ID: 'mock_ckusdc_id',
    USDX_LEDGER_CANISTER_ID: 'mock_usdx_id',
    STAKING_CANISTER_ID: 'mock_staking_id',
    UTILITY_CANISTER_ID: 'mock_utility_id'
}));

const mockAgent = { /* Mock agent object */ fetchRootKey: vi.fn() };
const mockActorInstance = (name: string) => ({ name }); // Helper to create distinct mock actors

describe('actors.ic.ts', () => {

    beforeEach(() => {
        vi.clearAllMocks();
        (getAgent as any).mockResolvedValue(mockAgent);
        // Setup createActor mock to return distinguishable actor mocks
        (Actor.createActor as any).mockImplementation((idl: any, config: { canisterId: string; }) => {
            return mockActorInstance(`${idl.name || 'unknown'}_${config.canisterId}`);
        });
    });

    describe('getUtilityActor', () => {
        it('should use anonymous identity and call createActor with correct args', async () => {
            await getUtilityActor();
            expect(getAgent).toHaveBeenCalledWith({ identity: anonIdentity });
            expect(Actor.createActor).toHaveBeenCalledWith(
                utilityIdlFactory,
                expect.objectContaining({ agent: mockAgent, canisterId: 'mock_utility_id' })
            );
        });
    });

    describe('getStablecoinMinterActor', () => {
        const mockIdentity: Identity = { getPrincipal: () => Principal.fromText('裒') } as Identity;
        it('should use provided identity and call createActor with correct args', async () => {
            await getStablecoinMinterActor(mockIdentity);
            expect(getAgent).toHaveBeenCalledWith({ identity: mockIdentity });
            expect(Actor.createActor).toHaveBeenCalledWith(
                stablecoinMinterIdlFactory,
                expect.objectContaining({ agent: mockAgent, canisterId: 'mock_minter_id' })
            );
        });
    });

    describe('getCkUsdcActor', () => {
        const mockIdentity: Identity = { getPrincipal: () => Principal.fromText('裒') } as Identity;
        it('should use provided identity and call createActor with correct args', async () => {
            await getCkUsdcActor(mockIdentity);
            expect(getAgent).toHaveBeenCalledWith({ identity: mockIdentity });
            expect(Actor.createActor).toHaveBeenCalledWith(
                icrcLedgerIdlFactory, // It uses the generic ICRC factory
                expect.objectContaining({ agent: mockAgent, canisterId: 'mock_ckusdc_id' })
            );
        });
    });

    // Similar tests can be added for getUsdxActor and getStakingActor if needed

    describe('getActors', () => {
        const mockIdentity: Identity = { getPrincipal: () => Principal.fromText('裒') } as Identity;
        it('should call respective actor getters with the provided identity', async () => {
            const actors = await getActors(mockIdentity);

            // Check if getAgent was called for each underlying actor creation
            // (Assuming each actor getter calls getAgent independently and no caching within getActors itself)
            // The number of calls depends on the internal structure. Let's check for 4.
            expect(getAgent).toHaveBeenCalledTimes(4);
            expect(getAgent).toHaveBeenCalledWith({ identity: mockIdentity });

            // Check if createActor was called for each specific actor
            expect(Actor.createActor).toHaveBeenCalledWith(stablecoinMinterIdlFactory, expect.objectContaining({ canisterId: 'mock_minter_id' }));
            expect(Actor.createActor).toHaveBeenCalledWith(icrcLedgerIdlFactory, expect.objectContaining({ canisterId: 'mock_ckusdc_id' }));
            expect(Actor.createActor).toHaveBeenCalledWith(icrcLedgerIdlFactory, expect.objectContaining({ canisterId: 'mock_usdx_id' }));
            expect(Actor.createActor).toHaveBeenCalledWith(stakingCanisterIdlFactory, expect.objectContaining({ canisterId: 'mock_staking_id' }));

            // Check returned structure
            expect(actors).toHaveProperty('stablecoinMinter');
            expect(actors).toHaveProperty('ckUSDC');
            expect(actors).toHaveProperty('USDx');
            expect(actors).toHaveProperty('staking');
        });
    });
}); 