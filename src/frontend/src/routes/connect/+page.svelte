<script lang="ts">
	import { authStore } from '$lib/stores/auth.store';
</script>

<div class="flex flex-col items-center">
	<h2 class="sm:text-4xl text-3xl text-gray-400 font-semibold">Connect Wallet</h2>
	<hr class="sm:w-72 w-64 border-b-[3px] border-[#404361] mt-4 md:mb-8 mb-2 rounded-full" />

	<button
		onclick={async () => await authStore.signIn({ identityProvider: 'ii' })}
		class="bg-[#1c1f43] hover:bg-[#555db6] active:bg-[#7a85ff] focus:outline-none focus:ring focus:ring-[#6773f9] rounded-full m-2"
	>
		<div class="rounded-full p-3 w-64 sm:p-4 sm:w-96 flex border-2 border-[#5061c0]">
			<img
				class="w-14 max-sm:w-12"
				src="/images/connect/InternetIdentity.svg"
				alt="internet identity"
			/>
			<div class="flex items-center ml-8">
				<p class=" text-white text-xl sm:text-2xl text-start">Internet Identity</p>
			</div>
		</div>
	</button>

	<button
		onclick={async () => await authStore.signIn({ identityProvider: 'nfid' })}
		class="bg-[#1c1f43] hover:bg-[#555db6] active:bg-[#7a85ff] focus:outline-none focus:ring focus:ring-[#6773f9] rounded-full m-2"
	>
		<div class="rounded-full p-3 w-64 sm:p-4 sm:w-96 flex border-2 border-[#5061c0]">
			<img class="w-14 max-sm:w-12" src="/images/connect/nfid.svg" alt="nfid" />
			<div class="flex flex-col ml-8">
				<p class="text-white text-xl sm:text-2xl text-start">NFID</p>
				<p class="text-gray-400 text-xs sm:text-sm">Sign in with Email</p>
			</div>
		</div>
	</button>

	<button
		onclick={async () => await authStore.signIn({ identityProvider: 'plug' })}
		class="bg-[#1c1f43] hover:bg-[#555db6] active:bg-[#7a85ff] focus:outline-none focus:ring focus:ring-[#6773f9] rounded-full m-2"
	>
		<div class="rounded-full p-3 w-64 sm:p-4 sm:w-96 flex border-2 border-[#5061c0]">
			<img class="w-14 max-sm:w-12" src="/images/connect/Plug.svg" alt="plug" />
			<div class="flex items-center ml-8">
				<p class="text-white text-xl sm:text-2xl text-start">Plug</p>
			</div>
		</div>
	</button>
</div>
