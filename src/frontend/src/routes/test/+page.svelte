<script lang="ts">
	import { authStore } from '$lib/stores/auth.store';
	import { from6Decimals } from '$lib/stores/balance.store';
	import type {
		TransactionWithId,
		Transaction,
		GetTransactions,
		Account,
		SubAccount
	} from '@dfinity/ledger-icrc/dist/candid/icrc_index-ng';
	import { Principal } from '@dfinity/principal';

	import {
		Badge,
		Table,
		TableBody,
		TableBodyCell,
		TableBodyRow,
		TableHead,
		TableHeadCell
	} from 'flowbite-svelte';
	// import { onMount } from 'svelte';
	import { writable } from 'svelte/store';
	import { ckUsdcBase64 } from '../../assets/base64-svg';
	import {
		CaretSortOutline,
		CaretSortSolid,
		ArrowDownToBracketOutline,
		ArrowUpFromBracketOutline
	} from 'flowbite-svelte-icons';
	import TxTypeBadge from '$lib/components/TxTypeBadge.svelte';
	import TableRowSkelton from '$lib/components/TableRowSkelton.svelte';

	let items: {
		timestamp: number;
		amount: number;
		from: string;
		to: string;
		spender: string;
		id: number;
		type: string;
		token: string;
	}[] = [];

	// onMount(async () => {
	// 	let getUsdxTransactions: GetTransactions = await $authStore.usdxIndex.getTransactions({
	// 		max_results: BigInt(100),
	// 		account: {
	// 			owner: Principal.fromText('2bfxp-uzezm-gf5ny-ztks2-ybgzc-4dfjc-7gdhs-he2ek-vdjfk-w4yph-fqe')
	// 		}
	// 	});
	// 	let getCkUsdcTransactions: GetTransactions = await $authStore.ckUsdcIndex.getTransactions({
	// 		max_results: BigInt(100),
	// 		account: {
	// 			owner: Principal.fromText('2bfxp-uzezm-gf5ny-ztks2-ybgzc-4dfjc-7gdhs-he2ek-vdjfk-w4yph-fqe')
	// 		}
	// 	});
	// 	items = [
	// 		...transformTransactions(getUsdxTransactions.transactions, 'USDx'),
	// 		...transformTransactions(getCkUsdcTransactions.transactions, 'ckUSDC')
	// 	];
	// 	// sortTable('id');
	// 	// sortTable('timestamp');
	// });

	const txHistoryLoad = async () => {
		let getCkUsdcTransactions: GetTransactions = await $authStore.ckUsdcIndex.getTransactions({
			max_results: BigInt(100),
			account: {
				owner: $authStore.principal
			}
		});
		console.log(getCkUsdcTransactions);
		let getUsdxTransactions: GetTransactions = await $authStore.usdxIndex.getTransactions({
			max_results: BigInt(100),
			account: {
				owner: $authStore.principal
			}
		});
		console.log(getUsdxTransactions);
		getCkUsdcTransactions = await $authStore.ckUsdcIndex.getTransactions({
			max_results: BigInt(100),
			account: {
				owner: $authStore.principal
			}
		});
		items = [
			...transformTransactions(getUsdxTransactions.transactions, 'USDx'),
			...transformTransactions(getCkUsdcTransactions.transactions, 'ckUSDC')
		];
	};

	function transformTransactions(transactions: Array<TransactionWithId>, token: string) {
		return transactions.map((transactionWithId) => {
			return {
				id: Number(transactionWithId.id),
				type: transactionWithId.transaction.kind,
				token,
				...getAmountTimestampFromToSpender(transactionWithId.transaction, token)
			};
		});
	}

	function whitelistKownAccounts(token: string, account: Account): string {
		if (account.owner.compareTo($authStore.principal) === 'eq') {
			return 'Your Account';
		} else if (
			token === 'ckUSDC' &&
			'eq' === account.owner.compareTo(UsdxSckUsdcReserveAccount.owner)
		) {
			let subaccount: SubAccount | undefined = account.subaccount[0];
			if (
				subaccount &&
				areUint8ArraysEqual(new Uint8Array(subaccount), UsdxSckUsdcReserveAccount.subaccount[0])
			) {
				return 'USDx Reserve Account';
			}
		}
		return account.owner.toText();
	}

	function areUint8ArraysEqual(arr1: Uint8Array, arr2: Uint8Array): boolean {
		if (arr1.length !== arr2.length) return false;
		return arr1.every((value, index) => value === arr2[index]);
	}

	const UsdxSckUsdcReserveAccount = getUsdxReserveAccount();

	function getUsdxReserveAccount() {
		const array: number[] = new Array(32).fill(0);
		array[31] = 1;
		return {
			owner: Principal.fromText(import.meta.env.VITE_STABLECOIN_MINTER_CANISTER_ID),
			subaccount: [new Uint8Array(array)]
		};
	}

	function getAmountTimestampFromToSpender(transaction: Transaction, token: string) {
		let from = '';
		let to = '';
		let amount = 0;
		let spender = '';

		if (transaction.transfer[0]) {
			amount = from6Decimals(transaction.transfer[0].amount);
			from = whitelistKownAccounts(token, transaction.transfer[0].from);
			to = whitelistKownAccounts(token, transaction.transfer[0].to);
			spender = transaction.transfer[0].spender[0]?.owner.toText() ?? '';
		} else if (transaction.mint[0]) {
			amount = from6Decimals(transaction.mint[0].amount);
			to = whitelistKownAccounts(token, transaction.mint[0].to);
			from = 'Minting Account';
		} else if (transaction.burn[0]) {
			amount = from6Decimals(transaction.burn[0].amount);
			from = whitelistKownAccounts(token, transaction.burn[0].from);
			to = 'Minting Account';
			spender = transaction.burn[0].spender[0]?.owner.toText() ?? '';
		} else if (transaction.approve[0]) {
			amount = from6Decimals(transaction.approve[0].amount);
			from = whitelistKownAccounts(token, transaction.approve[0].from);
			spender = transaction.approve[0].spender.owner.toText();
		}
		return {
			timestamp: Number(transaction.timestamp),
			amount,
			from,
			to,
			spender
		};
	}

	function formatTimestamp(timestamp: number): string {
		// Convert nanoseconds to milliseconds
		const date = new Date(timestamp / 1000000);
		const now = new Date();

		const formatter = new Intl.DateTimeFormat('en-US', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
			hour12: true,
			timeZone: 'UTC'
		});

		const formattedDate = formatter.format(date).replace(',', '');
		const [datePart, timePart] = formattedDate.split(' ');
		const [month, day, year] = datePart.split('/');
		const formattedDateTime = `${year}-${month}-${day}, ${timePart} UTC`;

		const diffMs = now.getTime() - date.getTime();
		const diffMinutes = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMs / 3600000);
		const diffDays = Math.floor(diffMs / 86400000);
		const diffWeeks = Math.floor(diffDays / 7);
		const diffMonths =
			(now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth());

		let relativeTime: string;
		if (diffMinutes < 60) {
			relativeTime = `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
		} else if (diffHours < 24) {
			relativeTime = `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
		} else if (diffDays < 7) {
			relativeTime = `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
		} else if (diffWeeks < 4) {
			relativeTime = `${diffWeeks} week${diffWeeks !== 1 ? 's' : ''} ago`;
		} else if (diffMonths < 12) {
			relativeTime = `${diffMonths} month${diffMonths !== 1 ? 's' : ''} ago`;
		} else {
			const diffYears = Math.floor(diffMonths / 12);
			relativeTime = `${diffYears} year${diffYears !== 1 ? 's' : ''} ago`;
		}

		return `${formattedDateTime}, ${relativeTime}`;
	}

	const sortKey = writable('timestamp'); // default sort key (timestamp)
	const sortDirection = writable(-1); // default sort direction (descending)
	$: sortItems = writable(items.slice()); // make a copy of the items array

	// Define a function to sort the items
	const sortTable = (key: any) => {
		// If the same key is clicked, reverse the sort direction
		if ($sortKey === key) {
			sortDirection.update((val) => -val);
		} else {
			sortKey.set(key);
			sortDirection.set(1);
		}
	};

	$: {
		const key = $sortKey;
		const direction = $sortDirection;
		const sorted = [...$sortItems].sort((a, b) => {
			const aVal = a[key];
			const bVal = b[key];
			if (aVal < bVal) {
				return -direction;
			} else if (aVal > bVal) {
				return direction;
			}
			return 0;
		});
		sortItems.set(sorted);
	}
</script>

<Badge color="purple"><ArrowUpFromBracketOutline class="h-4" />Transfer</Badge>
<Badge color="purple"><ArrowDownToBracketOutline class="h-4" />Transfer</Badge>

<Table hoverable={true}>
	<TableHead>
		<TableHeadCell on:click={() => sortTable('token')}>Token</TableHeadCell>
		<TableHeadCell on:click={() => sortTable('id')}>Index</TableHeadCell>
		<TableHeadCell on:click={() => sortTable('amount')}>Amount</TableHeadCell>
		<TableHeadCell on:click={() => sortTable('type')}>Type</TableHeadCell>
		<TableHeadCell on:click={() => sortTable('timestamp')}
			>Timestamp
			{#if $sortDirection === 1}
				<CaretSortOutline
					class="inline text-start w-5"
					on:click={() => sortTable('timestamp')}
				/>{:else}
				<CaretSortSolid class="inline text-center w-5" on:click={() => sortTable('timestamp')} />
			{/if}
		</TableHeadCell>
		<TableHeadCell on:click={() => sortTable('from')}>From</TableHeadCell>
		<TableHeadCell on:click={() => sortTable('to')}>To</TableHeadCell>
	</TableHead>
	<TableBody tableBodyClass="divide-y">
		{#await txHistoryLoad()}
			<TableRowSkelton />
		{:then _}
			{#each $sortItems as item}
				<TableBodyRow>
					<TableBodyCell>
						<img
							src={item.token === 'USDx' ? '/images/USDx-black.svg' : ckUsdcBase64}
							alt="Doxa Dollar Icon"
							class="w-5"
						/>
					</TableBodyCell>
					<TableBodyCell>{item.id}</TableBodyCell>
					<TableBodyCell>{item.amount + ' ' + item.token}</TableBodyCell>
					<TableBodyCell><TxTypeBadge type={item.type} /></TableBodyCell>
					<TableBodyCell>{formatTimestamp(item.timestamp)}</TableBodyCell>
					<TableBodyCell>{item.from}</TableBodyCell>
					<TableBodyCell>{item.to}</TableBodyCell>
				</TableBodyRow>
			{/each}
			{#if $sortItems.length === 0}
				<p class="text-center text-gray-500 mt-10">There are no transactions</p>
			{/if}
		{/await}
	</TableBody>
</Table>
