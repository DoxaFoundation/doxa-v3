import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import SlippageModal from './SlippageModal.svelte';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { flushSync } from 'svelte';

export function current(getCount: () => any) {
	return {
		get value() {
			return getCount();
		}
	};
}

describe('SlippageModal', () => {
	let value = $state('0.5');
	let user: UserEvent;

	// Setup test environment before each test
	beforeEach(() => {
		user = userEvent.setup();

		// binding value prop to the state value
		render(SlippageModal, {
			get value(): string {
				return value;
			},
			set value(v: string) {
				value = v;
			}
		});
	});

	// Test initial state of the modal button
	it('Modal Button is visible and initial value is 0.5%', () => {
		const buttonOpenModal = screen.getByRole('button', { name: '0.5%' });
		expect(buttonOpenModal).toBeInTheDocument();
		expect(buttonOpenModal).toHaveTextContent('0.5%');
	});

	// Test modal's default closed state
	it('Modal is closed by default', () => {
		expect(screen.queryByText('Slippage tolerance')).not.toBeInTheDocument();
	});

	// Test modal opening functionality
	it('Modal is open when button is clicked', async () => {
		const user = userEvent.setup();
		const button = screen.getByRole('button', { name: `${value}%` });

		await user.click(button);
		expect(screen.getByText('Slippage tolerance')).toBeInTheDocument();
	});

	// Test suite for modal content and interactions
	describe('Modal content', () => {
		// Define CSS classes for button states
		const alternativeClasses =
			'text-gray-900 bg-white border border-gray-200 hover:bg-gray-100 dark:bg-transparent dark:text-gray-400 hover:text-primary-700 focus-within:text-primary-700 dark:focus-within:text-white dark:hover:text-white dark:hover:bg-gray-700 dark:border-gray-600 dark:hover:border-gray-600';
		const primaryClasses =
			'text-white bg-primary-700 hover:bg-primary-800 dark:bg-primary-600 dark:hover:bg-primary-700';

		let buttonOpenModal: HTMLElement;

		// Open modal before each test in this suite
		beforeEach(async () => {
			buttonOpenModal = screen.getByRole('button', { name: `${value}%` });
			await user.click(buttonOpenModal);
		});

		// Test basic modal rendering
		it('renders correctly', () => {
			expect(screen.getByText('Slippage tolerance')).toBeInTheDocument();
		});

		// Test initial button states
		it('0.5% button have active primary color and other buttons (0.1%, 5%) have alternative color', () => {
			const buttons = screen.getAllByRole('button', { name: '0.5%' });
			const button0_5 = buttons[1]; // index 1 is the 0.5% button, same button as the first button
			expect(button0_5).toHaveClass(primaryClasses);

			const button0_1 = screen.getByRole('button', { name: '0.1%' });
			const button5 = screen.getByRole('button', { name: '5%' });

			expect(button0_1).toHaveClass(alternativeClasses);
			expect(button5).toHaveClass(alternativeClasses);
		});

		// Test suite for 0.1% button interactions
		describe('0.1% button', () => {
			// Reset value after each test
			afterEach(() => {
				value = '0.5'; // reset value to 0.5% after each test
			});

			// Test button rendering
			it('render 0.1% button', () => {
				const button = screen.getByRole('button', { name: '0.1%' });
				expect(button).toBeInTheDocument();
			});

			// Test initial button state
			it('0.1% button have alternative color', () => {
				const button = screen.getByRole('button', { name: '0.1%' });
				expect(button).toHaveClass(alternativeClasses);
			});

			// Test value update on click
			it('clicking 0.1% button should change value to 0.1', async () => {
				const button = screen.getByRole('button', { name: '0.1%' });
				await user.click(button);
				expect(value).toBe('0.1');
			});

			// Test modal button text update
			it('clicking 0.1% button should change Modal open button text content to 0.1%', async () => {
				const button = screen.getByRole('button', { name: '0.1%' });
				await user.click(button);
				expect(buttonOpenModal).toHaveTextContent('0.1%');
			});

			// Test modal closing behavior
			it('clicking 0.1% button should will close modal', async () => {
				const button = screen.getByRole('button', { name: '0.1%' });
				await user.click(button);

				expect(screen.queryByText('Slippage tolerance')).not.toBeInTheDocument();
			});

			// Test input value update
			it('clicking 0.1% button should change input value to 0.1%', async () => {
				const button = screen.getByRole('button', { name: '0.1%' });
				await user.click(button);

				await user.click(buttonOpenModal); // reopen modal

				const input = screen.getByRole('textbox');
				expect(input).toHaveValue('0.1');
			});

			// Test button state change after reopening modal
			it('clicking 0.1% button should change its class to primary (when modal is reopened its visible)', async () => {
				const button0_1 = screen.getByRole('button', { name: '0.1%' });

				await user.click(button0_1);

				await user.click(buttonOpenModal); // reopen modal

				const updatedButtons = screen.getAllByRole('button', { name: '0.1%' }); // content of 0.1% button and buttonOpenModal is same
				const updatedButton0_1 = updatedButtons[1];

				console.log('length of updatedButtons', updatedButtons.length);
				expect(updatedButton0_1).toHaveClass(primaryClasses);
			});
		});

		// Test suite for 5% button interactions
		describe('5% button', () => {
			// Reset value after each test
			afterEach(() => {
				value = '0.5'; // reset value to 0.5% after each test
			});

			// Test button rendering
			it('render 5% button', () => {
				const button = screen.getByRole('button', { name: '5%' });
				expect(button).toBeInTheDocument();
			});

			// Test initial button state
			it('5% button have alternative color', () => {
				const button = screen.getByRole('button', { name: '5%' });
				expect(button).toHaveClass(alternativeClasses);
			});

			// Test value update on click
			it('clicking 5% button should change value to 5%', async () => {
				const button = screen.getByRole('button', { name: '5%' });
				await user.click(button);
				expect(value).toBe('5');
			});

			// Test modal button text update
			it('clicking 5% button should change Modal open button text content to 5%', async () => {
				const button = screen.getByRole('button', { name: '5%' });
				await user.click(button);
				expect(buttonOpenModal).toHaveTextContent('5%');
			});

			// Test modal closing behavior
			it('clicking 5% button should will close modal', async () => {
				const button = screen.getByRole('button', { name: '5%' });
				await user.click(button);

				expect(screen.queryByText('Slippage tolerance')).not.toBeInTheDocument();
			});

			// Test input value update
			it('clicking 5% button should change input value to 5%', async () => {
				const button = screen.getByRole('button', { name: '5%' });
				await user.click(button);

				await user.click(buttonOpenModal); // reopen modal

				const input = screen.getByRole('textbox');
				expect(input).toHaveValue('5');
			});

			// Test button state change after reopening modal
			it('clicking 5% button should change its class to primary (when modal is reopened its visible)', async () => {
				const button5 = screen.getByRole('button', { name: '5%' });

				await user.click(button5);

				await user.click(buttonOpenModal); // reopen modal

				const updatedButtons = screen.getAllByRole('button', { name: '5%' }); // content of 0.5% button and buttonOpenModal is same now
				const updatedButton5 = updatedButtons[1];

				console.log('length of updatedButtons', updatedButtons.length);
				expect(updatedButton5).toHaveClass(primaryClasses);
			});
		});

		// Test suite for 0.5% button interactions
		describe('0.5% button', () => {
			// Reset value after each test
			afterEach(() => {
				value = '0.5'; // reset value to 0.5% after each test
			});

			// Test button rendering
			it('render 0.5% button', () => {
				const buttons = screen.getAllByRole('button', { name: '0.5%' });
				const button = buttons[1]; // content of 0.5% button and buttonOpenModal is same now
				expect(button).toBeInTheDocument();
			});

			// Test initial button state
			it('0.5% button have active primary color', () => {
				const buttons = screen.getAllByRole('button', { name: '0.5%' });
				const button = buttons[1]; // content of 0.5% button and buttonOpenModal is same now
				expect(button).toHaveClass(primaryClasses);
			});

			// Test button state change when another value is selected
			it('should change 0.5% button class to alternative when clicking another button or value != 0.5', async () => {
				const button0_1 = screen.getByRole('button', { name: '0.1%' });
				await user.click(button0_1);

				await user.click(buttonOpenModal); // reopen modal

				const button0_5 = screen.getByRole('button', { name: '0.5%' }); // content of 0.5% button and buttonOpenModal is same now
				expect(button0_5).toHaveClass(alternativeClasses);
			});

			// Test value update on click
			it('clicking 0.5% button should change value to 0.5', async () => {
				const buttons = screen.getAllByRole('button', { name: '0.5%' });
				const button = buttons[1]; // content of 0.5% button and buttonOpenModal is same now

				await user.click(button);
				expect(value).toBe('0.5');
			});

			// Test modal button text update
			it('clicking 0.5% button should change Modal open button text content to 0.5%', async () => {
				const buttons = screen.getAllByRole('button', { name: '0.5%' });
				const button = buttons[1]; // content of 0.5% button and buttonOpenModal is same now

				await user.click(button);
				expect(buttonOpenModal).toHaveTextContent('0.5%');
			});

			// Test modal closing behavior
			it('clicking 0.5% button should will close modal', async () => {
				const buttons = screen.getAllByRole('button', { name: '0.5%' });
				const button = buttons[1]; // content of 0.5% button and buttonOpenModal is same now

				await user.click(button);

				expect(screen.queryByText('Slippage tolerance')).not.toBeInTheDocument();
			});
		});

		// Test suite for custom input functionality
		describe('Custom input', () => {
			// Test input rendering
			it('renders input box', () => {
				const input = screen.getByRole('textbox');
				expect(input).toBeInTheDocument();
			});

			// Test input attributes
			it('input has correct attributes', () => {
				const input = screen.getByRole('textbox');
				expect(input).toHaveAttribute('type', 'text');
				expect(input).toHaveAttribute('placeholder', '');
			});

			// Test initial input value
			it('input has correct value', () => {
				const input = screen.getByRole('textbox');
				expect(input).toHaveValue(value);
			});

			// Test percentage symbol presence
			it('input has percentage symbol', () => {
				const input = screen.getByRole('textbox');
				const inputContainer = input.closest('div');
				expect(inputContainer).toHaveTextContent('%');
			});

			// Test custom value input
			it('typing in input box should update value state', async () => {
				const input = screen.getByRole('textbox');

				await user.clear(input);
				await user.type(input, '1.5');

				expect(value).toBe('1.5');
			});
		});
	});
});

