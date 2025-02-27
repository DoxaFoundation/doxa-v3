<script lang="ts">
	import { Navbar, NavBrand, NavUl, Tooltip } from 'flowbite-svelte';
	import { page } from '$app/state';
	import NavHamburger from './Navbar/NavHamburger.svelte';
	import NavLi from './Navbar/NavLi.svelte';
	import ConnectButton from './ConnectButton.svelte';
	import { sineIn } from 'svelte/easing';

	let activeUrl = $derived(page.url.pathname);

	let activeClass =
		'text-white bg-black text-sm border border-black py-2 w-fit px-7 rounded-md box';
	let nonActiveClass =
		'text-black bg-white text-sm border border-black py-2 w-fit px-7 rounded-md hover:text-white hover:bg-black shadow';

	let smallscreenStyle = 'transition-colors transition-[font-weight] duration-[250ms] ease-out';
	let smallscreenActiveClass = 'font-bold text-black';
	let smallscreenNonActiveClass = 'font-light text-gray-500 hover:text-gray-950 hover:font-medium';
</script>

<Navbar class="px-2 sm:px-4 py-2.5 w-full border-b">
	<NavBrand href="/">
		<img src="/images/Doxa.svg" class="me-3 h-10 sm:h-12" alt="Doxa Logo" />
		<span class="self-center whitespace-nowrap text-2xl font-semibold text-black dark:text-white"
			>DOXA</span
		>
	</NavBrand>

	<div class="flex lg:order-2">
		<ConnectButton />
		<NavHamburger btnClass="ms-3 lg:hidden" />
	</div>

	<!-- <NavUl
		class="order-1"
		divClass="w-full lg:block lg:w-auto"
		ulClass="flex flex-row p-2  mt-4 flex-wrap lg:flex-nowrap justify-center lg:space-x-8 rtl:space-x-reverse lg:mt-0 lg:text-sm lg:font-medium"
	>
		<NavLi href="/" class="w-fit bg-red-400" activeClass="bg-red-400" nonActiveClass="bg-red-400">
			<div class={activeUrl === '/' ? activeClass : nonActiveClass}>Mint</div>
		</NavLi>
		<NavLi href="/stake/">
			<div class={activeUrl === '/stake/' ? activeClass : nonActiveClass}>Stake</div>
		</NavLi>
		<NavLi>
			<div class={activeUrl === '/swap/' ? activeClass : nonActiveClass}>Swap</div>
			<Tooltip type="light">Coming soon...</Tooltip>
		</NavLi>
		<NavLi>
			<div
				class="{smallscreenStyle} {activeUrl === '/redeem/'
					? smallscreenActiveClass
					: smallscreenNonActiveClass}"
			>
				Redeem
			</div>
		</NavLi>
		<NavLi href="/transactions/">
			<div class={activeUrl === '/transactions/' ? activeClass : nonActiveClass}>Transactions</div>
			<Tooltip type="light">Coming soon...</Tooltip>
		</NavLi>
	</NavUl> -->

	<NavUl
		slideParams={{ delay: 100, duration: 300, easing: sineIn }}
		class="order-1"
		divClass="w-full lg:block lg:w-auto"
		ulClass="flex flex-row p-2  mt-4 flex-wrap lg:flex-nowrap justify-center lg:space-x-8 rtl:space-x-reverse lg:mt-0 lg:text-sm lg:font-medium"
	>
		<NavLi href="/" class="p-72 bg-slate-500">
			<div
				class="{smallscreenStyle} {activeUrl === '/'
					? smallscreenActiveClass
					: smallscreenNonActiveClass}"
			>
				Mint
			</div>
		</NavLi>
		<NavLi href="/stake/">
			<div
				class="{smallscreenStyle} {activeUrl === '/stake/'
					? smallscreenActiveClass
					: smallscreenNonActiveClass}"
			>
				Stake
			</div>
		</NavLi>
		<NavLi href="/swap/">
			<div
				class="{smallscreenStyle} {activeUrl === '/swap/'
					? smallscreenActiveClass
					: smallscreenNonActiveClass}"
			>
				Swap
			</div>
			<Tooltip type="light">Coming soon...</Tooltip>
		</NavLi>

		<NavLi href="/transactions/">
			<div
				class="{smallscreenStyle} {activeUrl === '/transactions/'
					? smallscreenActiveClass
					: smallscreenNonActiveClass}"
			>
				Transactions
			</div>
			<Tooltip type="light">Coming soon...</Tooltip>
		</NavLi>
	</NavUl>
</Navbar>

<style lang="postcss">
	.box {
		box-shadow: 0px 1px 5px 0px rgba(0, 0, 0, 0.1);
	}
</style>
