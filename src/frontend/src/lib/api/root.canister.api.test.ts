/**
 * Tests for the Root Canister API functions
 * 
 * These tests verify the correct functionality of the Root Canister API layer,
 * which provides a wrapper around the Root Canister functions.
 * 
 * We mock:
 * - The actor provider function (getRootCanister)
 * - Svelte store for authentication (authStore)
 * 
 * Testing focuses on:
 * - Actor caching mechanism
 * - API method functionality
 * - Parameter transformation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getRootCanister } from '$lib/actors/actor.root-canister';
import { authStore } from '@stores/auth.store';
import { get } from 'svelte/store';
import * as rootCanisterApi from './root.canister.api';
import { Principal } from '@dfinity/principal';

// Mock dependencies
vi.mock('$lib/actors/actor.root-canister', () => ({
    getRootCanister: vi.fn()
}));

vi.mock('svelte/store', () => ({
    get: vi.fn()
}));

vi.mock('@stores/auth.store', () => ({
    authStore: { subscribe: vi.fn() }
}));

describe('Root Canister API', () => {
    // Common test data
    const mockPrincipal = { toString: () => 'test-principal' };

    // Mock actor methods
    const mockGetEmailPermission = vi.fn();
    const mockInsertEmail = vi.fn();

    // Mock actor with all required methods
    const mockActor = {
        get_email_permission: mockGetEmailPermission,
        insert_email: mockInsertEmail
    };

    beforeEach(() => {
        // Reset all mocks before each test
        vi.clearAllMocks();

        // Setup auth store mock to return a principal
        (get as any).mockReturnValue({ principal: mockPrincipal });

        // Setup actor provider mock to return our mock actor
        (getRootCanister as any).mockResolvedValue(mockActor);
    });

    /**
     * Tests for getEmailPermission function
     * 
     * Validates that:
     * - The getEmailPermission function correctly calls the Root Canister actor
     * - Response is properly returned
     */
    describe('getEmailPermission', () => {
        it('should call get_email_permission and return the result', async () => {
            // Setup mock response
            const mockPermission = [{ email: 'user@example.com', created_at: BigInt(1639858800000000000) }];
            mockGetEmailPermission.mockResolvedValue(mockPermission);

            // Execute function
            const result = await rootCanisterApi.getEmailPermission();

            // Verify actor method was called and returned correct data
            expect(mockGetEmailPermission).toHaveBeenCalled();
            expect(result).toBe(mockPermission);
        });

        it('should return empty array when no permission exists', async () => {
            // Setup mock response for no permission
            mockGetEmailPermission.mockResolvedValue([]);

            // Execute function
            const result = await rootCanisterApi.getEmailPermission();

            // Verify empty array is returned
            expect(result).toEqual([]);
        });
    });

    /**
     * Tests for insertEmail function
     * 
     * Validates that:
     * - The insertEmail function correctly calls the Root Canister actor
     * - Email parameter is properly handled (both provided and not provided)
     * - Response is properly returned
     */
    describe('insertEmail', () => {
        it('should call insert_email with email when provided', async () => {
            // Setup mock response
            const mockResponse = { ok: null };
            mockInsertEmail.mockResolvedValue(mockResponse);

            // Test email
            const email = 'test@example.com';

            // Execute function
            const result = await rootCanisterApi.insertEmail(email);

            // Verify actor method was called with correct parameters
            expect(mockInsertEmail).toHaveBeenCalledWith([email]);
            expect(result).toBe(mockResponse);
        });

        it('should call insert_email with empty array when email not provided', async () => {
            // Setup mock response
            const mockResponse = { ok: null };
            mockInsertEmail.mockResolvedValue(mockResponse);

            // Execute function without email
            const result = await rootCanisterApi.insertEmail();

            // Verify actor method was called with empty array
            expect(mockInsertEmail).toHaveBeenCalledWith([]);
            expect(result).toBe(mockResponse);
        });

        it('should handle error response from the canister', async () => {
            // Setup error response
            const errorResponse = { err: { EmailAlreadyExists: null } };
            mockInsertEmail.mockResolvedValue(errorResponse);

            // Execute function
            const result = await rootCanisterApi.insertEmail('existing@example.com');

            // Verify error is properly returned
            expect(result).toBe(errorResponse);
        });
    });

    /**
     * Tests for actor caching mechanism
     * 
     * Validates that:
     * - Actors are cached for the same principal
     * - New actors are created for different principals
     */
    describe('caching', () => {
        it('should use cached actor for same principal', async () => {
            // First call creates and caches the actor
            await rootCanisterApi.getEmailPermission();

            // Second call should use the cached actor
            await rootCanisterApi.getEmailPermission();

            // Should be called only once because the actor is reused
            expect(getRootCanister).toHaveBeenCalledTimes(1);
        });

        it('should create new actor when auth principal changes', async () => {
            // First call with principal1
            (get as any).mockReturnValue({ principal: { toString: () => 'principal1' } });

            await rootCanisterApi.getEmailPermission();

            // Change the principal
            (get as any).mockReturnValue({ principal: { toString: () => 'principal2' } });

            // Second call with different principal
            await rootCanisterApi.getEmailPermission();

            // Should be called twice because different principals create different cache keys
            expect(getRootCanister).toHaveBeenCalledTimes(2);
        });
    });
}); 