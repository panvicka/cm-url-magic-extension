<script lang="ts">
	import {
		evaluateEnvironment,
		evaluateLanguage,
		evaluatePath,
		evaluateTicketNumber
	} from './lib/helpers/inputEvaluationHelpers';
	import { linkCreator } from './lib/helpers/linkCreator';
	import { Environments, type Link, type userInfoType } from './lib/types';
	import './tailwind.css';
	import { onMount } from 'svelte';
	import '@picocss/pico';
	import Footer from './Footer.svelte';
	import UserInputField from './UserInputField.svelte';
	import LinkWithCopyButton from './LinkWithCopyButton.svelte';

	let isActive: boolean = false;
	let activeTabUrl: string | undefined = '';

	let links: Link[] = [];

	let userInfo: userInfoType = {};

	let optionalInputUrlParam: string = '';

	let interestingLinks: Link[] = [
		{
			name: 'Preview Demo DE',
			href: 'https://preview.ksb-dev.bitgrip.berlin/demo-de-de'
		},
		{
			name: 'Preview Stage',
			href: 'https://preview.ksb-stage.bitgrip.berlin/de-de'
		},
		{
			name: 'Live Stage',
			href: 'https://live.ksb-stage.bitgrip.berlin/de-de'
		},
		{
			name: 'Preview Prod',
			href: 'https://preview-e2e-sales.ksb.com/de-de'
		},
		{
			name: 'CM Dev Studio',
			href: 'https://studio.ksb-dev.bitgrip.berlin'
		},
		{
			name: 'CM Stage Studio',
			href: 'https://studio.ksb-stage.bitgrip.berlin'
		},
		{
			name: 'CM Stage Prod',
			href: 'https://studio-e2e-sales.ksb.com'
		},
		{
			name: 'Localhost node-app',
			href: 'http://localhost:8081/demo-de-de/'
		},
		{
			name: 'Storybook',
			href: 'http://localhost:5010'
		},
		{
			name: 'AT Monitor',
			href: 'https://jenkins.infra.bitgrip.berlin/job/KSB/view/AT-Monitor/'
		}
	];

	// Listen for URL updates from the background script
	if (typeof chrome !== 'undefined' && chrome.tabs) {
		chrome.runtime.onMessage.addListener((message) => {
			if (message.newUrl) {
				activeTabUrl = message.newUrl;
				isActiveUrlRelevant(); // Check URL relevance whenever the URL changes

				userInfo = {
					environment: undefined,
					ticketNumber: '',
					subdomain: '',
					secondLevelDomain: '',
					language: '',
					path: ''
				};

				if (activeTabUrl) {
					userInfo.environment = evaluateEnvironment(activeTabUrl);
					userInfo.ticketNumber = evaluateTicketNumber(activeTabUrl);
					userInfo.language = evaluateLanguage(activeTabUrl);
					userInfo.path = evaluatePath(activeTabUrl, userInfo.environment, userInfo.language);
					// userInfo.optionalTicketNumber = evaluateTicketNumber(optionalUserInput);
				}
			}
		});
	}

	const isActiveUrlRelevant = () => {
		if (typeof chrome !== 'undefined' && chrome.tabs) {
			chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
				if (tabs.length > 0 && tabs[0].url) {
					console.log(tabs[0].url);
					const environment = evaluateEnvironment(tabs[0].url);
					console.log(environment);
					console.log(tabs[0].url);
					if (environment?.name) {
						activeTabUrl = tabs[0].url;
						isActive = true; // Update isActive here inside the callback

						if (environment.name === Environments.JIRA) {
							userInfo.environment = evaluateEnvironment(activeTabUrl);
							userInfo.ticketNumber = evaluateTicketNumber(activeTabUrl);
						} else {
							// Re-evaluate and update userInfo and links for the new valid URL
							userInfo.environment = evaluateEnvironment(activeTabUrl);
							userInfo.ticketNumber = evaluateTicketNumber(activeTabUrl);
							userInfo.language = evaluateLanguage(activeTabUrl);
							userInfo.path = evaluatePath(activeTabUrl, userInfo.environment, userInfo.language);
						}

						links = linkCreator(userInfo); // Update links for the new URL
						console.log(links);
						console.log(userInfo?.environment?.name);
					} else {
						// Invalid URL: Reset the state
						isActive = false;
						links = []; // Clear the links if the URL is invalid
						activeTabUrl = ''; // Clear the active URL
						console.log('Invalid URL or irrelevant environment');
					}
				} else {
					// No active tab or URL found, reset state
					isActive = false;
					links = [];
					activeTabUrl = '';
					console.log('No active tab or URL found');
				}
			});
		} else {
			// If chrome API is not available, reset state
			isActive = false;
			links = [];
			activeTabUrl = '';
			console.log('Chrome API not available');
		}
	};

	// Call this function when the component mounts
	onMount(() => {
		isActiveUrlRelevant(); // Check the active tab URL on mount
	});
</script>

<svelte:head>
	<title>CM URL Magic Extension</title>
	<link rel="stylesheet" href="/build/bundle.css" />
</svelte:head>

<main>
	{#if !isActive}
		<div class="container-fluid">
			<h6>Sorry! Not sure what to do with this URL... here some convenient links for you!</h6>
		</div>
		{#each interestingLinks as interestingLink}
			<LinkWithCopyButton link={interestingLink} />
			<hr />
		{/each}
	{:else}
		{#each links as link}
			<LinkWithCopyButton {link} />
			<hr />
		{/each}
	{/if}

	{#if userInfo?.environment?.name !== Environments.JIRA && isActive}
		<form>
			<fieldset>
				<UserInputField
					bind:value={optionalInputUrlParam}
					on:change={() => {
						console.log(optionalInputUrlParam);
						userInfo.optionalTicketNumber = evaluateTicketNumber(optionalInputUrlParam);
						links = linkCreator(userInfo); // Update links for the new URL
					}}
					label="Optional ticket number if needed..."
				/>
			</fieldset>
		</form>
	{/if}
</main>

<footer>
	<Footer />
</footer>

<style>
	main {
		padding: 2em;
		padding-bottom: 0;
	}

	hr {
		margin: 0.5em;
	}
</style>
