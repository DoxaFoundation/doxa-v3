import {
	CKBTC_LEDGER_CANISTER_ID,
	CKETH_LEDGER_CANISTER_ID,
	CKUSDC_LEDGER_CANISTER_ID,
	CKUSDT_LEDGER_CANISTER_ID,
	ICP_LEDGER_CANISTER_ID,
	STABLECOIN_MINTER_CANISTER_ID,
	STAKING_CANISTER_ID,
	USDX_LEDGER_CANISTER_ID
} from '@constants/app.constants';
import { fetchPoolsCanisterIds } from '@services/swap.service';

export const getWhitelist = async (): Promise<string[]> => {
	const swapPoolsIds = await fetchPoolsCanisterIds();

	return [
		STABLECOIN_MINTER_CANISTER_ID,
		STAKING_CANISTER_ID,
		USDX_LEDGER_CANISTER_ID,
		CKUSDC_LEDGER_CANISTER_ID,
		ICP_LEDGER_CANISTER_ID,
		CKBTC_LEDGER_CANISTER_ID,
		CKETH_LEDGER_CANISTER_ID,
		CKUSDT_LEDGER_CANISTER_ID,
		...swapPoolsIds
	];
};
