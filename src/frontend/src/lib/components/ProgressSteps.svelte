<script lang="ts">
	type Status = 'completed' | 'in-progress' | 'error' | 'pending';

	interface Props {
		steps?: { id: number; text: string; status: Status }[];
		updateStep?: (index: number, newStatus: Status) => void;
	}

	let { steps = [] }: Props = $props();
</script>

<div class=" text-black p-5 font-sans">
	<div class="flex flex-col">
		{#each steps as step, index}
			<div class="flex items-start mb-[30px] relative">
				<div
					class="w-[30px] h-[30px] rounded-full flex items-center justify-center font-bold mr-[15px] relative flex-shrink-0 {step.status ===
					'completed'
						? 'bg-green-500'
						: step.status === 'in-progress'
							? 'bg-indigo-500'
							: step.status === 'error'
								? 'bg-red-600'
								: 'bg-gray-400'}"
				>
					{#if step.status === 'completed'}
						<svg viewBox="0 0 24 24" class="w-5 h-5 fill-white">
							<path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
						</svg>
					{:else if step.status === 'in-progress'}
						<div
							class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"
						></div>
						<span
							class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-sm text-white"
							>{step.id}</span
						>
					{:else if step.status === 'error'}
						<svg viewBox="0 0 24 24" class="w-5 h-5 fill-white">
							<path
								d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"
							/>
						</svg>
					{:else}
						<div class="text-white">
							{step.id}
						</div>
					{/if}
				</div>
				<div class="flex-1 flex flex-col justify-center">
					<p class="m-0 leading-tight">{step.text}</p>
					<span class="text-xs uppercase text-[#a0a0a0] mt-1">{step.status}</span>
				</div>
				{#if index !== steps.length - 1}
					<div
						class="absolute left-[15px] top-[30px] bottom-[-30px] w-[2px] {steps[index + 1]
							.status === 'completed'
							? 'bg-green-500'
							: steps[index + 1].status === 'error'
								? 'bg-red-600'
								: 'bg-gray-400'}"
					></div>
				{/if}
			</div>
		{/each}
	</div>
</div>
