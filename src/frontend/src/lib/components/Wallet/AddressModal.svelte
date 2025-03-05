<script>
	import { AccountIdentifier } from '@dfinity/ledger-icp';
	import { authStore } from '@stores/auth.store';
	import { copyToClipboard } from '@utils/copy.utils';
	import { Button, Input, Label, Modal } from 'flowbite-svelte';
	import { Copy, IdCard } from 'lucide-svelte';
	let popupModal = $state(false);

	let principalId = $authStore.principal.toString();

	const copyPrincipalId = () => {
		copyToClipboard(principalId);
	};

	let accountId = AccountIdentifier.fromPrincipal({
		principal: $authStore.principal,
		subAccount: undefined
	}).toHex();

	const copyAccountId = () => {
		copyToClipboard(accountId);
	};
</script>

<Button on:click={() => (popupModal = true)}><IdCard size={24} class="mr-1" />My Addresses</Button>

<Modal
	title="My Addresses"
	class="divide-y-0"
	border={false}
	bind:open={popupModal}
	size="md"
	autoclose
	outsideclose
	classHeader="text-gray-900  dark:text-white dark:placeholder-gray-400"
>
	<div class="space-y-4">
		<Label for="principal-id" class="w-full border rounded-lg p-3 md:p-4 space-y-3">
			<div class="flex justify-between items-center">
				<span class="font-medium text-base">Principal ID</span>
				<Button
					color="alternative"
					class="text-xs py-1.5 px-2.5 text-gray-700 "
					onclick={copyPrincipalId}
				>
					<Copy size={18} class="mr-2" />Copy</Button
				>
			</div>
			<Input
				id="principal-id"
				type="text"
				value={principalId}
				readonly
				placeholder="Default input"
				size="md"
				class="outline-0 text-xs"
			/>
		</Label>
	</div>

	<div class="space-y-4">
		<Label for="principal-id" class="w-full border rounded-lg p-3 md:p-4 space-y-3">
			<div class="flex justify-between items-center">
				<span class="font-medium text-base">Account ID</span>
				<Button
					color="alternative"
					class="text-xs py-1.5 px-2.5 text-gray-700 "
					onclick={copyAccountId}
				>
					<Copy size={18} class="mr-2" />Copy</Button
				>
			</div>
			<Input
				id="principal-id"
				type="text"
				value={accountId}
				readonly
				placeholder="Default input"
				size="md"
				class="outline-0 text-xs"
			/>
		</Label>
	</div>
</Modal>
