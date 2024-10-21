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
	import { copy } from 'svelte-copy';
	import '@picocss/pico';
	import Footer from './Footer.svelte';

	let isActive: boolean = false;
	let activeTabUrl: string | undefined = '';

	let links: Link[] = [];

	let userInfo: userInfoType = {};

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
					const environment = evaluateEnvironment(tabs[0].url);
					console.log(environment);
					console.log(tabs[0].url);
					if (environment?.name) {
						activeTabUrl = tabs[0].url;
						isActive = true; // Update isActive here inside the callback

						if (environment.name === Environments.JIRA) {
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
		<div class="container">Sorry! Not sure what to do with this URL...</div>
	{:else}
		{#each links as link}
			<div class="grid .container-fluid">
				<a href={link.href} target="_blank" class="contrast">{link.name}</a>
				<div class="wrapper">
					<button use:copy={link.href}>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="1.5"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75"
							/>
						</svg>
					</button>
					<a href={link.href} target="_blank">{link.href}</a>
				</div>
			</div>
			<hr />
		{/each}
	{/if}
</main>

<Footer />

<style>
	button {
		margin-right: 1rem;
		padding: 0;
		width: 2rem;
		height: 2rem;
		background-color: transparent;
		border: none;
	}

	svg {
		width: 2rem;
		height: 2rem;
	}

	svg:hover {
		cursor: pointer;
		color: rgb(1, 170, 255);
	}

	main {
		padding: 2em;
		padding-bottom: 0;
	}

	.wrapper {
		display: flex;
		flex-direction: row;
	}

	.grid {
		align-items: center;
	}

	hr {
		margin: 0.5em;
	}
</style>
