<script lang="ts">
	import { Button } from 'flowbite-svelte';
	import { Select, Input } from 'flowbite-svelte';
	import { LockTimeSolid } from 'flowbite-svelte-icons';
	import { DarkMode } from 'flowbite-svelte';
	import { onDestroy, onMount } from 'svelte';
	import { fetchStakingPoolDetails, stakeUSDx } from '@services/staking.service';
	import { stakingPoolDetails } from '@states/staking.svelte';
	import { fetchFeecollecteds } from '@services/fee-collected.service';
	import { feeCollected } from '@states/fee-collected.svelte';
	import { balanceStore } from '@stores/balance.store';
	import { displayBalanceInFormat } from '@utils/fromat.utils';
	import { from6Decimals, truncateDecimal } from '@utils/decimals.utils';
	import { assertNonNullish, isNullish } from '@dfinity/utils';
	import UserStakesPosition from '@components/Stake/UserStakePositions.svelte';
	import {
		MAXIMUM_STAKE_DURATION_IN_DAYS,
		MINIMUM_STAKE_AMOUNT,
		MINMUM_STAKE_DURATION_IN_DAYS
	} from '@constants/staking.constants';
	import { authStore } from '@stores/auth.store';
	import { Range, Label } from 'flowbite-svelte';

	let days = $state(MINMUM_STAKE_DURATION_IN_DAYS);

	const unsubscribe = authStore.subscribe((value) => {
		if (value) {
			fetchStakingPoolDetails();
			fetchFeecollecteds();
			myStakes.fetch();
		}
	});
	onDestroy(unsubscribe);

	let amount = $state<number>();

	let balance = $state(from6Decimals($balanceStore.usdx));
	$effect(() => {
		balance = from6Decimals($balanceStore.usdx);
	});

	let buttonContent = $derived.by<string>(() => {
		if (isNullish(amount)) {
			return 'Enter the amount';
		} else if (amount > balance - 0.01) {
			return 'Insufficient balance';
		} else if (amount < MINIMUM_STAKE_AMOUNT) {
			return 'Minimum stake is 10';
		} else {
			return 'Stake';
		}
	});
	let disabled = $derived.by<boolean>(() => {
		if (isNullish(amount)) {
			return true;
		} else if (amount > balance - 0.01) {
			return true;
		} else if (amount < MINIMUM_STAKE_AMOUNT) {
			return true;
		} else {
			return false;
		}
	});

	const max = () => {
		if (balance > 0.01) {
			amount = balance - 0.01;
		}
	};

	// $effect(() => {
	// 	if (amount) return;

	// 	if (typeof amount !== 'undefined') {
	// 		amount = truncateDecimal(amount, DECIMALS);
	// 	}
	// });

	const onclick = async () => {
		assertNonNullish(amount);
		await stakeUSDx({ amount: Number(amount?.toFixed(DECIMALS)), days });
		balance = from6Decimals($balanceStore.usdx);
		amount = 0;
	};

	// total staking amout , total fee collected sofar, current week fee. number of stakers

	// expected APY calculation, total fee collected sofar / current week from when fee collection started

	/// bg-[rgba(26,34,63)] border-[rgba(255,255,255,0.04)]

	/// add start time ckUSDC pool

	///
	import { Tabs, TabItem } from 'flowbite-svelte';
	import { myStakes } from '@states/my-stakes.svelte';
	import { DECIMALS } from '@constants/app.constants';

	$inspect(myStakes);

	function validateInput(event: any) {
		const input = event.target;
		const value = input.value;

		// Allow empty input
		if (!value) return;

		// Regular expression to match numbers with up to 6 decimal places
		// const regex = /^\d*\.?\d{0,6}$/;
		const regex = new RegExp(`^\\d*\\.?\\d{0,${DECIMALS}}$`);

		if (!regex.test(value)) {
			// If invalid, remove the last entered character
			input.value = value.slice(0, -1);
		}
	}
</script>

<!-- <DarkMode /> -->

