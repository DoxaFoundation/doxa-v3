import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import SwapSelection from './SwapSelection.svelte';
import { getIcrcLedgerCanisterIds } from '@utils/icrc-ledger.utils';

describe('SwapSelection', () => {
	let user: UserEvent;
	let container: HTMLElement;

	let selected = $state<string>();
	let disableTokenList = $state<string[]>([]);

	const tokens = getIcrcLedgerCanisterIds();

	beforeEach(() => {
		user = userEvent.setup();

		const { container: containerElement } = render(SwapSelection, {
			get selected(): string | undefined {
				return selected;
			},
			set selected(v: string) {
				selected = v;
			},
			get disableTokenList(): string[] {
				return disableTokenList;
			},
			set disableTokenList(v: string[]) {
				disableTokenList = v;
			}
		});

		container = containerElement;
	});

	it('should render the component', () => {
		expect(container).toBeInTheDocument();
	});

	it('button should be in the document', () => {
		expect(container.querySelector('button')).toBeInTheDocument();
	});

	it('should button content be the Select Token', () => {
		const button = screen.getByRole('button', { name: 'Select Token' });
		expect(button).toHaveTextContent('Select Token');
	});

	it('render chevron down icon', () => {
		const chevronDownIcon = screen.getByTestId('chevron-down-icon');
		expect(chevronDownIcon).toBeInTheDocument();
	});

	it('should not render the modal when the component is rendered', () => {
		const modal = screen.queryByRole('dialog', { name: 'Token Selection' });
		expect(modal).not.toBeInTheDocument();
	});

	describe('Modal', () => {
		let ModalOpenButton: HTMLButtonElement;

		beforeEach(() => {
			selected = undefined;
			disableTokenList = [];
		});

		beforeEach(async () => {
			ModalOpenButton = screen.getByRole('button', { name: 'Select Token' });
			await user.click(ModalOpenButton);
		});

		it('should render the modal', () => {
			const modal = screen.getByRole('dialog');
			expect(modal).toBeInTheDocument();
		});

		it('should render the modal title', () => {
			const title = screen.getByText('Token Selection');
			expect(title).toBeInTheDocument();
		});

		it('should render the modal body', () => {
			const modalBody = screen.getByRole('document');
			expect(modalBody).toBeInTheDocument();
		});

		it('Modal body should have the correct number of buttons', () => {
			const modalBody = screen.getByRole('document');
			const buttons = modalBody.querySelectorAll('button');
			expect(buttons).toHaveLength(tokens.length);
		});

		it('All buttons should be enabled', () => {
			const modalBody = screen.getByRole('document');
			const buttons = modalBody.querySelectorAll('button');
			buttons.forEach((button) => {
				expect(button).toBeEnabled();
			});
		});

		it('should select the token when the button is clicked', async () => {
			const modalBody = screen.getByRole('document');
			const buttons = modalBody.querySelectorAll('button');
			await user.click(buttons[0]);
			expect(selected).toBe(tokens[0]);
		});

		it('should close the modal when the button is clicked', async () => {
			const modalBody = screen.getByRole('document');
			const buttons = modalBody.querySelectorAll('button');
			await user.click(buttons[0]);

			const modal = screen.queryByRole('dialog');
			expect(modal).not.toBeInTheDocument();
		});

		it('selected button will be disabled and other button are enabled', async () => {
			let modalBody = screen.getByRole('document'); // get modal body
			let buttons = modalBody.querySelectorAll('button'); // get buttons in the body

			await user.click(buttons[1]); // select 2nd button and this close the modal

			await user.click(ModalOpenButton); // reopen modal

			modalBody = screen.getByRole('document'); // get newly mounted modal
			buttons = modalBody.querySelectorAll('button'); // get buttons

			// expect selected button 1 is disabled
			expect(buttons[1]).toBeDisabled();

			// others enabled
			buttons.forEach((button, index) => {
				if (index === 1) return; // skip second one

				expect(button).toBeEnabled();
			});
		});
	});

	it('should disable tokens in disableTokenList prop', async () => {
		selected = undefined;
		disableTokenList = [tokens[0], tokens[2]];

		let ModalOpenButton = screen.getByRole('button');
		await user.click(ModalOpenButton);

		let modalBody = screen.getByRole('document'); // get modal body
		let buttons = modalBody.querySelectorAll('button'); // get buttons in the body

		expect(buttons[0]).toBeDisabled();
		expect(buttons[2]).toBeDisabled();

		buttons.forEach((button, index) => {
			if (index === 0 || index === 2) return; // skip

			expect(button).toBeEnabled();
		});
	});
});
