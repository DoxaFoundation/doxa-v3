<script>
	import { allowOrDenyEmailPermission, isEmailPermissionAsked } from '@services/email.service';
	import { authStore } from '@stores/auth.store';
	import { isValidEmail } from '@utils/email.utils';
	import { Button, Helper, Input, Modal } from 'flowbite-svelte';
	import { Mail, MailPlus } from 'lucide-svelte';
	import { onDestroy } from 'svelte';

	let popupModal = $state(false);

	let email = $state('');
	let emailError = $state('');

	const unsubscribe = authStore.subscribe(async (authData) => {
		if (authData && authData?.isAuthenticated) {
			const condition = await isEmailPermissionAsked();

			if (!condition) {
				popupModal = true;
			}
		}
	});

	onDestroy(unsubscribe);

	const submitEmail = async () => {
		if (!email) {
			emailError = 'Email is required';
			return;
		}

		if (!isValidEmail(email)) {
			emailError = 'Enter valid email';
			return;
		}

		emailError = '';
		popupModal = false;
		await allowOrDenyEmailPermission(email);
	};

	const decline = () => {
		popupModal = false;
	};
</script>

<Modal bind:open={popupModal} size="xs">
	<div class="text-center space-y-4">
		<MailPlus class="mx-auto mb-4 text-gray-400 w-12 h-12 dark:text-gray-200" />
		<h3 class="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
			Get the latest updates, airdrop and upcoming features
		</h3>
		<!-- <p class="text-sm">
			Join our mailing list and be the first to know about new products and services.
		</p> -->
		<div>
			<Input
				type="email"
				placeholder="Your Email Address"
				bind:value={email}
				color={emailError ? 'red' : 'base'}
			>
				<Mail slot="left" class="w-4 h-4" />
			</Input>
			<Helper class="mt-2 text-left " color="red">
				{emailError}
			</Helper>
		</div>
		<Button color="blue" class="me-2 w-full" onclick={submitEmail}>Submit</Button>
		<!-- <Button onclick={decline} color="alternative">No Thanks</Button> -->
	</div>
</Modal>
