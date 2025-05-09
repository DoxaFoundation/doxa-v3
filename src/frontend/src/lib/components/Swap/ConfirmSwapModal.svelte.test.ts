import { render, fireEvent, screen } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ConfirmSwapModal from './ConfirmSwapModal.svelte';
import { getRateQuote } from '@services/swap.service';
import { LedgerMetadata } from '@states/ledger-metadata.svelte';
import { price } from '@states/tokens-price.svelte';
import { getFee } from '@utils/icrc-ledger.utils';

// Mock the external dependencies
vi.mock('@services/swap.service', () => ({
	getRateQuote: vi.fn()
}));

vi.mock('@utils/icrc-ledger.utils', () => ({
	getFee: vi.fn().mockReturnValue(0.0001)
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
		tokenX: 1.5,
		tokenY: 0.75
	}
}));

// Mock the utility functions
vi.mock('@utils/icrc-ledger.utils', () => ({
	getFee: vi.fn().mockReturnValue(0.001)
}));

describe('ConfirmSwapModal', () => {
	const mockProps = {
		open: true,
		from: 'tokenX',
		to: 'tokenY',
		give: '10',
		get: '19.8',
		slippage: '0.5',
		onclick: vi.fn()
	};

	beforeEach(() => {
		vi.clearAllMocks();
		(getRateQuote as any).mockResolvedValue(1.9);
	});

	it('should not render the modal when the open prop is false', () => {
		render(ConfirmSwapModal, { ...mockProps, open: false });
		const modal = screen.queryByRole('dialog');
		expect(modal).not.toBeInTheDocument();
	});

	it('should render the modal when the open prop is true', () => {
		render(ConfirmSwapModal, mockProps);
		const modal = screen.getByRole('dialog');
		expect(modal).toBeInTheDocument();
	});

	it('should render the title', () => {
		render(ConfirmSwapModal, mockProps);
		const title = screen.getByRole('heading', { name: 'Confirm Swap' });
		expect(title).toBeInTheDocument();
	});

	it("should render the Swap FROM token's amount, logo and USD value", () => {
		render(ConfirmSwapModal, mockProps);

		const fromAmount = screen.getByText('10 TKNX');
		const fromLogo = screen.getByAltText('TKNX');

		const giveUsdValue = screen.getByText('$15');

		expect(fromLogo).toBeInTheDocument();
		expect(screen.getByText('You Give')).toBeInTheDocument();
		expect(giveUsdValue).toBeInTheDocument();
		expect(fromAmount).toBeInTheDocument();
	});

	it("should render the Swap TO token's amount, logo and USD value", () => {
		render(ConfirmSwapModal, mockProps);

		const toAmount = screen.getByText('19.8 TKNY');
		const toLogo = screen.getByAltText('TKNY');

		const getUsdValue = screen.getByText('$14.85');

		expect(toLogo).toBeInTheDocument();
		expect(screen.getByText('You Get')).toBeInTheDocument();
		expect(getUsdValue).toBeInTheDocument();
		expect(toAmount).toBeInTheDocument();
	});

	it('should render the price', async () => {
		// mock the getRateQuote
		vi.mocked(getRateQuote).mockResolvedValue(1.9);

		render(ConfirmSwapModal, mockProps);

		// Wait for the effect to complete and rate to be updated
		await vi.waitFor(() => {
			const label = screen.getByText('Price');
			const value = label.nextElementSibling as HTMLElement;

			expect(label).toBeInTheDocument();

			expect(value).toHaveTextContent('1 TKNX = 1.9 TKNY ($1.42)');
		});
	});

	it('should render the liquidity pool fee', async () => {
		// Mock the getFee function to return a consistent value for the test
		vi.mocked(getFee).mockReturnValue(0.0001);

		render(ConfirmSwapModal, mockProps);

		// Wait for the derived value to be updated
		await vi.waitFor(() => {
			const label = screen.getByText('Liquidity pool fee');
			const value = label.nextElementSibling as HTMLElement;

			expect(label).toBeInTheDocument();

			// Calculate expected fee: (give - fee) * 0.3%
			// With mockProps.give = '10' and getFee mocked to return 0.0001
			// (10 - 0.0001) * 0.3% = 0.0299997
			expect(value).toHaveTextContent('0.0299997 TKNX ($0.045)');
		});
	});

	it('should render the slippage tolerance', () => {
		render(ConfirmSwapModal, mockProps);

		const label = screen.getByText('Slippage tolerance');
		const value = label.nextElementSibling as HTMLElement;

		expect(label).toBeInTheDocument();
		expect(value).toHaveTextContent('0.5%');
	});

	it('should render the minimum received', () => {
		render(ConfirmSwapModal, mockProps);

		const label = screen.getByText('Minimum received');
		const value = label.nextElementSibling as HTMLElement;

		expect(label).toBeInTheDocument();
		expect(value).toHaveTextContent('19.701 TKNY ($14.78)');
	});

	it('should render the transfer fees for swap', () => {
		render(ConfirmSwapModal, mockProps);

		const label = screen.getByText('Transfer fees for swap');
		expect(label).toBeInTheDocument();

		const depositFee = screen.getByText('Deposit fee');
		const depositFeeValue = depositFee.nextElementSibling as HTMLElement;

		expect(depositFee).toBeInTheDocument();
		expect(depositFeeValue).toHaveTextContent('0.0002 TKNX');

		const withdrawFee = screen.getByText('Withdraw fee');
		const withdrawFeeValue = withdrawFee.nextElementSibling as HTMLElement;

		expect(withdrawFee).toBeInTheDocument();
		expect(withdrawFeeValue).toHaveTextContent('0.0001 TKNY');
	});

	it('should render the confirm swap button', () => {
		render(ConfirmSwapModal, mockProps);

		const button = screen.getByRole('button', { name: 'Confirm Swap' });
		expect(button).toBeInTheDocument();
	});

	it('should call the onclick prop when the button is clicked', () => {
		render(ConfirmSwapModal, mockProps);

		const button = screen.getByRole('button', { name: 'Confirm Swap' });
		fireEvent.click(button);

		expect(mockProps.onclick).toHaveBeenCalled();
	});
});
