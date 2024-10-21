<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher<{ change: { value: string } }>();

	function change(e: Event) {
		dispatch('change', { value: (e.target as HTMLInputElement).value });
	}
	export let value: string | null = '';
	export let label = '';
</script>

<div>
	<label for="text">{label}</label>
	<input
		type="text"
		name="text"
		placeholder="Text"
		aria-label="Text"
		bind:value
		on:input={(e) => change(e)}
	/>
</div>
