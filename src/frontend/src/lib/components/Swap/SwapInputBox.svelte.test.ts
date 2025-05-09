import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import SwapInputBox from './SwapInputBox.svelte';
import { balances } from '@states/ledger-balance.svelte';
import { getFee } from '@utils/icrc-ledger.utils';
import { LedgerMetadata } from '@states/ledger-metadata.svelte';
import { flushSync } from 'svelte';

// Mock the functions
// vi.mock('@utils/fromat.utils', () => ({
// 	formatUsdValue: vi.fn()
// }));
vi.mock('@utils/icrc-ledger.utils', () => ({
	getFee: vi.fn().mockReturnValue(0.0001)
}));

// Mock the functions
vi.mock('@states/ledger-balance.svelte', () => ({
	balances: {
		tokenX: {
			number: 100,
			format: '100'
		},
		tokenY: {
			number: 132121,
			format: "132'121"
		}
	}
}));

// Mock the LedgerMetadata
vi.mock('@states/ledger-metadata.svelte', () => ({
	LedgerMetadata: {
		tokenX: {
			name: 'Token X',
			symbol: 'TKNX',
			decimals: 8,
			fee: 10000,
			logo: 'https://picsum.photos/200'
		},
		tokenY: {
			name: 'Token Y',
			symbol: 'TKNY',
			decimals: 6,
			fee: 10000,
			logo: 'https://picsum.photos/200'
		}
	}
}));

// Mock the price
vi.mock('@states/tokens-price.svelte', () => ({
	price: {
		tokenX: 2.5,
		tokenY: 0.03
	}
}));

