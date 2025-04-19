<script>
	import LabelValuePair from './LabelValuePair.svelte';

	const label = 'Test Label';
	const value = 'Test Value';
	const tip = 'Helpful tooltip';
</script>

<LabelValuePair {label} {value} {tip}>
	<span data-testid="child">Child</span>
</LabelValuePair>
