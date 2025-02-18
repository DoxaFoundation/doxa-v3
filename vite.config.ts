import inject from '@rollup/plugin-inject';
import { sveltekit } from '@sveltejs/kit/vite';
import { readFileSync } from 'fs';
import { join } from 'path';
import type { UserConfig } from 'vite';
import { defineConfig, loadEnv } from 'vite';

// npm run dev = local
// npm run build = local
// dfx deploy = local
// dfx deploy --network ic = ic
const network = process.env.DFX_NETWORK ?? 'local';
const host = network === 'local' ? 'http://localhost:8080' : 'https://icp-api.io';

type Details = {
	ic?: string;
	local?: string;
};

const readCanisterIds = ({ prefix }: { prefix?: string }): Record<string, string> => {
	const canisterIdsJsonFile =
		network === 'ic'
			? join(process.cwd(), 'canister_ids.json')
			: join(process.cwd(), '.dfx', 'local', 'canister_ids.json');

	try {
		const canisterIdsInRootDirectory: Record<string, Details> = JSON.parse(
			readFileSync(canisterIdsJsonFile, 'utf-8')
		);
		const canisterIdsInIcpSwapDirectory = readCanisterIdsInIcpSwapDirectory();

		const config: Record<string, Details> = {
			...canisterIdsInRootDirectory,
			...canisterIdsInIcpSwapDirectory
		};

		return Object.entries(config).reduce((acc, current: [string, Details]) => {
			const [canisterName, canisterDetails] = current;
			return {
				...acc,
				[`${prefix ?? ''}${canisterName.toUpperCase()}_CANISTER_ID`]:
					canisterDetails[network as keyof Details]
			};
		}, {});
	} catch (e) {
		throw Error(`Could not get canister ID from ${canisterIdsJsonFile}: ${e}`);
	}
};

const readCanisterIdsInIcpSwapDirectory = (): Record<string, Details> => {
	const canisterIdsJsonFilePath =
		network === 'ic'
			? join(process.cwd(), 'src', 'icp-swap', 'canister_ids.json')
			: join(process.cwd(), 'src', 'icp-swap', '.dfx', 'local', 'canister_ids.json');

	try {
		const config: Record<string, Details> = JSON.parse(
			readFileSync(canisterIdsJsonFilePath, 'utf-8')
		);

		return config;
	} catch (error) {
		throw Error(`Could not get canister ID from ${canisterIdsJsonFilePath}: ${error}`);
	}
};

const config: UserConfig = {
	plugins: [sveltekit()],
	build: {
		target: 'esnext',
		rollupOptions: {
			// Polyfill Buffer for production build
			plugins: [
				inject({
					modules: { Buffer: ['buffer', 'Buffer'] }
				})
			]
		}
	},
	server: {
		proxy: {
			'/api': 'http://localhost:8080'
		}
	},
	optimizeDeps: {
		esbuildOptions: {
			// Node.js global to browser globalThis
			define: {
				global: 'globalThis'
			}
		}
	}
};

export default defineConfig(({ mode }: UserConfig): UserConfig => {
	// Expand environment - .env files - with canister IDs
	process.env = {
		...process.env,
		...loadEnv(mode ?? 'development', process.cwd()),
		...readCanisterIds({ prefix: 'VITE_' }),
		VITE_DFX_NETWORK: network,
		VITE_HOST: host
	};

	return {
		...config,
		// Backwards compatibility for auto generated types of dfx that are meant for webpack and process.env
		define: {
			'process.env': {
				...readCanisterIds({}),
				DFX_NETWORK: network
			}
		}
	};
});
