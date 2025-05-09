import type { Option } from '$lib/types/utils';
import { HOST, LOCAL } from '@constants/app.constants';
import type { HttpAgent, Identity } from '@dfinity/agent';
import type { Principal } from '@dfinity/principal';
import { createAgent as createAgentUtils, isNullish } from '@dfinity/utils';

let agents: Option<Record<string, HttpAgent>> = undefined;

export const getAgent = async ({ identity }: { identity: Identity }): Promise<HttpAgent> => {
	const key = identity.getPrincipal().toString();

	if (isNullish(agents) || isNullish(agents[key])) {
		const agent = await createAgent({ identity });

		agents = {
			...(agents ?? {}),
			[key]: agent
		};

		return agent;
	}

	return agents[key];
};

export const createAgent = ({
	identity,
	verifyQuerySignatures = true
}: {
	identity: Identity;
	verifyQuerySignatures?: boolean;
}): Promise<HttpAgent> =>
	createAgentUtils({
		identity,
		host: HOST,
		fetchRootKey: LOCAL,
		verifyQuerySignatures
		// retryTimes: 3 //default
	});

export const clearAgents = () => (agents = null);

export const getAgentFromCache = (principal: Principal): Option<HttpAgent> => {
	if (isNullish(agents)) return null;

	const key = principal.toString();

	return agents[key];
};

// For testing purposes, to reset the internal agents cache
export const _resetAgentsCacheForTesting = (): void => {
	agents = undefined;
};
