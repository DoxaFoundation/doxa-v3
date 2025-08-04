import {
	acceptRiskWarning as acceptRiskWarningApi,
	getRiskWarningAgreement
} from '$lib/api/root.canister.api';
import type { ResultSuccess } from '$lib/types/utils';
import { toast } from 'svelte-sonner';

export const isRiskWarningAccepted = async (): Promise<boolean> => {
	const result = await getRiskWarningAgreement();

	return result[0] ?? false;
};

export const acceptRiskWarning = async (): Promise<ResultSuccess> => {
	try {
		const response = await acceptRiskWarningApi();

		if ('err' in response) {
			toast.error('Failed to accept the risk warning. ' + response.err);

			return { success: false };
		}

		return { success: true };
	} catch (error) {
		console.error(error);
		toast.error('Failed to accept the risk warning. ' + error);

		return { success: false };
	}
};