describe('SwapInputBox', () => {
	let user: UserEvent;

	let value = $state('0');
	let ledgerId = $state('tokenX');
	let disabled = $state(false);
	let oninput = $state(undefined);
	let maxOn = $state(false);
	let valueDiff = $state(undefined);

	let props = {
		get value(): string {
			return value;
		},

		set value(v: string) {
			value = v;
		},
		get ledgerId(): string {
			return ledgerId;
		},
		set ledgerId(v: string) {
			ledgerId = v;
		},
		get disabled(): boolean {
			return disabled;
		},
		set disabled(v: boolean) {
			disabled = v;
		}
	};

	beforeEach(() => {
		user = userEvent.setup();
		vi.clearAllMocks();
	});

	afterEach(() => {
		value = '0';
		ledgerId = 'tokenX';
		disabled = false;
		oninput = undefined;
		maxOn = false;
		valueDiff = undefined;

		balances.tokenX = {
			number: 100,
			format: '100'
		};
		balances.tokenY = {
			number: 132121,
			format: "132'121"
		};
	});

	it('should render the component', () => {
		render(SwapInputBox, props);
		expect(screen.getByRole('textbox')).toBeInTheDocument();
	});

	describe('input', () => {
		it('should have initial value 0', () => {
			render(SwapInputBox, props);

			const input = screen.getByRole('textbox');

			expect(input).toHaveValue('0');
		});

		it('should update the value when the input changes', async () => {
			render(SwapInputBox, props);
			const input = screen.getByRole('textbox');
			await user.type(input, '50');
			expect(value).toBe('50');
		});

		it('should disable the input when the disabled prop is true', () => {
			props.disabled = true;
			render(SwapInputBox, props);
			const input = screen.getByRole('textbox');
			expect(input).toBeDisabled();
		});
		it('should call the oninput component event prop when the input changes', async () => {
			const oninput = vi.fn();

			render(SwapInputBox, { ...props, oninput });
			const input = screen.getByRole('textbox');
			await user.type(input, '50');
			expect(oninput).toHaveBeenCalled();
		});
	});

	describe('max', () => {
		it('should not render the max button when the balance is less than 2 * fee', () => {
			// mock tokenX balance to 0
			balances.tokenX = {
				number: 0,
				format: '0'
			};
			render(SwapInputBox, { ...props, maxOn: true });
			const maxButton = screen.queryByRole('button', { name: 'Max' });
			expect(maxButton).not.toBeInTheDocument();

			// mock tokenX balance to 0.0002 (fee = 0.0001)
			balances.tokenX = {
				number: 0.0002,
				format: '0.0002'
			};
			expect(screen.queryByRole('button', { name: 'Max' })).not.toBeInTheDocument();
		});

		it('should not render the max button when maxOn is false', () => {
			render(SwapInputBox, { ...props, maxOn: false });
			const maxButton = screen.queryByRole('button', { name: 'Max' });
			expect(maxButton).not.toBeInTheDocument();
		});

		it('should render the max button when the balance is greater than 2 * fee and maxOn is true', () => {
			// Mock getFee to return a small value
			vi.mocked(getFee).mockReturnValue(0.0001);

			render(SwapInputBox, { ...props, maxOn: true });
			const maxButton = screen.getByRole('button', { name: 'Max' });
			expect(maxButton).toBeInTheDocument();
		});

		it('should update the value when the max button is clicked. value should be balance - 2 * fee', async () => {
			// Mock getFee to return a small value
			vi.mocked(getFee).mockReturnValue(0.0001);

			render(SwapInputBox, { ...props, maxOn: true });
			const maxButton = screen.getByRole('button', { name: 'Max' });

			await user.click(maxButton);

			expect(balances.tokenX.number).toBe(100);

			const input = screen.getByRole('textbox');
			expect(input).toHaveValue('99.9998');
		});
	});

	it('should display the USD equivalent value of the token amount in the input box', async () => {
		// Render the component
		render(SwapInputBox, { ...props });

		// Check if the USD value is displayed correctly
		// For tokenX with price 2.5 and value '0', the formatted USD value should be visible
		const valueText = screen.getByText('Value:');
		expect(valueText).toBeInTheDocument();
		expect(valueText.nextElementSibling).toHaveTextContent('$0');

		// Change the input value
		const input = screen.getByRole('textbox');
		await user.type(input, '100');

		// USD value should update
		expect(screen.getByText('$250')).toBeInTheDocument();

		// Change the input value
		await user.clear(input);
		await user.type(input, '0.01');

		// USD value should update
		expect(screen.getByText('$0.025')).toBeInTheDocument();
	});

	it('should render valueDiff when valueDiff prop is provided', () => {
		render(SwapInputBox, { ...props, valueDiff: 10 });
		expect(screen.getByText('(10%)')).toBeInTheDocument();
	});

	describe('Available', () => {
		it('should render the available balance when condition are met', () => {
			render(SwapInputBox, props);

			const availableElement = screen.getByText('Available:');
			expect(availableElement).toBeInTheDocument();
			expect(availableElement.nextElementSibling).toHaveTextContent('100 TKNX');
		});

		it('should not render if balance format is not available', () => {
			balances.tokenX = {
				number: 100,
				format: ''
			};
			render(SwapInputBox, props);

			const availableElement = screen.queryByText('Available:');
			expect(availableElement).not.toBeInTheDocument();
		});

		// @ts-nocheck
		it('should not render if metadata is not available', () => {
			LedgerMetadata.tokenX = {
				name: 'Token X',
				symbol: '',
				decimals: 8,
				fee: 10000,
				logo: 'https://picsum.photos/200'
			};
			render(SwapInputBox, props);

			const availableElement = screen.queryByText('Available:');
			expect(availableElement).not.toBeInTheDocument();
		});
	});

	describe('Effect rune', () => {
		let value = $state('0');
		let metadata = {
			name: 'Token X',
			symbol: 'TKNX',
			decimals: 8,
			fee: 10000,
			logo: 'https://picsum.photos/200'
		};

		$effect.root(() => {
			$effect(() => {
				let valueTemp = value.replace(/[^0-9.]/g, '');

				// Remove leading zero if it's followed by a non-decimal digit
				if (valueTemp.length > 1 && valueTemp.startsWith('0') && valueTemp[1] !== '.') {
					valueTemp = valueTemp.substring(1);
				}

				const parts = valueTemp.split('.');
				if (parts.length > 2) {
					valueTemp = `${parts[0]}.${parts[1]}`;
				}

				if (parts[1]?.length > metadata?.decimals) {
					valueTemp = `${parts[0]}.${parts[1].slice(0, metadata?.decimals)}`;
				}

				value = valueTemp;
			});
		});

		it('should remove non-numeric characters', () => {
			value = 'abc123xyz';
			flushSync();
			expect(value).toBe('123');
		});

		it('should keep decimal points', () => {
			value = '123.456';
			flushSync();
			expect(value).toBe('123.456');
		});

		it('should remove leading zero when followed by non-decimal digit', () => {
			value = '0123';
			flushSync();
			expect(value).toBe('123');
		});

		it('should keep leading zero when followed by decimal point', () => {
			value = '0.123';
			flushSync();
			expect(value).toBe('0.123');
		});

		it('should limit to one decimal point', () => {
			value = '123.456.789';
			flushSync();
			expect(value).toBe('123.456');
		});

		it('should limit decimal places to metadata.decimals (8)', () => {
			value = '123.123456789';
			flushSync();
			expect(value).toBe('123.12345678');
		});

		it('should handle multiple input validations together', () => {
			value = 'abc0123.456.789xyz';
			flushSync();
			expect(value).toBe('123.456');
		});
	});
});
