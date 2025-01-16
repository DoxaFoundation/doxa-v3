type CallbackFunction = () => void | Promise<void>;

export async function runOnDesktopExceptSafari(callback: CallbackFunction): Promise<void> {
	// Check if the device is not mobile and not Safari
	const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
		navigator.userAgent
	);
	const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
	const isDesktopWidth = window.innerWidth > 768; // You can adjust this threshold

	if (!isMobile && !isSafari && isDesktopWidth) {
		try {
			await callback();
		} catch (error) {
			console.error('Error in desktop callback:', error);
		}
	}
}
