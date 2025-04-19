import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import LabelValuePair from './LabelValuePair.svelte';
import LabelValuePairTest from './LabelValuePair.test.svelte';
import userEvent from '@testing-library/user-event';

describe('LabelValuePair', () => {
	const label = 'Test Label';
	const value = 'Test Value';
	const tip = 'Helpful tooltip';

	describe('Basic Rendering', () => {
		it('renders label, value and tip correctly', () => {
			render(LabelValuePair, { label, value, tip });

			expect(screen.getByText(label)).toBeInTheDocument();
			expect(screen.getByText(value)).toBeInTheDocument();
		});

		it('renders help icon when tip is provided', () => {
			render(LabelValuePair, { label, value, tip });

			const helpIcon = screen.getByTestId('circle-help-icon');
			expect(helpIcon).toBeInTheDocument();
		});
	});

	describe('Tooltip Behavior', () => {
		it('shows tooltip content on hover', async () => {
			render(LabelValuePair, { label, value, tip });
			const user = userEvent.setup();

			const helpIcon = screen.getByTestId('circle-help-icon');

			// screen.queryByText(tip) used to check if the tooltip content is not in the document. Negative assertion
			expect(screen.queryByText(tip)).not.toBeInTheDocument();

			// Simulate hovering over the help icon
			await user.hover(helpIcon);

			// screen.getByText(tip) used to check if the tooltip content is in the document. Positive assertion
			const tooltip = screen.getByText(tip);
			expect(tooltip).toBeInTheDocument();
			expect(tooltip.textContent).toContain(tip);

			// Simulate moving mouse away
			await user.unhover(helpIcon);

			expect(screen.queryByText(tip)).not.toBeInTheDocument();
		});
	});

	describe('Styling', () => {
		it('applies correct styling to elements', () => {
			render(LabelValuePair, { label, value, tip });

			const labelElement = screen.getByText(label);
			const valueElement = screen.getByText(value);

			// Check label styling
			expect(labelElement).toHaveClass('text-sm', 'text-gray-500');

			// Check value styling
			expect(valueElement).toHaveClass('text-sm', 'text-gray-900', 'font-normal');
		});
	});

	describe('Children', () => {
		it('should render children prop snippet', () => {
			render(LabelValuePairTest);

			const child = screen.getByTestId('child');
			expect(child).toBeInTheDocument();
		});
	});
});
