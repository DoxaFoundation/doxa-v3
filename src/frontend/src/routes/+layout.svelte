<script>
	import Navbar from '$lib/components/Navbar.svelte';
	import '../app.css';
</script>

<div class="relative px-8">
	<Navbar />
	<div class="overflow-scroll pb-16 mt-20">
		<slot />
	</div>
</div>
