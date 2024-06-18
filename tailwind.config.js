/** @type {import('tailwindcss').Config} */
export default {
	darkMode: 'class',
	content: [
		'./src/frontend/src/**/*.{html,js,svelte,ts}',
		'./node_modules/flowbite-svelte/**/*.{html,js,svelte,ts}'
	],
	theme: {
		extend: {
			colors: {
				// flowbite-svelte
				primary: {
					50: '#f9f9f9',
					100: '#f2f2f2',
					200: '#e5e5e5',
					300: '#cccccc',
					400: '#999999',
					500: '#666666',
					600: '#4d4d4d',
					700: '#333333',
					800: '#1a1a1a',
					900: '#000000'
				}
			}
		}
	}
	// plugins: [require('flowbite/plugin')]
};
