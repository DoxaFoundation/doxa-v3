<script lang="ts">
	import { Button, Tooltip } from 'flowbite-svelte';
	import { Select, Input } from 'flowbite-svelte';

	let depositTokens = [{ value: 'USDx', name: 'Doxa Dollar' }];
	let selectTokens = [{ value: 'USDst', name: 'USDst' }];
</script>

<div class="flex flex-col items-center justify-center mt-2">
	<div class="md:p-8 p-4 dark:bg-sky-200 md:w-fit w-full rounded-2xl border box mb-4">
		<h1 class="text-3xl font-normal mb-4 text-center">Deposit</h1>
		<p class="font-light text-sm text-center">Earn native yield with USDst</p>
		<div class="max-sm:flex max-sm:flex-col max-sm:items-center">
			<div class="md:flex gap-2">
				<Select
					placeholder="Deposit token"
					size="sm"
					class="mt-2 w-fit box py-8 max-md:w-full bg-white border shadow-md"
					items={depositTokens}
				/>
				<div class="md:flex md:flex-col-reverse md:pl-2 max-md:mt-3">
					<Input
						class="py-8 w-fit max-md:w-full box bg-white border shadow-md text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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

			<div class="md:flex gap-2 mt-4">
				<Select
					placeholder="Select token"
					size="sm"
					class="mt-2 w-fit box py-8 max-md:w-full bg-white border shadow-md md:w-32"
					items={selectTokens}
				/>

				<div class="md:flex md:flex-col-reverse md:pl-2 max-md:mt-3">
					<Input
						class="py-8 w-fit max-md:w-full box bg-white border shadow-md text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
						type="number"
						placeholder="Amount"
						size="md"
						disabled
					/>
				</div>
			</div>
		</div>
		<div class="flex justify-center mt-8">
			<Button class="bg-black text-base p-6 w-44 md:w-60 rounded-3xl font-light  hover:bg-blue-400">
				EARN
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
