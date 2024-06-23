<script lang="ts">
	import ProgressSteps from '$lib/components/ProgressSteps.svelte';

	type Status = 'completed' | 'in-progress' | 'error' | 'pending';
	let steps: { id: number; text: string; status: Status }[] = [
		{ id: 1, text: 'Connection with sale canister', status: 'completed' },
		{ id: 1, text: 'Connection with sale canister', status: 'completed' },
		{ id: 1, text: 'Connection with sale canister', status: 'completed' },

		{ id: 2, text: 'Sending tokens', status: 'in-progress' },
		{ id: 3, text: 'Confirming your participation...', status: 'pending' },
		{ id: 4, text: 'Updating your data', status: 'pending' },
		{ id: 4, text: 'Updating your data', status: 'pending' },
		{ id: 4, text: 'Updating your data', status: 'error' },
		{ id: 4, text: 'Updating your data', status: 'error' },
		{ id: 3, text: 'Confirming your participation...', status: 'in-progress' },
		{ id: 4, text: 'Updating your data', status: 'error' },
		{ id: 1, text: 'Connection with sale canister', status: 'completed' },
		{ id: 1, text: 'Connection with sale canister', status: 'completed' },
		{ id: 4, text: 'Updating your data', status: 'error' }
	];

	let steps1: { id: number; text: string; status: Status }[] = [
		{
			id: 1,
			text: 'Connection with ckUSDC, Stablecoin minter and USDx canisters',
			status: 'completed'
		},
		{ id: 2, text: 'Sending ckUSDC to USDx Reserve Account', status: 'in-progress' },
		{ id: 3, text: 'Notifying stablecoin minter', status: 'pending' },
		{ id: 4, text: 'Minting USDx', status: 'pending' }
	];
</script>

<h1 class="text-2xl text-black">Swap page</h1>
<ProgressSteps steps={steps1} />
