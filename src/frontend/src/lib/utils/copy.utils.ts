import { toast } from 'svelte-sonner';

let toastId: string | number;

export function copyToClipboard(content: string) {
	navigator.clipboard
		.writeText(content)
		.then(() => {
			toastId = toast.success('Copied to clipboard!', { id: toastId });
		})
		.catch((err) => {
			console.error('Failed to copy text: ', err);
		});
}
