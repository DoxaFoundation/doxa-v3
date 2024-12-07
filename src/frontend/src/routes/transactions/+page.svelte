<script>
	import { AccordionItem, Accordion } from 'flowbite-svelte';
	import { CartSolid, CogOutline } from 'flowbite-svelte-icons';
</script>

<div class="flex justify-center">
	<div class="w-[500px] max-md:w-full p-4 max-sm:p-2">
		<h1 class="text-xl text-black">Your Transaction</h1>
		<hr class="w-full border-b-[3px] border-stone-200 mt-4" />
		<p class="text-center text-gray-500 mt-10">You have no transactions</p>
	</div>
</div>

<Accordion class="m-2">
	<AccordionItem>
		<span slot="header" class="text-base flex gap-2">
			<CartSolid class="mt-0.5" />

			<span>My Header 1</span>
		</span>
		<p class="mb-2 text-gray-500 dark:text-gray-400">
			Lorem ipsum dolor sit amet, consectetur adipisicing elit. Illo ab necessitatibus sint
			explicabo...
		</p>
		<p class="text-gray-500 dark:text-gray-400">
			Check out this guide to learn how to <a
				href="/"
				target="_blank"
				rel="noreferrer"
				class="text-blue-600 dark:text-blue-500 hover:underline"
			>
				get started
			</a>
			and start websites even faster with components on top of Tailwind CSS.
		</p>
	</AccordionItem>
	<AccordionItem>
		<span slot="header" class="text-base flex gap-2">
			<CogOutline class="mt-0.5" />
			<img src="/images/USDx-black.svg" alt="Doxa Dollar Icon" class="w-6 mt-0.5" />
			<span>ckUSDC</span>
		</span>
		<p class="mb-2 text-gray-500 dark:text-gray-400">
			Lorem ipsum dolor sit amet, consectetur adipisicing elit. Illo ab necessitatibus
			sintexplicabo...
		</p>
		<p class="text-gray-500 dark:text-gray-400">
			Check out this guide to learn how to <a
				href="/"
				target="_blank"
				rel="noreferrer"
				class="text-blue-600 dark:text-blue-500 hover:underline"
			>
				get started
			</a>
			and start websites even faster with components on top of Tailwind CSS.
		</p>
		<p class="text-gray-500 dark:text-gray-400">
			Check out this guide to learn how to <a
				href="/"
				target="_blank"
				rel="noreferrer"
				class="text-blue-600 dark:text-blue-500 hover:underline"
			>
				get started
			</a>
			and start websites even faster with components on top of Tailwind CSS.
		</p>
		<p class="text-gray-500 dark:text-gray-400">
			Check out this guide to learn how to <a
				href="/"
				target="_blank"
				rel="noreferrer"
				class="text-blue-600 dark:text-blue-500 hover:underline"
			>
				get started
			</a>
			and start websites even faster with components on top of Tailwind CSS.
		</p>
	</AccordionItem>
</Accordion>
