import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import FlipSelection from './FlipSelection.svelte';

/**
 * Test suite for the FlipSelection component which handles token swapping
 * in the swap interface.
 */
describe('FlipSelection', () => {
	// Test setup variables
	let user: UserEvent;
	let container: HTMLElement;

	// Initial state values
	let from = $state('tokenX');
	let to = $state('tokenY');
	let give = $state('100');
	let get = $state('50');

	// Props with bindings to enable two-way data flow testing
	let bindedProps = {
		get from(): string {
			return from;
		},
		set from(v: string) {
			from = v;
		},
		get to(): string {
			return to;
		},
		set to(v: string) {
			to = v;
		},
		get give(): string {
			return give;
		},
		set give(v: string) {
			give = v;
		},
		get get(): string {
			return get;
		},
		set get(v: string) {
			get = v;
		}
	};

	/**
	 * Set up the testing environment before each test
	 * - Configure user event simulator
	 * - Render the component with bindable props
	 */
	beforeEach(() => {
		user = userEvent.setup();

		const { container: containerElement } = render(FlipSelection, bindedProps);
		container = containerElement;
	});

	/**
	 * Verify the basic rendering of the component
	 * - Should have a button element
	 */
	it('should render the component with flip button', () => {
		const button = screen.getByRole('button');
		expect(button).toBeInTheDocument();
	});

	/**
	 * Verify the icon is correctly rendered
	 * - Should contain the chevron icon with appropriate test ID
	 */
	it('should render the chevron down up icon', () => {
		const icon = screen.getByTestId('flip-icon');
		expect(icon).toBeInTheDocument();
	});

	/**
	 * Test the main functionality of the component
	 * - Should swap the token values (from/to)
	 * - Should swap the amount values (give/get)
	 */
	it('should flip from to to, to to from, give to get and get to give', async () => {
		const button = screen.getByRole('button');
		await user.click(button);

		expect(from).toBe('tokenY');
		expect(to).toBe('tokenX');
		expect(give).toBe('50');
		expect(get).toBe('100');
	});

	/**
	 * Test the animation state of the flip button
	 * - Initially no animation class
	 * - Add animation class on first click
	 * - Remove animation class on second click
	 */
	it('should apply the flip animation class when button is clicked', async () => {
		const button = screen.getByRole('button');

		// Initially, the button should not have the open class
		expect(button).not.toHaveClass('open');

		// Click the button to trigger the flip animation
		await user.click(button);

		// After clicking, the button should have the open class
		expect(button).toHaveClass('open');

		// Click again to flip back
		await user.click(button);

		// The open class should be removed
		expect(button).not.toHaveClass('open');
	});
});
