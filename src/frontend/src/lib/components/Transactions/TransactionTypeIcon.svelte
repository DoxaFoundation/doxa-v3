<script lang="ts">
	import type { TransactionType } from '$lib/types/transactions';
	import {
		ArrowDown,
		ArrowUp,
		ArrowUpDown,
		BadgeCheck,
		BadgePercent,
		BadgePlus,
		Flame,
		RefreshCcwDot
	} from 'lucide-svelte';

	type Props = {
		type: TransactionType;
	};

	let { type }: Props = $props();

	// Define Tailwind classes for each transaction type
	const typeClasses = {
		Send: { bg: 'bg-blue-50', icon: 'text-blue-500' },
		Receive: { bg: 'bg-green-50', icon: 'text-green-500' },
		Approve: { bg: 'bg-orange-50', icon: 'text-orange-500' },
		Mint: { bg: 'bg-purple-50', icon: 'text-purple-500' },
		Swap: { bg: 'bg-cyan-50', icon: 'text-cyan-500' },
		Stake: { bg: 'bg-pink-50', icon: 'text-pink-500' },
		Burn: { bg: 'bg-red-50', icon: 'text-red-500' },
		Transfer: { bg: 'bg-slate-50', icon: 'text-slate-500' }
	};
</script>

<div
	class="inline-flex items-center justify-center w-12 h-12 rounded-lg p-1.5 transition-transform duration-200 hover:scale-105 {typeClasses[
		type
	].bg} {typeClasses[type].icon}"
>
	{#if type === 'Receive'}
		<ArrowDown class="w-7 h-7" />
	{:else if type === 'Send'}
		<ArrowUp class="w-7 h-7" />
	{:else if type === 'Approve'}
		<BadgeCheck class="w-7 h-7" />
	{:else if type === 'Mint'}
		<BadgePlus class="w-7 h-7" />
	{:else if type === 'Swap'}
		<RefreshCcwDot class="w-7 h-7" />
	{:else if type === 'Stake'}
		<BadgePercent class="w-7 h-7" />
	{:else if type === 'Burn'}
		<Flame class="w-7 h-7" />
	{:else if type === 'Transfer'}
		<ArrowUpDown class="w-7 h-7" />
	{/if}
</div>
