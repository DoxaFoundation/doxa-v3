/**
 * @fileoverview
 * This file contains tests for the event handler utility functions defined in `event-handler.utils.ts`.
 * It tests higher-order functions like `once`, `preventDefault`, and `stopPropagation`
 * to ensure they correctly wrap and modify the behavior of event handler callbacks.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { once, preventDefault, stopPropagation } from './event-handler.utils';

// Helper to create a mock event object
const createMockEvent = <E extends Event>(): E => {
    return {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn()
        // Add other event properties if needed by the handlers being tested
    } as unknown as E; // Cast to E, assuming only these methods are used
};


describe('event-handler.utils', () => {
    let mockCallback: ReturnType<typeof vi.fn>;
    let mockEvent: Event; // Use a generic Event type or more specific if needed

    beforeEach(() => {
        // Reset mocks before each test
        mockCallback = vi.fn();
        // Create a new mock event for each test to isolate calls
        mockEvent = createMockEvent<Event>();
    });

    describe('once', () => {
        it('should call the original function only once', () => {
            const wrappedHandler = once(mockCallback);

            // Call the wrapped handler multiple times
            wrappedHandler(mockEvent);
            wrappedHandler(mockEvent);
            wrappedHandler(mockEvent);

            // Expect the original callback to have been called only once
            expect(mockCallback).toHaveBeenCalledTimes(1);
        });

        it('should pass the event object to the original function on the first call', () => {
            const wrappedHandler = once(mockCallback);

            wrappedHandler(mockEvent);

            // Expect the callback to have been called with the mock event
            expect(mockCallback).toHaveBeenCalledWith(mockEvent);
        });

        it('should maintain the `this` context if called with one', () => {
            const context = { id: 'test-context' };
            const mockCallbackWithContext = vi.fn(function (this: unknown, event: Event) {
                expect(this).toBe(context);
            });
            const wrappedHandler = once(mockCallbackWithContext);

            // Call using .call or .apply to set the context
            wrappedHandler.call(context, mockEvent);

            expect(mockCallbackWithContext).toHaveBeenCalledTimes(1);
            expect(mockCallbackWithContext).toHaveBeenCalledWith(mockEvent);

            // Call again, should not execute mockCallbackWithContext again
            wrappedHandler.call(context, mockEvent);
            expect(mockCallbackWithContext).toHaveBeenCalledTimes(1);
        });
    });

    describe('preventDefault', () => {
        it('should call event.preventDefault()', () => {
            const wrappedHandler = preventDefault(mockCallback);

            wrappedHandler(mockEvent);

            // Expect preventDefault to have been called on the mock event
            expect(mockEvent.preventDefault).toHaveBeenCalledTimes(1);
        });

        it('should call the original function after preventing default', () => {
            const wrappedHandler = preventDefault(mockCallback);

            wrappedHandler(mockEvent);

            // Expect the original callback to have been called
            expect(mockCallback).toHaveBeenCalledTimes(1);
            expect(mockCallback).toHaveBeenCalledWith(mockEvent); // Ensure event is passed
        });

        it('should maintain the `this` context', () => {
            const context = { id: 'prevent-default-context' };
            const mockCallbackWithContext = vi.fn(function (this: unknown, event: Event) {
                expect(this).toBe(context);
            });
            const wrappedHandler = preventDefault(mockCallbackWithContext);

            wrappedHandler.call(context, mockEvent);

            expect(mockEvent.preventDefault).toHaveBeenCalledTimes(1);
            expect(mockCallbackWithContext).toHaveBeenCalledTimes(1);
            expect(mockCallbackWithContext).toHaveBeenCalledWith(mockEvent);
        });
    });

    describe('stopPropagation', () => {
        it('should call event.stopPropagation()', () => {
            const wrappedHandler = stopPropagation(mockCallback);

            wrappedHandler(mockEvent);

            // Expect stopPropagation to have been called on the mock event
            expect(mockEvent.stopPropagation).toHaveBeenCalledTimes(1);
        });

        it('should call the original function after stopping propagation', () => {
            const wrappedHandler = stopPropagation(mockCallback);

            wrappedHandler(mockEvent);

            // Expect the original callback to have been called
            expect(mockCallback).toHaveBeenCalledTimes(1);
            expect(mockCallback).toHaveBeenCalledWith(mockEvent); // Ensure event is passed
        });

        it('should maintain the `this` context', () => {
            const context = { id: 'stop-propagation-context' };
            const mockCallbackWithContext = vi.fn(function (this: unknown, event: Event) {
                expect(this).toBe(context);
            });
            const wrappedHandler = stopPropagation(mockCallbackWithContext);

            wrappedHandler.call(context, mockEvent);

            expect(mockEvent.stopPropagation).toHaveBeenCalledTimes(1);
            expect(mockCallbackWithContext).toHaveBeenCalledTimes(1);
            expect(mockCallbackWithContext).toHaveBeenCalledWith(mockEvent);
        });
    });

    describe('Combining handlers (example)', () => {
        it('should call preventDefault, stopPropagation, and the callback only once', () => {
            // Combine multiple wrappers
            const wrappedHandler = once(stopPropagation(preventDefault(mockCallback)));
            const context = { id: 'combined-context' };

            // Call multiple times
            wrappedHandler.call(context, mockEvent);
            wrappedHandler.call(context, mockEvent); // Second call

            // Check expectations after multiple calls
            expect(mockEvent.preventDefault).toHaveBeenCalledTimes(1);    // Called only on the first execution
            expect(mockEvent.stopPropagation).toHaveBeenCalledTimes(1); // Called only on the first execution
            expect(mockCallback).toHaveBeenCalledTimes(1);              // Called only once
            expect(mockCallback).toHaveBeenCalledWith(mockEvent);       // With the correct event

            // Check context was maintained on the first call
            const mockCallbackWithContext = vi.fn(function (this: unknown, event: Event) {
                expect(this).toBe(context);
            });
            const wrappedHandlerCtx = once(stopPropagation(preventDefault(mockCallbackWithContext)));
            const mockEventCtx = createMockEvent<Event>();
            wrappedHandlerCtx.call(context, mockEventCtx);
            expect(mockCallbackWithContext).toHaveBeenCalledTimes(1);


        });
    });
}); 