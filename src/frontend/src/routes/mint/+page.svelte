<script lang="ts">
	import { authStore } from '$lib/stores/auth.store';
	import { Principal } from '@dfinity/principal';
	import { onMount, onDestroy } from 'svelte';

	// onMount(async () => {
	// 	let balance = await $authStore.ckUsdc.balance({
	// 		owner: $authStore.principal
	// 	});

	// 	console.log('Balance of user: ', balance);
	// 	console.log(
	// 		'Balance of default Identity',
	// 		await $authStore.ckUsdc.balance({
	// 			owner: Principal.fromText('jtfmz-pvild-ruqbe-kxi7g-der7l-dpmff-4bgia-p33k6-b55rh-g44eb-2qe')
	// 		})
	// 	);
	// });

	import { Button, Tooltip } from 'flowbite-svelte';
	let ckETHIcon: string = '';
	// onMount(async () => {
	// 	let metadata = await $authStore.ckUsdc.metadata({ certified: true });
	// 	metadata.find((element) => {
	// 		let stringOEnum = element[0];
	// 		let value = element[1];

	// 		if (stringOEnum === 'icrc1:logo') {
	// 			if ('Text' in value) {
	// 				ckETHIcon = value.Text;
	// 			}
	// 		}
	// 	});
	// 	// console.log(metadata);
	// });

	import { RefreshOutline } from 'flowbite-svelte-icons';
	import { balanceStore, from6Decimals } from '$lib/stores/balance.store';

	import { Select, Label, Input, Helper } from 'flowbite-svelte';

	let selectedToken: string = 'ckUSDC';
	let selectedMint: string = 'USDx';
	let mintUsing = [
		{ value: 'ckUSDC', name: 'ckUSDC' },
		{ value: 'ICP', name: 'ICP' },
		{ value: 'ckETH', name: 'ckETH' },
		{ value: 'ckBTC', name: 'ckBTC' }
	];
	let mintToken = [
		{ value: 'USDx', name: 'Doxa Dollar' },
		{ value: 'Doxa Euro', name: 'Doxa Euro' },
		{ value: 'Doxa GBP', name: 'Doxa GBP' }
	];
	let mintAmount_usdx = 0;
	let selectTokenAmount_ckUSDC = 0;

	let mintButtonDisable = !$authStore.isAuthenticated;
	let buttonMessage = 'Mint';

	function setMaxCkUSDC() {
		let balance = from6Decimals($balanceStore.ckUsdc);
		if (balance > 0) {
			selectTokenAmount_ckUSDC = balance - 0.01;
		}
		disableMintButton();
	}

	function disableMintButton() {
		if (!$authStore.isAuthenticated) {
			mintButtonDisable = true;
			buttonMessage = 'Connect to mint';
			return;
		} else if (selectedToken !== 'ckUSDC') {
			buttonMessage = 'Minting using ' + selectedToken + ' is comming soon...';
			mintButtonDisable = true;
			return;
		} else if (selectedMint !== 'USDx') {
			buttonMessage = selectedMint + ' is comming soon';
			mintButtonDisable = true;
			return;
		} else {
			let minimumBalance = 1.01;
			let currentBalance = from6Decimals($balanceStore.ckUsdc);

			if (currentBalance < minimumBalance) {
				buttonMessage = 'Not enough balance, minimum 1 ckUSDC + fee';
				mintButtonDisable = true;
				return;
			} else if (selectTokenAmount_ckUSDC > currentBalance - 0.01) {
				buttonMessage = 'Not enough balance';
				mintButtonDisable = true;
				return;
			} else if (selectTokenAmount_ckUSDC < 1) {
				buttonMessage = 'Minimum 1 ckUSDC + fee';
				mintButtonDisable = true;
				return;
			}

			mintButtonDisable = false;
			buttonMessage = 'Mint';
		}
	}
	onMount(async () => {
		disableMintButton();
	});
	const unsubscribe = authStore.subscribe((value) => {
		disableMintButton();
	});
	onDestroy(unsubscribe);

	const unsubscribe2 = balanceStore.subscribe((value) => {
		disableMintButton();
	});
	onDestroy(unsubscribe2);
</script>

<div class="flex flex-col items-center justify-center m-2">
	<div class="md:p-8 p-4 dark:bg-sky-200 md:w-fit w-full rounded-2xl border">
		<Label class="m-6">
			Minting using
			<div class="md:flex gap-2">
				<Select
					placeholder="Choose token"
					size="sm"
					class="mt-2 w-fit shadow-md shadow-gray-400"
					items={mintUsing}
					bind:value={selectedToken}
					on:change={disableMintButton}
				/>
				<div class="md:flex md:flex-col-reverse md:pl-2 max-md:mt-3">
					<Input
						bind:value={selectTokenAmount_ckUSDC}
						class="py-2 w-fit shadow-md"
						type="number"
						placeholder="Enter amount"
						size="md"
						on:input={disableMintButton}
					>
						<svelte:fragment slot="right">
							{#if selectTokenAmount_ckUSDC + 0.01 !== from6Decimals($balanceStore.ckUsdc) && selectedToken === 'ckUSDC'}
								<button class="text-center" on:click={setMaxCkUSDC}>Max</button>
							{/if}
						</svelte:fragment>
					</Input>
					<Tooltip>Enter amount</Tooltip>
				</div>
				<!-- <button class="text-center">Max</button>
				<Tooltip>Max amount</Tooltip> -->
			</div>
		</Label>

		<Label class="m-6">
			Select currency to mint
			<div class="md:flex gap-2">
				<Select
					placeholder="Choose token"
					size="sm"
					class="mt-2 w-fit shadow-inner "
					items={mintToken}
					bind:value={selectedMint}
					on:change={disableMintButton}
				/>

				<div class="md:flex md:flex-col-reverse md:pl-2 max-md:mt-3">
					<Input
						bind:value={mintAmount_usdx}
						class="py-2  shadow-inner block w-52 disabled:cursor-not-allowed disabled:opacity-50 rtl:text-right"
						type="number"
						placeholder="Enter amount"
						size="md"
						on:change={disableMintButton}
					/>
				</div>
			</div>
		</Label>

		<div class="flex justify-center">
			<Button
				class="bg-black text-base p-6 w-44 md:w-60 rounded-3xl font-light  hover:bg-blue-400"
				disabled={mintButtonDisable}
			>
				{buttonMessage}
			</Button>
		</div>
	</div>
</div>
<!-- <img src={ckETHIcon} alt="" /> -->

<!-- <div class=" bg-slate-50 w-96 h-16 rounded-full shadow-lg ml-3 grid grid-cols-4 gap-2">
	<div class="ml-4 mt-2">
		USDx <br />{from6Decimals($balanceStore.usdx)}
	</div>

	<div class="mt-2">
		ckUSDC <br />{from6Decimals($balanceStore.ckUsdc)}
	</div>
</div> -->
