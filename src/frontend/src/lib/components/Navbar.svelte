<script lang="ts">
	import { Navbar, NavBrand, NavUl, Tooltip } from 'flowbite-svelte';
	import { page } from '$app/stores';
	import NavHamburger from './Navbar/NavHamburger.svelte';
	import NavLi from './Navbar/NavLi.svelte';
	import ConnectButton from './ConnectButton.svelte';

	$: activeUrl = $page.url.pathname;

	let activeClass = 'text-white bg-black text-sm border border-black py-2 w-fit px-7 rounded-md';
	let nonActiveClass =
		'text-black bg-white text-sm border border-black py-2 w-fit px-7 rounded-md hover:text-white hover:bg-black';
</script>

<Navbar class="px-2 sm:px-4 py-2.5 fixed w-full z-20 top-0 start-0 border-b">
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

	<NavUl
		class="order-1"
		divClass="w-full lg:block lg:w-auto"
		ulClass="flex flex-col p-2  mt-4 lg:flex-row lg:space-x-8 rtl:space-x-reverse lg:mt-0 lg:text-sm lg:font-medium"
	>
		<NavLi href="/">
			<div class={activeUrl === '/' ? activeClass : nonActiveClass}>Mint</div>
		</NavLi>
		<NavLi>
			<div class={activeUrl === '/swap/' ? activeClass : nonActiveClass}>Swap</div>
			<Tooltip type="light">Comming soon...</Tooltip>
		</NavLi>
		<NavLi>
			<div class={activeUrl === '/redeem/' ? activeClass : nonActiveClass}>Redeem</div>
			<Tooltip type="light">Comming soon...</Tooltip>
		</NavLi>
		<NavLi>
			<div class={activeUrl === '/stabilityPool/' ? activeClass : nonActiveClass}>
				Stability Pool
			</div>
			<Tooltip type="light">Comming soon...</Tooltip>
		</NavLi>
		<NavLi>
			<div class={activeUrl === '/activity/' ? activeClass : nonActiveClass}>Activity</div>
			<Tooltip type="light">Comming soon...</Tooltip>
		</NavLi>
	</NavUl>
</Navbar>
