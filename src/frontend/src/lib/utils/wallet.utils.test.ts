/**
 * @fileoverview
 * This file contains tests for the wallet utility functions defined in `wallet.utils.ts`.
 * Currently, it focuses on testing the `getWhitelist` function.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getWhitelist } from './wallet.utils';
import * as AppConstants from '@constants/app.constants'; // Import for mocking
import { fetchPoolsCanisterIds } from '@services/swap.service'; // Import for mocking

// Mock App Constants
vi.mock('@constants/app.constants', () => ({
    STABLECOIN_MINTER_CANISTER_ID: 'stablecoin-minter-id',
	STAKING_CANISTER_ID: 'staking-id',
	ROOT_CANISTER_ID: 'root-id',
	UTILITY_CANISTER_ID: 'utility-id',
	USDX_LEDGER_CANISTER_ID: 'usdx-ledger-id',
	CKUSDC_LEDGER_CANISTER_ID: 'ckusdc-ledger-id',
	ICP_LEDGER_CANISTER_ID: 'icp-ledger-id',
	CKBTC_LEDGER_CANISTER_ID: 'ckbtc-ledger-id',
	CKETH_LEDGER_CANISTER_ID: 'cketh-ledger-id',
	CKUSDT_LEDGER_CANISTER_ID: 'ckusdt-ledger-id'
}));

// Mock fetchPoolsCanisterIds service call
const mockPoolIds = ['pool-id-1', 'pool-id-2', 'pool-id-3'];
vi.mock('@services/swap.service', () => ({
    fetchPoolsCanisterIds: vi.fn()
}));


describe('wallet.utils', () => {

    beforeEach(() => {
        // Reset mocks before each test
        vi.clearAllMocks();
        // Setup the mock implementation for fetchPoolsCanisterIds
        vi.mocked(fetchPoolsCanisterIds).mockResolvedValue(mockPoolIds);
    });

	describe('getWhitelist', () => {
		it('should return an array containing all constant canister IDs and fetched pool IDs', async () => {
			const expectedWhitelist = [
                AppConstants.STABLECOIN_MINTER_CANISTER_ID,
                AppConstants.STAKING_CANISTER_ID,
                AppConstants.ROOT_CANISTER_ID,
                AppConstants.UTILITY_CANISTER_ID,
                AppConstants.USDX_LEDGER_CANISTER_ID,
                AppConstants.CKUSDC_LEDGER_CANISTER_ID,
                AppConstants.ICP_LEDGER_CANISTER_ID,
                AppConstants.CKBTC_LEDGER_CANISTER_ID,
                AppConstants.CKETH_LEDGER_CANISTER_ID,
                AppConstants.CKUSDT_LEDGER_CANISTER_ID,
                ...mockPoolIds // Spread the mocked pool IDs
            ];

            const whitelist = await getWhitelist();

            // Check that fetchPoolsCanisterIds was called
            expect(fetchPoolsCanisterIds).toHaveBeenCalledTimes(1);

            // Check the contents of the returned array
            // Use expect(...).toEqual(...) for array comparison
            // Using arrayContaining ensures all expected elements are present, regardless of order,
            // but the implementation creates a specific order, so toEqual is better here.
            expect(whitelist).toEqual(expectedWhitelist);
		});

        it('should handle the case where fetchPoolsCanisterIds returns an empty array', async () => {
             vi.mocked(fetchPoolsCanisterIds).mockResolvedValue([]); // Override mock for this test

             const expectedWhitelistWithoutPools = [
                AppConstants.STABLECOIN_MINTER_CANISTER_ID,
                AppConstants.STAKING_CANISTER_ID,
                AppConstants.ROOT_CANISTER_ID,
                AppConstants.UTILITY_CANISTER_ID,
                AppConstants.USDX_LEDGER_CANISTER_ID,
                AppConstants.CKUSDC_LEDGER_CANISTER_ID,
                AppConstants.ICP_LEDGER_CANISTER_ID,
                AppConstants.CKBTC_LEDGER_CANISTER_ID,
                AppConstants.CKETH_LEDGER_CANISTER_ID,
                AppConstants.CKUSDT_LEDGER_CANISTER_ID
                // No spread operator needed here
            ];

            const whitelist = await getWhitelist();
            expect(fetchPoolsCanisterIds).toHaveBeenCalledTimes(1);
            expect(whitelist).toEqual(expectedWhitelistWithoutPools);
        });

         it('should still return constants if fetchPoolsCanisterIds throws an error (though the promise would reject)', async () => {
            const fetchError = new Error('Failed to fetch pools');
            vi.mocked(fetchPoolsCanisterIds).mockRejectedValue(fetchError);

            // Expect the promise returned by getWhitelist to reject
            await expect(getWhitelist()).rejects.toThrow(fetchError);

             expect(fetchPoolsCanisterIds).toHaveBeenCalledTimes(1);
         });
	});
}); 