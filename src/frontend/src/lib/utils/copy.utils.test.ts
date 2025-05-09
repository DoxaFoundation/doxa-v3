/**
 * @fileoverview
 * This file contains tests for the clipboard utility functions defined in `copy.utils.ts`.
 * It focuses on testing the `copyToClipboard` function, ensuring it interacts correctly
 * with the clipboard API and displays appropriate feedback using toasts.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { toast } from 'svelte-sonner'; // We'll mock this
import { copyToClipboard } from './copy.utils';

// Mock the toast module
vi.mock('svelte-sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn() // Assuming error might be used, good practice to mock it too
        // Add other methods if used by the module under test
    }
}));

// Mock navigator.clipboard API
const mockWriteText = vi.fn();
const originalNavigator = global.navigator;

describe('copy.utils', () => {
    beforeEach(() => {
        // Reset mocks before each test
        vi.clearAllMocks();

        // Setup clipboard mock for each test
        Object.defineProperty(global, 'navigator', {
            value: {
                clipboard: {
                    writeText: mockWriteText
                }
            },
            writable: true, // Allows us to restore it later
            configurable: true // Allows redefining/deleting the property
        });
    });

    afterEach(() => {
        // Restore original navigator object after each test
        Object.defineProperty(global, 'navigator', {
            value: originalNavigator,
            writable: true,
            configurable: true
        });
    });

    describe('copyToClipboard', () => {
        it('should call navigator.clipboard.writeText with the provided content', async () => {
            const testContent = 'Hello, Clipboard!';
            // Make writeText resolve successfully for this test
            mockWriteText.mockResolvedValueOnce(undefined);

            await copyToClipboard(testContent);

            expect(mockWriteText).toHaveBeenCalledTimes(1);
            expect(mockWriteText).toHaveBeenCalledWith(testContent);
        });

        it('should call toast.success when clipboard write is successful', async () => {
            const testContent = 'Success Case';
            // Make writeText resolve successfully
            mockWriteText.mockResolvedValueOnce(undefined);

            await copyToClipboard(testContent);

            // Wait for the promise inside copyToClipboard to resolve
            // Vitest handles promise resolution automatically in most cases,
            // but asserting after the await ensures the then() block has executed.

            expect(toast.success).toHaveBeenCalledTimes(1);
            expect(toast.success).toHaveBeenCalledWith('Copied to clipboard!', expect.any(Object)); // Check message and that options are passed
        });

        it('should call console.error when clipboard write fails', async () => {
            const testContent = 'Failure Case';
            const testError = new Error('Clipboard write failed');
            // Mock console.error to check if it's called
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { }); // Suppress actual console output during test

            // Make writeText reject with an error
            mockWriteText.mockRejectedValueOnce(testError);

            await copyToClipboard(testContent);

            // Ensure the catch block has executed
            // Need a slight delay or promise check if copyToClipboard doesn't return the promise chain directly
            // However, the basic await should cover it if the promise rejection is handled

            expect(console.error).toHaveBeenCalledTimes(1);
            expect(console.error).toHaveBeenCalledWith('Failed to copy text: ', testError);

            // Restore original console.error
            consoleErrorSpy.mockRestore();
        });
    });
}); 