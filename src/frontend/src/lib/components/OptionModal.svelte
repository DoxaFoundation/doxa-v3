<script lang="ts">
	import { ArrowRightToBracketOutline, ArrowUpFromBracketOutline } from 'flowbite-svelte-icons';
	import { Modal, Button } from 'flowbite-svelte';
	import CopyCard from './CopyCard.svelte';
	import { authStore } from '$lib/stores/auth.store';
	import TransferModal from './TransferModal.svelte';
	import { RefreshOutline } from 'flowbite-svelte-icons';
	import { balanceStore, from6Decimals } from '$lib/stores/balance.store';
	import { Tooltip } from 'flowbite-svelte';
	import { ckUsdcBase64 } from '../../assets/base64-svg';

	export let open = false;

	let isRefreshing = false;
	let isRefreshingUsdx = false;

	function formatNumber(number: number): string {
		let [intPart, decimalPart] = number.toString().split('.');
		intPart = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, "'");
		return decimalPart ? `${intPart}.${decimalPart}` : intPart;
	}

	function displayBalanceInFormal(balance: bigint): string {
		return formatNumber(from6Decimals(balance));
	}

	let openTransferModal = false;
</script>

<Modal size="sm" bind:open outsideclose placement="top-right" color="primary" class="pt-2">
	<CopyCard badge="Principal" text={$authStore.principal.toText()} />
	<!-- <CopyCard badge="Account ID" text={window.ic.plug.accountId} /> -->
	<TransferModal bind:openTransferModal />
	<div class="grid grid-cols-2 gap-2">
		<Button outline color="alternative" class="w-full" on:click={() => (openTransferModal = true)}
			><ArrowUpFromBracketOutline />Transfer Token</Button
		>

		<Button outline class="w-full" color="alternative" on:click={authStore.signOut}
			><ArrowRightToBracketOutline class="pr-1" />Log Out</Button
		>
	</div>

	<div class="grid grid-cols-2 gap-2">
		<div class="border p-2 md:p-4 rounded-lg">
			<div class="flex items-center justify-between">
				<div class="flex items-center">
					<img
						src="/images/USDx-black.svg"
						alt="Doxa Dollar Icon"
						class="drop-shadow-md w-10 max-sm:w-6"
					/>
					<span class="ml-2">Doxa Dollar</span>
				</div>
				<button
					on:click={async () => {
						isRefreshingUsdx = true;
						await balanceStore.updateUsdxBalance();
						isRefreshingUsdx = false;
					}}
				>
					<RefreshOutline class={isRefreshingUsdx ? 'animate-spin' : ''} /></button
				>
				<Tooltip>Refresh</Tooltip>
			</div>

			<p
				class="mb-3 text-3xl max-sm:text-2xl font-normal text-gray-700 leading-tight block break-words overflow-hidden"
			>
				{displayBalanceInFormal($balanceStore.usdx)} <span class="text-base">USDx</span>
			</p>
		</div>

		<div class="border p-2 md:p-4 rounded-lg">
			<div class="flex items-center justify-between">
				<div class="flex items-center">
					<img
						src={ckUsdcBase64}
						width="40"
						alt="ckUSDC Icon"
						class="drop-shadow-md w-10 max-sm:w-6"
					/>
					<span class="ml-2">ckUSDC</span>
				</div>
				<button
					on:click={async () => {
						isRefreshing = true;
						await balanceStore.updateCkUsdcBalance();
						isRefreshing = false;
					}}
				>
					<RefreshOutline class={isRefreshing ? 'animate-spin' : ''} /></button
				>
				<Tooltip>Refresh</Tooltip>
			</div>

			<p
				class="mb-3 text-3xl max-sm:text-2xl font-normal text-gray-700 leading-tight block break-words"
			>
				{displayBalanceInFormal($balanceStore.ckUsdc)} <span class="text-base">ckUSDC</span>
			</p>
		</div>
	</div>
</Modal>