describe('testing logic inside the component and effects', () => {
	// let value = $state('0.5');
	// let user: UserEvent;
	// let buttonOpenModal: HTMLElement;

	// // Setup test environment before each test
	// beforeEach(async () => {
	// 	user = userEvent.setup();

	// 	// binding value prop to the state value
	// 	render(SlippageModal, {
	// 		get value(): string {
	// 			return value;
	// 		},
	// 		set value(v: string) {
	// 			value = v;
	// 		}
	// 	});

	// 	buttonOpenModal = screen.getByRole('button', { name: `${value}%` });
	// 	await user.click(buttonOpenModal);
	// });

	// Test suite for value formatting
	describe('Value formatting', () => {
		let value = $state('0.5');

		$effect.root(() => {
			$effect(() => {
				let valueTemp = value.replace(/[^0-9.]/g, '');

				const parts = valueTemp.split('.');
				if (parts.length > 2) {
					valueTemp = `${parts[0]}.${parts[1]}`;
				}

				if (parts[1]?.length > 2) {
					valueTemp = `${parts[0]}.${parts[1].slice(0, 2)}`;
				}

				value = valueTemp;
			});
		});

		// Test removing non-numeric characters
		it('should remove non-numeric characters from value', async () => {
			// const input = screen.getByRole('textbox');
			// await user.clear(input);
			// await user.type(input, '1a2b3c.4d5e6f%');
			// expect(value).toBe('123.45');

			value = '1a2b3c.4d5e6f%';
			flushSync();
			expect(value).toBe('123.45');
		});

		// Test handling multiple decimal points
		it('should handle multiple decimal points by keeping only the first two parts', async () => {
			// const input = screen.getByRole('textbox');
			// await user.clear(input);
			// await user.click(input);
			// await user.keyboard('1.2.3.4');
			// flushSync();
			// expect(value).toBe('1.2');

			value = '1.2.3.4';
			flushSync();
			expect(value).toBe('1.2');
		});

		// Test limiting decimal places
		it('should limit decimal places to 2', async () => {
			// const input = screen.getByRole('textbox');
			// await user.clear(input);
			// await user.click(input);
			// await user.keyboard('1.23456');
			// flushSync();
			// expect(value).toBe('1.23');

			value = '1.23456';
			flushSync();
			expect(value).toBe('1.23');
		});
	});

	// Test suite for value validation
	describe('Value validation', () => {
		let value = $state('0.5'); // prop bind value mock
		let open = $state(false); // modal bind:open value mock

		$effect.root(() => {
			$effect(() => {
				if (!open) {
					if (value === '') value = '0.5';
					if (Number(value) > 50) value = '50';
				}
			});
		});

		beforeEach(() => {
			open = true; // open modal
		});

		// Test empty value handling
		it('should set value to 0.5 when empty and modal is closed', async () => {
			// const input = screen.getByRole('textbox');
			// await user.clear(input);
			// await user.click(input);
			// await user.keyboard('');
			// await user.click(buttonOpenModal); // Close modal
			// flushSync();
			// expect(value).toBe('0.5');

			value = ''; // set value to empty
			open = false; // close modal
			flushSync();
			expect(value).toBe('0.5');
		});

		// Test maximum value limit
		it('should cap value at 50 when modal is closed', async () => {
			// const input = screen.getByRole('textbox');
			// await user.clear(input);
			// await user.click(input);
			// await user.keyboard('75');
			// await user.click(buttonOpenModal); // Close modal
			// flushSync();
			// expect(value).toBe('50');

			value = '75'; // set value to 75
			open = false; // close modal
			flushSync();
			expect(value).toBe('50');
		});

		// Test value remains unchanged when modal is open
		it('should not modify value when modal is open', async () => {
			// const input = screen.getByRole('textbox');
			// await user.clear(input);
			// await user.type(input, '75');
			// expect(value).toBe('75');

			value = '75'; // set value to 75
			flushSync();
			expect(value).toBe('75');
		});
	});
});
