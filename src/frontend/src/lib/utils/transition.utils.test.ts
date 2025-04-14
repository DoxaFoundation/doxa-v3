/**
 * @fileoverview
 * This file contains tests for the Svelte custom transition function `flip`
 * defined in `transition.utils.ts`. It tests the structure of the returned
 * transition object and the output of its CSS function.
 */

import { describe, it, expect, vi } from 'vitest';
import { flip } from './transition.utils';
import { cubicOut } from 'svelte/easing'; // Import the default easing function

// Mock HTMLElement - we don't need actual DOM manipulation for these tests
const mockNode = {} as HTMLElement;

describe('transition.utils', () => {
    describe('flip', () => {
        it('should return a transition object with default options', () => {
            const transition = flip(mockNode, {}); // Call with empty options

            expect(transition).toBeDefined();
            expect(transition.duration).toBe(400);
            expect(transition.delay).toBe(0);
            expect(transition.easing).toBe(cubicOut);
            expect(typeof transition.css).toBe('function');
        });

        it('should return a transition object with custom options', () => {
            const customEasing = (t: number) => t; // Linear easing
            const options = {
                duration: 1000,
                delay: 500,
                easing: customEasing,
                axis: 'y'
            };
            const transition = flip(mockNode, options);

            expect(transition.duration).toBe(options.duration);
            expect(transition.delay).toBe(options.delay);
            expect(transition.easing).toBe(options.easing);
            expect(typeof transition.css).toBe('function');
            // We'll test the axis effect within the css function tests
        });

        describe('css function (axis=x default)', () => {
            const transition = flip(mockNode, { axis: 'x' }); // Explicitly X or default

            it('should return correct CSS for t=0', () => {
                const t = 0;
                const rotation = (1 - t) * 180; // 180
                const expectedCss = `
        transform: rotateX(${rotation}deg);
        opacity: ${t};
      `;
                expect(transition.css(t)).toBe(expectedCss);
            });

            it('should return correct CSS for t=0.5', () => {
                const t = 0.5;
                const rotation = (1 - t) * 180; // 90
                const expectedCss = `
        transform: rotateX(${rotation}deg);
        opacity: ${t};
      `;
                expect(transition.css(t)).toBe(expectedCss);
            });

            it('should return correct CSS for t=1', () => {
                const t = 1;
                const rotation = (1 - t) * 180; // 0
                const expectedCss = `
        transform: rotateX(${rotation}deg);
        opacity: ${t};
      `;
                expect(transition.css(t)).toBe(expectedCss);
            });
        });

        describe('css function (axis=y)', () => {
            const transition = flip(mockNode, { axis: 'y' });

            it('should return correct CSS for t=0', () => {
                const t = 0;
                const rotation = (1 - t) * 180; // 180
                const expectedCss = `
        transform: rotateY(${rotation}deg);
        opacity: ${t};
      `;
                expect(transition.css(t)).toBe(expectedCss);
            });

            it('should return correct CSS for t=0.5', () => {
                const t = 0.5;
                const rotation = (1 - t) * 180; // 90
                const expectedCss = `
        transform: rotateY(${rotation}deg);
        opacity: ${t};
      `;
                expect(transition.css(t)).toBe(expectedCss);
            });

            it('should return correct CSS for t=1', () => {
                const t = 1;
                const rotation = (1 - t) * 180; // 0
                const expectedCss = `
        transform: rotateY(${rotation}deg);
        opacity: ${t};
      `;
                expect(transition.css(t)).toBe(expectedCss);
            });
        });
    });
}); 