/**
 * @fileoverview
 * This file contains tests for the email service functions defined in `email.service.ts`.
 * 
 * Purpose:
 * - Tests for checking email permission status
 * - Validates functionality for allowing/denying email permissions
 * - Handles responses from backend services properly
 * - Verifies user interactions for email permissions
 * - Tests UI feedback through toast notifications
 * - Validates error handling
 * - Verifies root canister API calls
 * - Tests transitions between email permission states (Allow/Deny/Not Asked)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isEmailPermissionAsked, allowOrDenyEmailPermission } from './email.service';
import { getEmailPermission, insertEmail } from '$lib/api/root.canister.api';
import { toast } from 'svelte-sonner';

// Mock dependencies - these are mock functions we'll use for testing
vi.mock('$lib/api/root.canister.api', () => ({
    getEmailPermission: vi.fn().mockImplementation(() => Promise.resolve([])),
    insertEmail: vi.fn().mockImplementation(async (emailArg: string | undefined) => {
        if (typeof emailArg === 'string') {
            if (emailArg.trim() === '') {
                return { err: "Already provided" };
            }
            return { ok: undefined };
        } else if (emailArg === undefined || emailArg === null) {
            return { ok: undefined };
        } else {
            return { err: "Already provided" };
        }
    })
}));

vi.mock('svelte-sonner', () => ({
    toast: {
        success: vi.fn(), // Mock for showing success toasts
        error: vi.fn() // Mock for showing error toasts
    }
}));

describe('email.service', () => {
    beforeEach(() => {
        vi.clearAllMocks(); // Clear all mocks before each test
    });

    // Tests for checking email permission status
    describe('isEmailPermissionAsked', () => {
        it('should return true when user has allowed permission', async () => {
            // Mock that backend returns Allow response
            const mockGetEmailPermission = vi.fn().mockResolvedValue([{ Allow: {} }]);
            vi.mocked(getEmailPermission).mockImplementation(mockGetEmailPermission);

            const result = await isEmailPermissionAsked();

            // Verify function was called and returned true
            expect(getEmailPermission).toHaveBeenCalled();
            expect(result).toBe(true);
        });

        it('should return true when permission was denied (since it was still asked)', async () => {
            // Mock that backend returns Deny response
            const mockGetEmailPermission = vi.fn().mockResolvedValue([{ Deny: {} }]);
            vi.mocked(getEmailPermission).mockImplementation(mockGetEmailPermission);

            const result = await isEmailPermissionAsked();

            expect(getEmailPermission).toHaveBeenCalled();
            expect(result).toBe(true);
        });

        it('should return false when permission has not been asked yet', async () => {
            // Mock that backend returns null response
            const mockGetEmailPermission = vi.fn().mockResolvedValue([null]);
            vi.mocked(getEmailPermission).mockImplementation(mockGetEmailPermission);

            const result = await isEmailPermissionAsked();

            expect(getEmailPermission).toHaveBeenCalled();
            expect(result).toBe(false);
        });
    });

    // Tests for allowing/denying email permissions
    describe('allowOrDenyEmailPermission', () => {
        it('should successfully insert email and return success', async () => {
            // Mock successful backend response
            const mockInsertEmail = vi.fn().mockResolvedValue({ ok: {} });
            vi.mocked(insertEmail).mockImplementation(mockInsertEmail);
            const email = 'test@example.com';

            const result = await allowOrDenyEmailPermission(email);

            // Verify email was inserted, success toast shown, and success returned
            expect(insertEmail).toHaveBeenCalledWith(email);
            expect(toast.success).toHaveBeenCalledWith('You have joined our mailing list.');
            expect(result).toEqual({ success: true });
        });

        it('should work even when no email is provided', async () => {
            const mockInsertEmail = vi.fn().mockResolvedValue({ ok: {} });
            vi.mocked(insertEmail).mockImplementation(mockInsertEmail);

            const result = await allowOrDenyEmailPermission();

            expect(insertEmail).toHaveBeenCalledWith(undefined);
            expect(toast.success).toHaveBeenCalledWith('You have joined our mailing list.');
            expect(result).toEqual({ success: true });
        });

        it('should handle error response from backend', async () => {
            // Mock error response from backend
            const mockInsertEmail = vi.fn().mockResolvedValue({ err: 'Invalid email' });
            vi.mocked(insertEmail).mockImplementation(mockInsertEmail);
            const email = 'test@example.com';

            const result = await allowOrDenyEmailPermission(email);

            // Verify error toast shown and false returned
            expect(insertEmail).toHaveBeenCalledWith(email);
            expect(toast.error).toHaveBeenCalledWith('Failed to provide email. Invalid email');
            expect(result).toEqual({ success: false });
        });

        it('should handle exceptions properly', async () => {
            // Mock network error
            const error = new Error('Network error');
            const mockInsertEmail = vi.fn().mockRejectedValue(error);
            vi.mocked(insertEmail).mockImplementation(mockInsertEmail);
            const email = 'test@example.com';

            const result = await allowOrDenyEmailPermission(email);

            // Verify error toast shown and false returned
            expect(insertEmail).toHaveBeenCalledWith(email);
            expect(toast.error).toHaveBeenCalledWith('Failed to provide email');
            expect(result).toEqual({ success: false });
        });
    });
});