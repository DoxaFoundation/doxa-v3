import { getEmailPermission, insertEmail } from '$lib/api/root.canister.api';
import type { ResultSuccess } from '$lib/types/utils';
import { toast } from 'svelte-sonner';

export const isEmailPermissionAsked = async (): Promise<boolean> => {
	const response = await getEmailPermission();

	const emailPermmision = response[0];

	if (emailPermmision) {
		if ('Allow' in emailPermmision) {
			return true;
		} else {
			return true; // User denied email permission
		}
	} else {
		return false;
	}
};

export const allowOrDenyEmailPermission = async (email?: string): Promise<ResultSuccess> => {
	try {
		const response = await insertEmail(email);

		if ('ok' in response) {
			toast.success('You have joined our mailing list.');
			return { success: true };
		} else {
			toast.error('Failed to provide email. ' + response.err);
			return { success: false };
		}
	} catch (error) {
		console.error('Error while pushing email permission:', error);
		toast.error('Failed to provide email');

		return { success: false };
	}
};