<div class="flex flex-col items-center justify-center mt-2 dark:text-white mb-4">
	<div class="bg-gray-100 dark:bg-gray-900 box-border max-w-[548px] w-full rounded-xl p-4 md:p-6">
		<div
			class="box-border w-full p-4 border-2 border-gray-300 dark:border-gray-700 rounded-xl bg-gray-200 dark:bg-gray-800 grid grid-cols-1 md:grid-cols-2 gap-6"
		>
			<div>
				<p class="text-sm text-gray-500 dark:text-gray-400">Total Staked</p>
				<p class="text-xl font-semibold mt-3">
					{stakingPoolDetails.totalTokensStaked.toFixed(2)}
					{stakingPoolDetails.stakingTokenSymbol}
				</p>
			</div>

			<div>
				<p class="text-sm text-gray-500 dark:text-gray-400">Total Fee collected</p>
				<p class="text-xl font-semibold mt-3">
					{feeCollected.total}
					{stakingPoolDetails.stakingTokenSymbol}
				</p>
			</div>

			<div>
				<p class="text-sm text-gray-500 dark:text-gray-400">This Week Fee</p>
				<p class="text-xl font-semibold mt-3">
					{feeCollected.fromLastRewardDistribution}
					{stakingPoolDetails.stakingTokenSymbol}
				</p>
			</div>
			<div>
				<p class="text-sm text-gray-500 dark:text-gray-400">Number of Stakers</p>
				<p class="text-xl font-semibold mt-3">
					{stakingPoolDetails.noOfStakers}
				</p>
			</div>
		</div>

		<Tabs
			tabStyle="full"
			defaultClass="flex rounded-xl divide-x rtl:divide-x-reverse divide-gray-200 shadow dark:divide-gray-700 mt-4"
			contentClass="p-4 bg-gray-200 rounded-xl dark:bg-gray-800 mt-4"
		>
			<TabItem class="w-full" open>
				<span slot="title">Stake</span>
				<div class="w-full">
					<h1 class="text-3xl font-normal mb-4 text-center">Stake USDx</h1>
					<p class="font-light text-sm text-center">Earn native yield with USDx</p>
					<div class="max-sm:flex max-sm:flex-col max-sm:items-center">
						<div class="flex gap-2 mt-4 justify-between w-full">
							<img
								src="/images/USDx-black.svg"
								alt="USDx Icon"
								class="md:size-14 size-12 dark:hidden"
							/>
							<img
								src="/images/USDx-white.svg"
								alt="USDx Icon"
								class="md:size-14 size-12 hidden dark:block"
							/>

							<Input
								class="text-right ring-0 outline-0 text-xl px-0 md:text-2xl bg-gray-200 dark:bg-gray-800  border-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
								type="number"
								placeholder="0.00"
								size="md"
								bind:value={amount}
								oninput={validateInput}
							></Input>
						</div>
						<div class="flex justify-between items-center mt-3 w-full">
							<p class="text-sm text-gray-500 dark:text-gray-400">
								Balance: {displayBalanceInFormat($balanceStore.usdx)}
							</p>
							<button
								class="w-fit underline rounded text-sm text-gray-500 dark:text-gray-400"
								onclick={max}>Max</button
							>
						</div>
					</div>
					<div class="mt-3">
						<Label class="text-base inline-flex">Lock Duration<LockTimeSolid /></Label>
						<Range
							class="bg-gray-300"
							id="staking-duration-range"
							min={MINMUM_STAKE_DURATION_IN_DAYS}
							max={MAXIMUM_STAKE_DURATION_IN_DAYS}
							bind:value={days}
						/>
						<p>Lock upto: {days} days</p>
					</div>

					<div class="flex justify-center mt-8">
						<Button
							{onclick}
							{disabled}
							class="bg-black hover:bg-gray-800  disabled:opacity-50 disabled:bg-gray-800 dark:bg-gray-950 dark:hover:bg-gray-900 dark:disabled:bg-gray-600 text-base p-4 w-full rounded-2xl font-light "
						>
							{buttonContent}
						</Button>
					</div>
				</div>
			</TabItem>

			<TabItem class="w-full">
				<span slot="title">Your stakes</span>
				<UserStakesPosition />
			</TabItem>
		</Tabs>
	</div>
</div>

<style lang="postcss">
	:global(html) {
	}

	.box {
		box-shadow: 0px 1px 5px 0px rgba(0, 0, 0, 0.1);
	}
</style>
