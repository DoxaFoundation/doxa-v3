import { parseIcrcTokenMetadata, type ICRCLedgerMetadata } from '@utils/Icrc-ledger-metadata.utils';
import {
	CKBTC_LEDGER_CANISTER_ID,
	CKETH_LEDGER_CANISTER_ID,
	CKUSDC_LEDGER_CANISTER_ID,
	CKUSDT_LEDGER_CANISTER_ID,
	ICP_LEDGER_CANISTER_ID,
	USDX_LEDGER_CANISTER_ID
} from '@constants/app.constants';
import { metadata } from '$lib/api/icrc.ledger.api';
import { toast } from 'svelte-sonner';

export const LedgerMetadata: Record<string, ICRCLedgerMetadata> = $state({});

export const fetchLedgerMetadata = async () => {
	try {
		const icrcLedgerCanisterIds = [
			USDX_LEDGER_CANISTER_ID,
			CKUSDC_LEDGER_CANISTER_ID,
			ICP_LEDGER_CANISTER_ID,
			CKBTC_LEDGER_CANISTER_ID,
			CKETH_LEDGER_CANISTER_ID,
			CKUSDT_LEDGER_CANISTER_ID
		];

		// Request metadata concurrently while catching errors for each individual one.
		const ledgerMetadata = await Promise.all(
			icrcLedgerCanisterIds.map(async (canisterId) => {
				try {
					const response = await metadata({ canisterId });
					return parseIcrcTokenMetadata(response, canisterId);
				} catch (error) {
					console.error(`Error for ${canisterId}:`, error);
					return null;
				}
			})
		);

		ledgerMetadata.forEach((data, index) => {
			if (data) {
				LedgerMetadata[icrcLedgerCanisterIds[index]] = data;
			}
		});
	} catch (error) {
		console.error('Error fetching ledger metadata', error);
		toast.error('Error fetching ledger metadata');
	}
};
