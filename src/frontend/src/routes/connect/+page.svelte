<script lang="ts">
	import { authStore } from '$lib/stores/auth.store';
</script>

<div class="flex flex-col items-center">
	<h2 class="text-4xl text-[#f0f2f4] font-semibold">Connect Wallet</h2>
	<hr class="w-72 border-b-[3px] border-[#404361] mt-4 md:mb-8 mb-2 rounded-full" />

	<button
		on:click={async () => await authStore.signInWithII()}
		class="bg-[#1c1f43] hover:bg-[#555db6] active:bg-[#7a85ff] focus:outline-none focus:ring focus:ring-[#6773f9] rounded-full m-2"
	>
		<div class=" rounded-full p-4 w-96 grid grid-cols-3 max-sm:w-80 border-2 border-[#5061c0]">
			<img width="54px" src="/images/connect/InternetIdentity.svg" alt="" />
			<div class="flex items-center col-span-2">
				<p class="text-[#ededf0] text-2xl font-light text-start">Internet Identity</p>
			</div>
		</div>
	</button>

	<button
		on:click={async () => await authStore.signInWithPlug()}
		class="bg-[#1c1f43] hover:bg-[#555db6] active:bg-[#7a85ff] focus:outline-none focus:ring focus:ring-[#6773f9] rounded-full m-2"
	>
		<div class=" rounded-full p-4 w-96 grid grid-cols-3 max-sm:w-80 border-2 border-[#5061c0]">
			<img width="54px" src="/images/connect/Plug.svg" alt="" />
			<div class="flex items-center col-span-2">
				<p class="text-[#ededf0] text-2xl font-light text-start">Plug</p>
			</div>
		</div>
	</button>
</div>
