import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import ReclaimUnusedToken from './ReclaimUnusedToken.svelte';
import { getUserUnusedBalance } from '$lib/api/swap.pool.api';
import { poolsMap } from '@states/swap-pool-data.svelte';
import { withdrawUnusedToken } from '@services/swap.service';
import { getPoolKeyStoreKey } from '@utils/swap.utils';
import type { PoolData } from '@declarations/SwapFactory/SwapFactory.did';
import type { Principal } from '@dfinity/principal';
import type { ComponentProps, SvelteComponent } from 'svelte';

// Mock the dependencies
vi.mock('$lib/api/swap.pool.api', () => ({
	getUserUnusedBalance: vi.fn()
}));

vi.mock('@services/swap.service', () => ({
	withdrawUnusedToken: vi.fn()
}));
vi.mock('@utils/swap.utils', () => ({
	getPoolKeyStoreKey: vi.fn()
}));

// Mock the objects
vi.mock('@states/swap-pool-data.svelte', () => ({
	poolsMap: new Map()
}));

// Mock authStore with a proper store structure
vi.mock('@stores/auth.store', () => ({
	authStore: {
		principal: import.meta.env.VITE_TEST_PRINCIPAL,
		subscribe: vi.fn((callback) => {
			callback({ principal: import.meta.env.VITE_TEST_PRINCIPAL });
			return () => {};
		})
	}
}));

