/**
 * @fileoverview
 * This file contains tests for the device utility functions defined in `device.utils.ts`.
 * It specifically tests the `runOnDesktopExceptSafari` function to ensure it executes
 * the callback only under the intended conditions (non-mobile, non-Safari desktop).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { runOnDesktopExceptSafari } from './device.utils';

// Store original objects to restore later
const originalNavigator = global.navigator;
const originalWindow = global.window;

// Helper to set up mocks
const setupMocks = (userAgent: string, innerWidth: number) => {
    Object.defineProperty(global, 'navigator', {
        value: { userAgent },
        writable: true,
        configurable: true
    });
    Object.defineProperty(global, 'window', {
        value: { ...originalWindow, innerWidth }, // Keep other window props if needed
        writable: true,
        configurable: true
    });
};

describe('device.utils', () => {
    let mockCallback: ReturnType<typeof vi.fn>;
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        // Reset callback mock and console spy before each test
        mockCallback = vi.fn();
        consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { }); // Suppress console output
    });

    afterEach(() => {
        // Restore original objects and clear mocks
        Object.defineProperty(global, 'navigator', {
            value: originalNavigator,
            writable: true,
            configurable: true
        });
        Object.defineProperty(global, 'window', {
            value: originalWindow,
            writable: true,
            configurable: true
        });
        vi.clearAllMocks();
        consoleErrorSpy.mockRestore();
    });

    describe('runOnDesktopExceptSafari', () => {
        it('should run callback on desktop Chrome with sufficient width', async () => {
            const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
            const innerWidth = 1024;
            setupMocks(userAgent, innerWidth);

            await runOnDesktopExceptSafari(mockCallback);

            expect(mockCallback).toHaveBeenCalledTimes(1);
        });

        it('should run callback on desktop Firefox with sufficient width', async () => {
            const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0';
            const innerWidth = 1024;
            setupMocks(userAgent, innerWidth);

            await runOnDesktopExceptSafari(mockCallback);

            expect(mockCallback).toHaveBeenCalledTimes(1);
        });

        it('should NOT run callback on desktop Safari with sufficient width', async () => {
            const userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15';
            const innerWidth = 1024;
            setupMocks(userAgent, innerWidth);

            await runOnDesktopExceptSafari(mockCallback);

            expect(mockCallback).not.toHaveBeenCalled();
        });

        it('should NOT run callback on mobile device (iPhone)', async () => {
            const userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.1 Mobile/15E148 Safari/604.1';
            const innerWidth = 375; // Typical mobile width
            setupMocks(userAgent, innerWidth);

            await runOnDesktopExceptSafari(mockCallback);

            expect(mockCallback).not.toHaveBeenCalled();
        });

        it('should NOT run callback on mobile device (Android)', async () => {
            const userAgent = 'Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.106 Mobile Safari/537.36';
            const innerWidth = 412; // Typical mobile width
            setupMocks(userAgent, innerWidth);

            await runOnDesktopExceptSafari(mockCallback);

            expect(mockCallback).not.toHaveBeenCalled();
        });

        it('should NOT run callback on desktop Chrome with insufficient width', async () => {
            const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
            const innerWidth = 768; // Exactly the threshold, should not run (> 768 is required)
            setupMocks(userAgent, innerWidth);

            await runOnDesktopExceptSafari(mockCallback);

            expect(mockCallback).not.toHaveBeenCalled();

            // Test just below threshold too
            setupMocks(userAgent, 760);
            await runOnDesktopExceptSafari(mockCallback);
            expect(mockCallback).not.toHaveBeenCalled();
        });

        it('should catch and log errors thrown by the callback', async () => {
            const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
            const innerWidth = 1024;
            const testError = new Error('Callback failed');
            mockCallback.mockRejectedValueOnce(testError); // Make the callback throw an error
            setupMocks(userAgent, innerWidth);


            await runOnDesktopExceptSafari(mockCallback);

            expect(mockCallback).toHaveBeenCalledTimes(1); // Callback was still called
            expect(console.error).toHaveBeenCalledTimes(1);
            expect(console.error).toHaveBeenCalledWith('Error in desktop callback:', testError);

        });

        it('should handle synchronous callbacks', async () => {
            const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
            const innerWidth = 1024;
            const syncCallback = vi.fn(() => { /* do nothing sync */ });
            setupMocks(userAgent, innerWidth);

            await runOnDesktopExceptSafari(syncCallback);

            expect(syncCallback).toHaveBeenCalledTimes(1);
        });

        it('should handle synchronous callbacks that throw errors', async () => {
            const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
            const innerWidth = 1024;
            const testError = new Error('Sync Callback failed');
            const syncCallbackThrows = vi.fn(() => { throw testError; });
            setupMocks(userAgent, innerWidth);

            // Since the error is sync, await might not be needed, but the function is async
            await runOnDesktopExceptSafari(syncCallbackThrows);

            expect(syncCallbackThrows).toHaveBeenCalledTimes(1); // Callback was called
            expect(console.error).toHaveBeenCalledTimes(1);
            expect(console.error).toHaveBeenCalledWith('Error in desktop callback:', testError);
        });
    });
}); 