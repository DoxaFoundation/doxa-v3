import { parseIcrcTokenMetadata, type ICRCLedgerMetadata } from '@utils/Icrc-ledger-metadata.utils';
import { metadata } from '$lib/api/icrc.ledger.api';
import { toast } from 'svelte-sonner';
import { getIcrcLedgerCanisterIds } from '@utils/icrc-ledger.utils';
import { get, set } from '@utils/idb.utilts';

export const LedgerMetadata: Record<string, ICRCLedgerMetadata> = $state({});

const storeName = 'ledger-metadata';

export const syncLedgerMetadata = async () => {
	let localMetadata = await get<string>({ key: storeName });
	if (localMetadata) {
		for (const [canisterId, metadata] of JSON.parse(localMetadata) as [
			string,
			ICRCLedgerMetadata
		][]) {
			LedgerMetadata[canisterId] = metadata;
		}
	} else {
		await fetchLedgerMetadata();
	}
};

export const fetchLedgerMetadata = async () => {
	try {
		const icrcLedgerCanisterIds = getIcrcLedgerCanisterIds();

		// Request metadata concurrently while catching errors for each individual one.
		const ledgerMetadataArr = await Promise.all(
			icrcLedgerCanisterIds.map(async (canisterId) => {
				try {
					const response = await metadata({ canisterId });
					return parseIcrcTokenMetadata(response, canisterId);
				} catch (error) {
					console.error(`Error getting metadata for ${canisterId}:`, error);
					return null;
				}
			})
		);

		ledgerMetadataArr.forEach((data, index) => {
			if (data) {
				LedgerMetadata[icrcLedgerCanisterIds[index]] = data;
			}
		});

		await set({ key: storeName, value: JSON.stringify(Object.entries(LedgerMetadata)) });
	} catch (error) {
		console.error('Error fetching ledger metadata', error);
		toast.error('Error fetching ledger metadata');
	}
};
