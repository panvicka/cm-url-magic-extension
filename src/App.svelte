<script lang="ts">
  import {
    evaluateEnvironment,
    evaluateLanguage,
    evaluatePath,
    evaluateTicketNumber,
  } from "./lib/helpers/inputEvaluationHelpers";
  import { linkCreator } from "./lib/helpers/linkCreator";
  import type { Link, userInfoType } from "./lib/types";
  import "./tailwind.css";

  // import {
  // 	evaluateEnvironment,
  // 	evaluateLanguage,
  // 	evaluatePath,
  // 	evaluateTicketNumberli
  // } from '$lib/helpers/inputEvaluationHelpers';
  // import { linkCreator } from '$lib/helpers/linkCreator';
  // import type { Link, userInfoType } from 'ßå$lib/types';
  import { onMount } from "svelte";

  let isActive: boolean = false;
  let activeTabUrl: string | undefined = "";

  let links: Link[] = [];

  let userInfo: userInfoType = {};

  // Listen for URL updates from the background script
  if (typeof chrome !== "undefined" && chrome.tabs) {
    chrome.runtime.onMessage.addListener((message) => {
      if (message.newUrl) {
        activeTabUrl = message.newUrl;
        isActiveUrlRelevant(); // Check URL relevance whenever the URL changes

        userInfo = {
          environment: undefined,
          ticketNumber: "",
          subdomain: "",
          secondLevelDomain: "",
          language: "",
          path: "",
        };

        if (activeTabUrl) {
          userInfo.environment = evaluateEnvironment(activeTabUrl);
          userInfo.ticketNumber = evaluateTicketNumber(activeTabUrl);
          userInfo.language = evaluateLanguage(activeTabUrl);
          userInfo.path = evaluatePath(
            activeTabUrl,
            userInfo.environment,
            userInfo.language,
          );
          // userInfo.optionalTicketNumber = evaluateTicketNumber(optionalUserInput);
        }
      }
    });
  }

  // Function to check if the active tab URL is relevant
  const isActiveUrlRelevant = () => {
    if (typeof chrome !== "undefined" && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length > 0 && tabs[0].url) {
          const environment = evaluateEnvironment(tabs[0].url);
          console.log(environment);
          console.log(tabs[0].url);
          if (environment?.name) {
            console.log("Relevant environment detected");
            activeTabUrl = tabs[0].url;
            isActive = true; // Update isActive here inside the callback
            if (activeTabUrl) {
              userInfo.environment = evaluateEnvironment(activeTabUrl);
              userInfo.ticketNumber = evaluateTicketNumber(activeTabUrl);
              userInfo.language = evaluateLanguage(activeTabUrl);
              userInfo.path = evaluatePath(
                activeTabUrl,
                userInfo.environment,
                userInfo.language,
              );
              // userInfo.optionalTicketNumber = evaluateTicketNumber(optionalUserInput);
            }
            links = linkCreator(userInfo);
            console.log(links);
          } else {
            isActive = false; // If the environment is not relevant, set to false
          }
        } else {
          isActive = false; // No active tab or URL found
        }
      });
    } else {
      isActive = false; // If chrome API is not available, default to false
    }
  };

  // Call this function when the component mounts
  onMount(() => {
    isActiveUrlRelevant(); // Check the active tab URL on mount
  });
</script>

<svelte:head>
  <title>You App Name</title>
  <link rel="stylesheet" href="/build/bundle.css" />
</svelte:head>

<main class="text-base">
  <div class="container">Is Active: {isActive.toString()}</div>
  <div class="container">Active Tab URL: {activeTabUrl}</div>

  <div class="container">
    {#each links as link}
      <div class="grid">
        <div>
          <a href={link.href} target="_blank">{link.name}</a>
          <small><a href={link.href} target="_blank">{link.href}</a></small>
        </div>

        <div>
          <button
            class="copy-to-clip-button"
            data-tooltip="Copy link"
            data-placement="right"
          >
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
        </div>
      </div>
      <hr />
    {/each}
  </div>
</main>
