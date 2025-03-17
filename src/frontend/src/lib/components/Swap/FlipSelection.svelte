<script>
	import { ChevronsDownUpIcon } from 'lucide-svelte';

	let { from = $bindable(), to = $bindable(), give = $bindable(), get = $bindable() } = $props();

	let animation = $state(false);

	const switchTokens = () => {
		const temp = from;
		from = to;
		to = temp;

		animation = !animation;

		const tempGive = give;
		give = get;
		get = tempGive;
	};
</script>

<div class="flex justify-center items-center relative h-0">
	<button
		class="icon-wrapper absolute z-10 border p-2 rounded-full hover:bg-gray-200 bg-white"
		class:open={animation}
		onclick={switchTokens}
	>
		<ChevronsDownUpIcon class="size-8 text-black transition-all duration-300 ease-out" />
	</button>
</div>

<style>
	.icon-wrapper {
		transition: transform 300ms ease-out;
	}

	/* hover over increase size */
	.icon-wrapper:hover {
		transform: scale(1.08);
	}

	/*  flip*/
	.icon-wrapper.open {
		transform: rotateX(180deg);
	}

	.icon-wrapper.open:hover {
		transform: rotateX(180deg) scale(1.08);
	}
</style>
