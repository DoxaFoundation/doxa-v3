<script lang="ts">
	import { Button, Label, Input, Modal } from 'flowbite-svelte';
	import { Settings2 } from 'lucide-svelte';

	let { value = $bindable('0.5') }: { value: string } = $props();

	let open = $state(false);

	$effect(() => {
		let valueTemp = value.replace(/[^0-9.]/g, '');

		const parts = valueTemp.split('.');
		if (parts.length > 2) {
			valueTemp = `${parts[0]}.${parts[1]}`;
		}

		if (parts[1]?.length > 2) {
			valueTemp = `${parts[0]}.${parts[1].slice(0, 2)}`;
		}

		value = valueTemp;
	});

	$effect(() => {
		if (!open) {
			if (value === '') value = '0.5';
			if (Number(value) > 50) value = '50';
		}
	});

	const setValue = (val: string) => () => {
		value = val;
	};
</script>

<Button color="alternative" class="px-3" onclick={() => (open = true)}
	>{value || '0'}% <Settings2 class="ml-2 size-4" /></Button
>

<Modal
	outsideclose
	title="Swap Settings"
	class="divide-y-0"
	bind:open
	size="xs"
	autoclose
	classHeader="text-gray-900  dark:text-white dark:placeholder-gray-400"
	bodyClass="px-4 pb-4 md:px-5 md:pb-5"
>
	<div class="">
		<Label class="space-y-2">
			<span class="flex items-center">Slippage tolerance</span>
			<div class="space-x-1 flex">
				<Input type="text" placeholder="" bind:value>
					{#snippet right()}
						%
					{/snippet}
				</Input>

				<Button
					class="w-16"
					onclick={setValue('0.1')}
					color={value === '0.1' ? 'primary' : 'alternative'}>0.1%</Button
				>
				<Button
					class="w-16"
					onclick={setValue('0.5')}
					color={value === '0.5' ? 'primary' : 'alternative'}>0.5%</Button
				>
				<Button
					class="w-16"
					onclick={setValue('5')}
					color={value === '5' ? 'primary' : 'alternative'}>5%</Button
				>
			</div>

			<p class="text-sm font-normal text-gray-500">
				Your transaction will revert if the price changes unfavorably by more than this percentage.
			</p>
		</Label>
	</div>
</Modal>
