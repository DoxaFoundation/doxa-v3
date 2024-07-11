<script lang="ts">
	import SelectDropDown from '$lib/components/SelectDropDown.svelte';
	import { Button, Tooltip } from 'flowbite-svelte';
	import { Select, Input } from 'flowbite-svelte';
	import { LockTimeOutline, LockTimeSolid, QuestionCircleOutline } from 'flowbite-svelte-icons';

	let depositTokens = [
		{ id: 1, value: 'USDx', name: 'Doxa Dollar', img: '/images/USDx-black.svg' }
	];

	let value: string;

	// select previous style
	// class="mt-2 w-fit box py-8 max-md:w-full bg-white border shadow-md"

	import { Range, Label } from 'flowbite-svelte';
	let minmaxValue = 6;
</script>

<div class="flex flex-col items-center justify-center mt-2">
	<div class="md:p-8 p-4 dark:bg-sky-200 md:w-fit w-full rounded-2xl border box mb-4">
		<h1 class="text-3xl font-normal mb-4 text-center">Deposit</h1>
		<p class="font-light text-sm text-center">Earn native yield with USDx</p>
		<div class="max-sm:flex max-sm:flex-col max-sm:items-center">
			<div class="md:flex gap-2">
				<SelectDropDown
					placeholder="Deposit token"
					size="sm"
					class="mt-2 max-md:w-full w-[180px]"
					dropDownClass="w-[180px]"
					items={depositTokens}
					bind:value
				/>
				<div class="md:flex md:flex-col-reverse md:pl-2 max-md:mt-3">
					<Input
						class="mt-2 py-5  w-[180px] max-md:w-full box bg-white border-2 shadow-md text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
						type="number"
						placeholder="Amount"
						size="md"
					>
						<!-- <svelte:fragment slot="right">
									{#if selectTokenAmount_ckUSDC + 0.01 !== from6Decimals($balanceStore.ckUsdc) && selectedToken === 'ckUSDC'}
										<button class="text-center" on:click={setMaxCkUSDC}>Max</button>
									{/if}
								</svelte:fragment> -->
					</Input>
					<Tooltip>Enter amount</Tooltip>
				</div>
			</div>
		</div>
		<div class="mt-3">
			<Label class="text-base inline-flex">Lock Duration<LockTimeSolid /></Label>
			<Range class="bg-black" id="range-minmax" min="6" max="48" bind:value={minmaxValue} />
			<p>Lock upto: {minmaxValue} months</p>
		</div>
		<div class="mt-3 flex justify-between flex-wrap">
			<p class="w-1/2 text-start font-light">Staked 0M</p>
			<p class="w-1/2 text-end text-red-400 font-light">APY 0%</p>
			<p class="w-1/2 text-start inline-flex font-light">
				Reward <QuestionCircleOutline class="ml-1" />
			</p>
			<p class="w-1/2 text-end font-light inline">
				0.00 USD <QuestionCircleOutline class="inline" />
			</p>
		</div>
		<div class="flex justify-center mt-8">
			<Button class="bg-black text-base p-6 w-44 md:w-60 rounded-3xl font-light  hover:bg-blue-400">
				Stake
			</Button>
			<Tooltip>Coming soon...</Tooltip>
		</div>
	</div>
</div>

<style lang="postcss">
	:global(html) {
	}

	.box {
		box-shadow: 0px 1px 5px 0px rgba(0, 0, 0, 0.1);
	}
</style>
