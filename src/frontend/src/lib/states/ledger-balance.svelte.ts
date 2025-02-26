import { balance } from '$lib/api/icrc.ledger.api';
import type { Balance, BalancesState } from '$lib/types/states';
import { authStore } from '@stores/auth.store';
import { fromBigIntDecimals } from '@utils/decimals.utils';
import { formatNumber } from '@utils/fromat.utils';
import { getIcrcLedgerCanisterIds } from '@utils/icrc-ledger.utils';
import { toast } from 'svelte-sonner';
import { get } from 'svelte/store';
import { LedgerMetadata } from './ledger-metadata.svelte';

export const balances = $state<BalancesState>({});

export const fetchBalances = async () => {
	try {
		const icrcLedgerCanisterIds = getIcrcLedgerCanisterIds();

		const { principal } = get(authStore);

		// Request balance concurrently while catching errors for each individual one.
		const responses: (Balance | null)[] = await Promise.all(
			icrcLedgerCanisterIds.map(async (canisterId) => {
				try {
					const response = await balance({ canisterId, owner: principal });
					const number = fromBigIntDecimals(response, canisterId);
					const format = formatNumber(number, canisterId);

					return { number, format };
				} catch (error) {
					console.error(`Error getting balance for ${canisterId}:`, error);
					return null;
				}
			})
		);

		responses.forEach((data, index) => {
			if (data) {
				balances[icrcLedgerCanisterIds[index]] = data;
			}
		});
	} catch (error) {
		console.error('Error fetching ledger balances', error);
		toast.error('Failed fetching ledger balances');
	}
};

export const updateBalance = async (canisterId: string) => {
	try {
		const { principal } = get(authStore);

		const response = await balance({ canisterId, owner: principal });

		const number = fromBigIntDecimals(response, canisterId);
		const format = formatNumber(number, canisterId);

		balances[canisterId] = { number, format };
	} catch (error) {
		console.error(`Error updating balance for ${canisterId}:`, error);
		toast.error(`Failed updating balance of ${LedgerMetadata[canisterId].name ?? canisterId}`);
	}
};