describe('ReclaimUnusedToken', () => {
	let user: UserEvent;

	beforeEach(() => {
		user = userEvent.setup();
		vi.clearAllMocks();
	});

	it('should not render when there are no unused tokens', async () => {
		vi.mocked(getPoolKeyStoreKey).mockReturnValue('tokenX-tokenY');

		// Mock the API response with zero balances
		vi.mocked(getUserUnusedBalance).mockResolvedValue({
			ok: { balance0: BigInt(0), balance1: BigInt(0) }
		});

		// Add a mock pool to the poolsMap
		poolsMap.set('tokenX-tokenY', {
			canisterId: 'test-canister-id'
		} as any);

		render(ReclaimUnusedToken, {
			tokenX: 'tokenX',
			tokenY: 'tokenY'
		});

		// Wait for the effect to complete
		await vi.waitFor(() => {
			expect(screen.queryByText(/Missing tokens/i)).not.toBeInTheDocument();
		});
	});

	it('should render when there are unused tokens', async () => {
		vi.mocked(getPoolKeyStoreKey).mockReturnValue('tokenX-tokenY');

		// Mock the API response with non-zero balances
		vi.mocked(getUserUnusedBalance).mockResolvedValue({
			ok: { balance0: BigInt(100), balance1: BigInt(0) }
		});

		vi.mocked(withdrawUnusedToken).mockResolvedValue({ success: true });

		// Add a mock pool to the poolsMap
		poolsMap.set('tokenX-tokenY', {
			canisterId: 'test-canister-id'
		} as any);

		const { container } = render(ReclaimUnusedToken, {
			tokenX: 'tokenX',
			tokenY: 'tokenY'
		});

		// Wait for the effect to complete and check if the button is rendered
		await vi.waitFor(
			() => {
				// Find the button by text content instead of role
				expect(container.textContent).toContain(
					'Missing tokens? please withdraw your unused token'
				);
			},
			{ timeout: 2000 }
		);
	});

	it('should withdraw unused token', async () => {
		vi.mocked(getPoolKeyStoreKey).mockReturnValue('tokenX-tokenY');

		// Initial balance has tokens
		const initialResponse = {
			ok: { balance0: BigInt(100), balance1: BigInt(0) }
		};

		// After withdrawal balance is zero
		const afterWithdrawalResponse = {
			ok: { balance0: BigInt(0), balance1: BigInt(0) }
		};

		// Setup getUserUnusedBalance to return different values on consecutive calls
		vi.mocked(getUserUnusedBalance)
			.mockResolvedValueOnce(initialResponse) // First call - initial load
			.mockResolvedValueOnce(afterWithdrawalResponse); // Second call - after withdrawal

		vi.mocked(withdrawUnusedToken).mockResolvedValue({ success: true });

		// Add a mock pool to the poolsMap
		poolsMap.set('tokenX-tokenY', {
			canisterId: 'test-canister-id'
		} as any);

		const { container } = render(ReclaimUnusedToken, {
			tokenX: 'tokenX',
			tokenY: 'tokenY'
		});

		// Wait for initial render with the button
		await vi.waitFor(
			() => {
				expect(container.textContent).toContain(
					'Missing tokens? please withdraw your unused token'
				);
			},
			{ timeout: 2000 }
		);

		// Get button and click it
		const button = screen.getByRole('button', {
			name: 'Missing tokens? please withdraw your unused token'
		});

		expect(button).toBeInTheDocument();

		// Click the withdraw button
		await user.click(button);

		// Verify withdrawUnusedToken was called
		expect(withdrawUnusedToken).toHaveBeenCalledTimes(1);

		// Verify getUserUnusedBalance was called again after withdrawal
		expect(getUserUnusedBalance).toHaveBeenCalledTimes(2);

		// Wait for the component to re-render based on new balance (zeros)
		await vi.waitFor(
			() => {
				// Button should no longer be present because balance is now zero
				expect(
					screen.queryByRole('button', {
						name: 'Missing tokens? please withdraw your unused token'
					})
				).not.toBeInTheDocument();
			},
			{ timeout: 2000 }
		);
	});

	it('fetchUserUnusedBalance will update the unused tokens', async () => {
		let unusedTokens = $state({
			balance0: 0,
			balance1: 0
		});

		const fetchUserUnusedBalance = async (pool: PoolData) => {
			const response = await getUserUnusedBalance({
				canisterId: pool.canisterId.toString(),
				principal: import.meta.env.VITE_TEST_PRINCIPAL
			});
			if ('ok' in response) {
				const { balance0, balance1 } = response.ok;

				unusedTokens = {
					balance0: Number(balance0),
					balance1: Number(balance1)
				};
			}
		};

		const mockPool = {
			canisterId: {
				toString: () => 'test-canister-id'
			} as Principal,
			key: 'pool-key',
			fee: BigInt(0),
			token0: {
				address: 'token0-address',
				standard: 'token0-standard'
			},
			token1: {
				address: 'token1-address',
				standard: 'token1-standard'
			},
			tickSpacing: BigInt(0)
		} as PoolData;

		vi.mocked(getUserUnusedBalance).mockResolvedValue({
			ok: { balance0: BigInt(50), balance1: BigInt(20) }
		});

		await fetchUserUnusedBalance(mockPool);

		expect(unusedTokens.balance0).toBe(50);
		expect(unusedTokens.balance1).toBe(20);
	});
	it('fetchUserUnusedBalance will not update the unused tokens if getUserUnusedBalance returns error', async () => {
		let unusedTokens = $state({
			balance0: 0,
			balance1: 0
		});

		const fetchUserUnusedBalance = async (pool: PoolData) => {
			const response = await getUserUnusedBalance({
				canisterId: pool.canisterId.toString(),
				principal: import.meta.env.VITE_TEST_PRINCIPAL
			});
			if ('ok' in response) {
				const { balance0, balance1 } = response.ok;

				unusedTokens = {
					balance0: Number(balance0),
					balance1: Number(balance1)
				};
			}
		};

		const mockPool = {
			canisterId: {
				toString: () => 'test-canister-id'
			} as Principal,
			key: 'pool-key',
			fee: BigInt(0),
			token0: {
				address: 'token0-address',
				standard: 'token0-standard'
			},
			token1: {
				address: 'token1-address',
				standard: 'token1-standard'
			},
			tickSpacing: BigInt(0)
		} as PoolData;

		vi.mocked(getUserUnusedBalance).mockResolvedValue({
			err: {
				InsufficientFunds: null
			}
		});

		await fetchUserUnusedBalance(mockPool);

		expect(unusedTokens.balance0).toBe(0);
		expect(unusedTokens.balance1).toBe(0);
	});

	it('effect will run when the prop is changed', async () => {
		vi.mocked(getPoolKeyStoreKey)
			.mockReturnValueOnce('ckUSDC-ICP')
			.mockReturnValueOnce('ckBTC-ckETH');

		let token1 = $state('ckUSDC');
		let token2 = $state('ICP');

		// Mock the API response with zero balances
		vi.mocked(getUserUnusedBalance).mockResolvedValue({
			ok: { balance0: BigInt(0), balance1: BigInt(0) }
		});

		// Add a mock pool to the poolsMap
		poolsMap.set('ckUSDC-ICP', {
			canisterId: 'test-canister-id'
		} as any);

		// commenting this for to run the getUserUnusedBalance once
		// poolsMap.set('ckBTC-ckETH', {
		// 	canisterId: 'test-canister-id'
		// } as any);

		const { container } = render(ReclaimUnusedToken, {
			get tokenX(): string {
				return token1;
			},
			set tokenX(v: string) {
				token1 = v;
			},
			get tokenY(): string {
				return token2;
			},
			set tokenY(v: string) {
				token2 = v;
			}
		});

		// Wait for initial render to complete
		await vi.waitFor(() => {
			expect(getPoolKeyStoreKey).toHaveBeenCalledTimes(1);
			expect(getUserUnusedBalance).toHaveBeenCalledTimes(1);
		});

		// update props
		token1 = 'ckBTC';
		token2 = 'ckETH';

		// Wait for effect to respond to prop changes
		await vi.waitFor(
			() => {
				expect(getPoolKeyStoreKey).toHaveBeenCalledTimes(2);
				expect(getUserUnusedBalance).toHaveBeenCalledTimes(1); //if pool don't exist, getUserUnusedBalance will not be called
			},
			{ timeout: 1000 }
		);
	});
});
