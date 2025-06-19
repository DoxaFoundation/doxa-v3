<script>
	import { acceptRiskWarning } from '@services/risk-warning.svelte';
	import { Button, Modal, Checkbox } from 'flowbite-svelte';
	import { ArrowRight } from 'lucide-svelte';

	let { bannerVisible = $bindable() } = $props();
	let accepted = $state(false);
	let open = $state(false);

	const iAcceptRiskWarning = async () => {
		open = false;

		const result = await acceptRiskWarning();

		if (result.success) {
			bannerVisible = false;
		}
	};
</script>

<Button size="sm" onclick={() => (open = true)}>Read <ArrowRight class="ms-2 h-3 w-3" /></Button>

<Modal
	size="lg"
	title="IMPORTANT RISK DISCLOSURE"
	bind:open
	outsideclose
	classBody="overflow-y-auto"
>
	<div class="max-w-4xl mx-auto bg-white rounded-lg shadow-lg max-h-[60vh]">
		<!-- Header -->
		<div class="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
			<div>
				<p class="text-gray-600 mt-1">
					Please read carefully before proceeding. Using DUSD involves significant risks that could
					result in partial or total loss of your funds.
				</p>
			</div>
		</div>

		<!-- Risk Sections -->
		<div class="space-y-6">
			<!-- Stablecoin Risks -->
			<div class="bg-gray-50 rounded-lg p-4 border-l-4 border-gray-400">
				<h3 class="text-lg text-gray-800 mb-3 flex items-center gap-2">
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
						/>
					</svg>
					Stablecoin Risks
				</h3>
				<ul class="space-y-2 text-gray-700">
					<li class="flex items-start gap-2">
						<span class="text-gray-500 mt-1">•</span>
						<span
							><span class="font-medium">Depegging Risk:</span> DUSD may lose its peg to USD due to market
							conditions, liquidity issues, or technical problems</span
						>
					</li>
					<li class="flex items-start gap-2">
						<span class="text-gray-500 mt-1">•</span>
						<span
							><span class="font-medium">Backing Mechanism:</span> Verify the collateral backing DUSD
							- undercollateralization could affect stability</span
						>
					</li>
					<li class="flex items-start gap-2">
						<span class="text-gray-500 mt-1">•</span>
						<span
							><span class="font-medium">Redemption Risk:</span> There's no guarantee you can always
							redeem DUSD at $1.00 value</span
						>
					</li>
				</ul>
			</div>

			<!-- Staking Risks -->
			<div class="bg-gray-50 rounded-lg p-4 border-l-4 border-gray-400">
				<h3 class="text-lg text-gray-800 mb-3 flex items-center gap-2">
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
						/>
					</svg>
					Staking Risks
				</h3>
				<ul class="space-y-2 text-gray-700">
					<li class="flex items-start gap-2">
						<span class="text-gray-500 mt-1">•</span>
						<span
							><span class="font-medium">Lock-up Period:</span> Your DUSD will be locked for 90-365
							days with <span class="font-medium">no early withdrawal</span></span
						>
					</li>
					<li class="flex items-start gap-2">
						<span class="text-gray-500 mt-1">•</span>
						<span
							><span class="font-medium">Opportunity Cost:</span> Locked funds cannot be used for other
							investments or emergencies</span
						>
					</li>
					<li class="flex items-start gap-2">
						<span class="text-gray-500 mt-1">•</span>
						<span
							><span class="font-medium">Platform Risk:</span> If our platform experiences issues, your
							staked funds may be inaccessible</span
						>
					</li>
					<li class="flex items-start gap-2">
						<span class="text-gray-500 mt-1">•</span>
						<span
							><span class="font-medium">Reward Reduction:</span> Staking rewards may decrease or stop
							entirely based on platform economics</span
						>
					</li>
				</ul>
			</div>

			<!-- Swap/Trading Risks -->
			<div class="bg-gray-50 rounded-lg p-4 border-l-4 border-gray-400">
				<h3 class="text-lg text-gray-800 mb-3 flex items-center gap-2">
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
						/>
					</svg>
					Swap/Trading Risks
				</h3>
				<ul class="space-y-2 text-gray-700">
					<li class="flex items-start gap-2">
						<span class="text-gray-500 mt-1">•</span>
						<span
							><span class="font-medium">Slippage:</span> Final swap price may differ from displayed
							price, especially for large transactions</span
						>
					</li>
					<li class="flex items-start gap-2">
						<span class="text-gray-500 mt-1">•</span>
						<span
							><span class="font-medium">Front-running:</span> Other traders may execute similar trades
							before yours, affecting your price</span
						>
					</li>
					<li class="flex items-start gap-2">
						<span class="text-gray-500 mt-1">•</span>
						<span
							><span class="font-medium">ICPSwap Integration:</span> Third-party DEX risks including
							smart contract vulnerabilities and liquidity issues</span
						>
					</li>
					<li class="flex items-start gap-2">
						<span class="text-gray-500 mt-1">•</span>
						<span
							><span class="font-medium">Failed Transactions:</span> Network congestion may cause transaction
							failures while still charging gas fees</span
						>
					</li>
				</ul>
			</div>

			<!-- ICP Ecosystem Risks -->
			<div class="bg-gray-50 rounded-lg p-4 border-l-4 border-gray-400">
				<h3 class="text-lg text-gray-800 mb-3 flex items-center gap-2">
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9"
						/>
					</svg>
					ICP Ecosystem Risks
				</h3>
				<ul class="space-y-2 text-gray-700">
					<li class="flex items-start gap-2">
						<span class="text-gray-500 mt-1">•</span>
						<span
							><span class="font-medium">Network Dependency:</span> Platform relies on Internet Computer
							Protocol network stability</span
						>
					</li>
					<li class="flex items-start gap-2">
						<span class="text-gray-500 mt-1">•</span>
						<span
							><span class="font-medium">Ecosystem Maturity:</span> ICP DeFi ecosystem is newer compared
							to Ethereum, with fewer battle-tested protocols</span
						>
					</li>
					<li class="flex items-start gap-2">
						<span class="text-gray-500 mt-1">•</span>
						<span
							><span class="font-medium">Canister Risks:</span> Smart contracts (canisters) on ICP may
							have unique vulnerabilities</span
						>
					</li>
				</ul>
			</div>

			<!-- Technical Risks -->
			<div class="bg-gray-50 rounded-lg p-4 border-l-4 border-gray-400">
				<h3 class="text-lg text-gray-800 mb-3 flex items-center gap-2">
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
					Technical Risks
				</h3>
				<ul class="space-y-2 text-gray-700">
					<li class="flex items-start gap-2">
						<span class="text-gray-500 mt-1">•</span>
						<span
							><span class="font-medium">Smart Contract Bugs:</span> Unaudited or newly audited contracts
							may contain exploitable vulnerabilities</span
						>
					</li>
					<li class="flex items-start gap-2">
						<span class="text-gray-500 mt-1">•</span>
						<span
							><span class="font-medium">Wallet Security:</span> Loss of private keys/seed phrases means
							permanent loss of funds</span
						>
					</li>
					<li class="flex items-start gap-2">
						<span class="text-gray-500 mt-1">•</span>
						<span
							><span class="font-medium">Phishing:</span> Always verify you're on the correct website
							URL</span
						>
					</li>
					<li class="flex items-start gap-2">
						<span class="text-gray-500 mt-1">•</span>
						<span
							><span class="font-medium">Transaction Irreversibility:</span> Blockchain transactions
							cannot be reversed</span
						>
					</li>
				</ul>
			</div>

			<!-- Market & Financial Risks -->
			<div class="bg-gray-50 rounded-lg p-4 border-l-4 border-gray-400">
				<h3 class="text-lg text-gray-800 mb-3 flex items-center gap-2">
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
						/>
					</svg>
					Market & Financial Risks
				</h3>
				<ul class="space-y-2 text-gray-700">
					<li class="flex items-start gap-2">
						<span class="text-gray-500 mt-1">•</span>
						<span
							><span class="font-medium">Volatility:</span> Even stablecoins can experience price volatility</span
						>
					</li>
					<li class="flex items-start gap-2">
						<span class="text-gray-500 mt-1">•</span>
						<span
							><span class="font-medium">Liquidity Risk:</span> You may not be able to sell/swap your
							tokens when desired</span
						>
					</li>
					<li class="flex items-start gap-2">
						<span class="text-gray-500 mt-1">•</span>
						<span
							><span class="font-medium">Total Loss:</span> You could lose 100% of your investment</span
						>
					</li>
				</ul>
			</div>

			<!-- Regulatory & Legal Risks -->
			<div class="bg-gray-50 rounded-lg p-4 border-l-4 border-gray-400">
				<h3 class="text-lg text-gray-800 mb-3 flex items-center gap-2">
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
						/>
					</svg>
					Regulatory & Legal Risks
				</h3>
				<ul class="space-y-2 text-gray-700">
					<li class="flex items-start gap-2">
						<span class="text-gray-500 mt-1">•</span>
						<span
							><span class="font-medium">Regulatory Changes:</span> Future regulations may affect DUSD's
							legality or usability in your jurisdiction</span
						>
					</li>
					<li class="flex items-start gap-2">
						<span class="text-gray-500 mt-1">•</span>
						<span
							><span class="font-medium">Tax Obligations:</span> You are responsible for reporting and
							paying taxes on any gains</span
						>
					</li>
					<li class="flex items-start gap-2">
						<span class="text-gray-500 mt-1">•</span>
						<span
							><span class="font-medium">No Investor Protection:</span> Unlike traditional financial
							products, there's no insurance or government protection</span
						>
					</li>
				</ul>
			</div>

			<!-- For New Users -->
			<div class="bg-gray-50 rounded-lg p-4 border-l-4 border-gray-400 mb-48">
				<h3 class="text-lg text-gray-800 mb-3 flex items-center gap-2">
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
					Important Information for New Users
				</h3>
				<p class="text-gray-700 mb-2">If you're new to DeFi:</p>
				<ul class="space-y-2 text-gray-700">
					<li class="flex items-start gap-2">
						<span class="text-gray-500 mt-1">•</span>
						<span>Start with small amounts you can afford to lose</span>
					</li>
					<li class="flex items-start gap-2">
						<span class="text-gray-500 mt-1">•</span>
						<span>Understand that this is experimental technology</span>
					</li>
					<li class="flex items-start gap-2">
						<span class="text-gray-500 mt-1">•</span>
						<span>Keep your private keys secure and never share them</span>
					</li>
					<li class="flex items-start gap-2">
						<span class="text-gray-500 mt-1">•</span>
						<span>Consider the risks carefully before staking large amounts</span>
					</li>
				</ul>
			</div>

			<div class="h-0.5"></div>
		</div>
	</div>

	{#snippet footer()}
		<div class="w-full space-y-5">
			<Checkbox bind:checked={accepted}>I Understand and Accept the Risks</Checkbox>
			<Button class="w-full" disabled={!accepted} onclick={iAcceptRiskWarning}>Continue</Button>
		</div>
	{/snippet}
</Modal>
