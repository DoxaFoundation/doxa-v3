/**
 * Tests for the ICP Ledger API functions.
 * 
 * These tests cover the functionality of the ICP ledger API, which provides
 * a wrapper around the ICP ledger canister's transfer function.
 * 
 * Mocks:
 * - getIcpLedgerActor: To provide a mock ICP ledger actor.
 * - authStore: To control the authenticated principal for caching tests.
 * 
 * Test Focus:
 * - Correct invocation of the actor's transfer method.
 * - Proper passing of TransferArgs.
 * - Actor caching based on the user's principal.
 * - Handling of transfer results (both success and error).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getIcpLedgerActor } from '$lib/actors/actor.icp.ledger';
import { authStore } from '@stores/auth.store';
import { get } from 'svelte/store';
import * as icpLedgerApi from './icp.ledger.api';
import { Principal } from '@dfinity/principal';
import type { TransferArgs, TransferResult } from '@dfinity/ledger-icp/dist/candid/ledger.d.ts';
import { AccountIdentifier } from '@dfinity/ledger-icp';

// Mock dependencies
vi.mock('$lib/actors/actor.icp.ledger', () => ({
    getIcpLedgerActor: vi.fn()
}));

vi.mock('svelte/store', () => ({
    get: vi.fn()
}));

vi.mock('@stores/auth.store', () => ({
    authStore: { subscribe: vi.fn() }
}));

describe('ICP Ledger API', () => {
    const mockPrincipal = Principal.fromText('2vxsx-fae');

    // Mock actor's transfer method
    const mockTransfer = vi.fn();

    const mockActor = {
        transfer: mockTransfer
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (get as any).mockReturnValue({ principal: mockPrincipal });
        (getIcpLedgerActor as any).mockResolvedValue(mockActor);
        icpLedgerApi._resetIcpLedgerCanisterForTesting(); // Reset cache
    });

    /**
     * Tests for the transferICP function.
     */
    describe('transferICP', () => {
        const toPrincipal = Principal.fromText('rwlgt-iiaaa-aaaaa-aaaaa-cai');
        const toAccount = AccountIdentifier.fromPrincipal({ principal: toPrincipal });
        const amount = { e8s: BigInt(100000000) }; // 1 ICP

        const transferArgs: TransferArgs = {
            to: toAccount.toUint8Array(),
            fee: { e8s: BigInt(10000) },
            memo: BigInt(0),
            from_subaccount: [], // Optional: new Uint8Array([...])
            created_at_time: [], // Optional: { timestamp_nanos: BigInt(Date.now() * 1000000) }
            amount: amount,
        };

        it('should call the actor transfer method with correct arguments', async () => {
            const mockSuccessResult: TransferResult = { Ok: BigInt(123) }; // Example block height
            mockTransfer.mockResolvedValue(mockSuccessResult);

            const result = await icpLedgerApi.transferICP(transferArgs);

            expect(getIcpLedgerActor).toHaveBeenCalledTimes(1);
            expect(mockTransfer).toHaveBeenCalledWith(transferArgs);
            expect(result).toEqual(mockSuccessResult);
        });

        it('should handle error results from the transfer method', async () => {
            const mockErrorResult: TransferResult = {
                Err: { InsufficientFunds: { balance: { e8s: BigInt(5000) } } }
            };
            mockTransfer.mockResolvedValue(mockErrorResult);

            const result = await icpLedgerApi.transferICP(transferArgs);

            expect(mockTransfer).toHaveBeenCalledWith(transferArgs);
            expect(result).toEqual(mockErrorResult);
        });
    });

    /**
     * Tests for the actor caching mechanism.
     */
    describe('caching', () => {
        const toPrincipalForCacheTest = Principal.fromText('ryjl3-tyaaa-aaaaa-aaaba-cai');
        const toAccountForCacheTest = AccountIdentifier.fromPrincipal({ principal: toPrincipalForCacheTest });

        const transferArgs: TransferArgs = {
            to: toAccountForCacheTest.toUint8Array(),
            fee: { e8s: BigInt(10000) },
            memo: BigInt(1),
            from_subaccount: [],
            created_at_time: [],
            amount: { e8s: BigInt(1000000) },
        };

        it('should use cached actor for the same principal', async () => {
            mockTransfer.mockResolvedValue({ Ok: BigInt(1) });
            await icpLedgerApi.transferICP(transferArgs); // First call, populates cache
            await icpLedgerApi.transferICP(transferArgs); // Second call, should use cache

            // getIcpLedgerActor should only be called once due to caching
            expect(getIcpLedgerActor).toHaveBeenCalledTimes(1);
        });

        it('should create a new actor when the principal changes', async () => {
            mockTransfer.mockResolvedValue({ Ok: BigInt(1) });
            await icpLedgerApi.transferICP(transferArgs); // Call with principal1

            // Change principal
            const newPrincipal = Principal.fromText('rrkah-fqaaa-aaaaa-aaaaq-cai');
            (get as any).mockReturnValue({ principal: newPrincipal });
            // Important: Clear the previous mockActor setup for getIcpLedgerActor 
            // if it captures the old principal or ensure the mock factory can handle different principals.
            // For simplicity, we assume getIcpLedgerActor is re-evaluated or the cache key change is sufficient.
            // Resetting the mock for getIcpLedgerActor or the canister instance in the module might be needed for a pure test.
            // However, the current implementation of icpLedgerCanister function should handle this correctly by creating a new instance.

            await icpLedgerApi.transferICP(transferArgs); // Call with principal2

            // getIcpLedgerActor should be called twice (once for each principal)
            expect(getIcpLedgerActor).toHaveBeenCalledTimes(2);
        });
    });
}); 