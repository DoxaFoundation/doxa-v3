<script lang="ts">
	import LogoDarkWhite from '@components/LogoDarkWhite.svelte';
	import { DECIMALS } from '@constants/app.constants';
	import { claimAllRewards, claimReward } from '@services/claim-reward.service';
	import { myStakes } from '@states/my-stakes.svelte';
	import { stakingPoolDetails } from '@states/staking.svelte';
	import { AccordionItem, Accordion, Button, Label } from 'flowbite-svelte';
	import { LockOpenOutline, LockTimeOutline, RefreshOutline } from 'flowbite-svelte-icons';
	import { Checkbox } from 'flowbite-svelte';
	import { toggleAutoStakeRewads } from '@services/staking.service';

	let unclaimedRewards = $derived(
		myStakes.value.reduce((sum, stake) => sum + stake.unclaimedRewards, 0)
	);
	let userTotalStakedAmount = $derived(
		myStakes.value.reduce((sum, stake) => sum + stake.amount, 0)
	);
	let userTotalStakedReward = $derived(
		myStakes.value.reduce((sum, stake) => sum + stake.stakedReward, 0)
	);

	let btnDisable = $derived(unclaimedRewards <= 0);

	let loader = $state(false);
</script>

<div
	class="box-border w-full p-4 border-2 border-gray-300 dark:border-gray-700 rounded-xl bg-gray-200 dark:bg-gray-800 grid grid-cols-1 md:grid-cols-2 gap-6"
>
	<div
		class="col-span-full border-b-2 border-gray-300 dark:border-gray-700 pb-3 flex w-full justify-between"
	>
		<div>
			<p class="text-sm text-gray-500 dark:text-gray-400">Unclaimed Rewards</p>
			<p class="text-xl font-semibold mt-3">
				{unclaimedRewards.toFixed(2)}
				{stakingPoolDetails.stakingTokenSymbol}
			</p>
		</div>

		<Button class="dark:bg-gray-950" onclick={claimAllRewards}>Claim all</Button>
	</div>

	<div>
		<p class="text-sm text-gray-500 dark:text-gray-400">Your Total Stake</p>
		<p class="text-xl font-semibold mt-3">
			{userTotalStakedAmount.toFixed(2)}
			{stakingPoolDetails.stakingTokenSymbol}
		</p>
	</div>

	<div>
		<p class="text-sm text-gray-500 dark:text-gray-400">Your Total Staked Rewards</p>
		<p class="text-xl font-semibold mt-3">
			{userTotalStakedReward.toFixed(2)}
			{stakingPoolDetails.stakingTokenSymbol}
		</p>
	</div>
</div>

<Accordion class="mt-4">
	{#each myStakes.value as stake, index}
		<AccordionItem
			activeClass="border-gray-300 dark:border-gray-700"
			borderClass="'border-s border-e group-first:border-t-2"
			borderSharedClass="border-gray-300 dark:border-gray-700 border-2  border-t-0"
			defaultClass="flex items-center justify-between w-full font-medium text-left group-first:rounded-t-xl border-2 border-gray-300 dark:border-gray-700"
		>
			<span slot="header" class="w-full">
				<div class="grid grid-cols-2 text-black dark:text-white w-full">
					<div class="flex items-center w-full">
						{#if stake.unlockAt.remainingDays === 0}
							<LockOpenOutline />
							<p class="ml-1">Unlocked</p>
						{:else}
							<LockTimeOutline />
							<p class="ml-1">{stake.unlockAt.remainingDays} days</p>
						{/if}
					</div>
					<div class="flex">
						<p>{stake.amount.toFixed(2)} {stakingPoolDetails.stakingTokenSymbol}</p>
					</div>
				</div>
			</span>

			<div class="grid md:grid-cols-2 grid-cols-1 gap-4 w-full text-black dark:text-white">
				<div class="">
					<!-- 48 -->
					<!-- 52 -->
					<!-- <LogoDarkWhite /> -->
					<!-- <div></div> -->
					<p class="text-base font-normal text-gray-500 dark:text-gray-400">Staked Amount</p>
					<p class="text-lg font-medium mt-1">
						{stake.amount}
						{stakingPoolDetails.stakingTokenSymbol}
					</p>
				</div>
				{#if stake.unlockAt.remainingDays !== 0}
					<div class="">
						<p class="text-base font-normal text-gray-500 dark:text-gray-400">Unlock After</p>
						<p class="text-lg font-medium mt-1">
							{stake.unlockAt.remainingDays} days, {stake.unlockAt.date}
						</p>
					</div>
				{:else}
					<div class="">
						<p class="text-base font-normal text-gray-500 dark:text-gray-400">Unlocked on</p>
						<p class="text-lg font-medium mt-1">{stake.unlockAt.date}</p>
					</div>
				{/if}

				<div class=" border-y-2 py-3 col-span-full border-gray-300 dark:border-gray-700">
					<p class="text-xl font-medium">Rewards</p>
					<div class="mt-3 flex justify-between">
						<div>
							<p class="text-base font-normal text-gray-500 dark:text-gray-400">
								Unclaimed Rewards
							</p>
							<p class="text-lg font-medium">
								{stake.unclaimedRewards}
								{stakingPoolDetails.stakingTokenSymbol}
							</p>
						</div>

						<Button
							color="alternative"
							onclick={async () => {
								await claimReward(stake);
							}}
							disabled={stake.unclaimedRewards === 0}
							outline
							class="">Claim</Button
						>
					</div>
					<div class="mt-3 flex justify-between">
						<div>
							<p class="text-base font-normal text-gray-500 dark:text-gray-400">Staked Rewards</p>
							<p class="text-lg font-medium">
								{stake.stakedReward}
								{stakingPoolDetails.stakingTokenSymbol}
							</p>
						</div>

						<Button class="dark:bg-gray-950" disabled={stake.unclaimedRewards === 0}>Stake</Button>
					</div>

					<div class="mt-6">
						<Label class="flex items-center gap-2">
							{#if loader}
								<RefreshOutline class="animate-spin size-4" />
							{:else}
								<Checkbox
									inline
									class=""
									checked={stake.isRewardsAutoStaked}
									onchange={async () => {
										// loader = true;
										await toggleAutoStakeRewads(index);
										// loader = false;
									}}
								/>
							{/if}
							Automatically stake new rewards
						</Label>
					</div>
				</div>

				<div class=""></div>
				<div class=""></div>
				<div class=""></div>
			</div>
		</AccordionItem>
	{/each}
</Accordion>
