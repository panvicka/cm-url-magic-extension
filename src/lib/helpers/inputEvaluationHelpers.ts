import { Environment, Environments, type EnvironmentType } from '../types';

export const evaluateEnvironment = (userInputValue: string) => {
	let foundEnvironment: EnvironmentType | undefined;
	if (userInputValue.includes('ksb.com')) {
		foundEnvironment = Environment.find((env) => env.name === Environments.PROD);
	}

	if (userInputValue.includes('preview-e2e-sales')) {
		foundEnvironment = Environment.find((env) => env.name === Environments.PROD_PREVIEW);
	}

	if (userInputValue.includes('ksb-dev')) {
		foundEnvironment = Environment.find((env) => env.name === Environments.DEV_PREVIEW);
	}

	if (userInputValue.includes('ksb-stage') && !userInputValue.includes('preview')) {
		foundEnvironment = Environment.find((env) => env.name === Environments.STAGE);
	}

	if (userInputValue.includes('ksb-stage') && userInputValue.includes('preview')) {
		foundEnvironment = Environment.find((env) => env.name === Environments.STAGE_PREVIEW);
	}

	if (userInputValue.includes('localhost')) {
		foundEnvironment = Environment.find((env) => env.name === Environments.LOCALHOST);
	}

	if (userInputValue.includes('bitgrip.atlassian.net/browse')) {
		foundEnvironment = Environment.find((env) => env.name === Environments.JIRA);
	}

	return foundEnvironment;
};

export const evaluateLanguage = (userInputValue: string) => {
	const regexToMatchLanguage = /(?:\/|^)([a-z]{2}(?:-[a-z]{2})?)(?:\/|$)/;
	const regexToMatchDemoLanguage = /(?:^|\/)(demo-[a-z]{2}-[a-z]{2})(?:\/|$)/;
	let language: string = '';
	let matchedLanguage = userInputValue.match(regexToMatchDemoLanguage);

	if (matchedLanguage) {
		language = matchedLanguage[1];
	} else {
		matchedLanguage = userInputValue.match(regexToMatchLanguage);
		if (matchedLanguage) {
			language = matchedLanguage[1];
		}
	}
	return language;
};

export const evaluateTicketNumber = (userInputValue: string) => {
	const regexToMatchOnlyTheTicketNumbers = /KSBP-(\d+)/i;
	const matchedTicketNumber = userInputValue.match(regexToMatchOnlyTheTicketNumbers);
	if (matchedTicketNumber && matchedTicketNumber[1]) {
		return matchedTicketNumber[1];
	} else {
		return undefined;
	}
};

export const evaluatePath = (
	userInputValue: string,
	environment?: EnvironmentType,
	language?: string
) => {
	const regexToMatchTheRestOfTheURLLocalhost = /http:\/\/localhost:8081(\/.*)/;
	const regexToMatchTheRestOfTheURL = /\.berlin(\/.*)/;
	const regexToMatchTheRestOfTheURLProd = /\.ksb.com(\/.*)/;
	let matchedRestURL: RegExpMatchArray | null;
	let path = '';
	if (environment?.name === Environments.PROD || environment?.name === Environments.PROD_PREVIEW) {
		matchedRestURL = userInputValue.match(regexToMatchTheRestOfTheURLProd);
		if (matchedRestURL) {
			path = matchedRestURL[1];
			path = language ? path?.replace(language, '') : path;
			path = path.replace(/^\/+/, '');
		}
	} else if (environment?.name === Environments.LOCALHOST){
		matchedRestURL = userInputValue.match(regexToMatchTheRestOfTheURLLocalhost);
		if (matchedRestURL) {
			path = matchedRestURL[1];
			path = language ? path?.replace(language, '') : path;
			path = path.replace(/^\/+/, '');
		}
	} else {
		matchedRestURL = userInputValue.match(regexToMatchTheRestOfTheURL);
		if (matchedRestURL) {
			path = matchedRestURL[1];
			path = language ? path?.replace(language, '') : path;
			path = path.replace(/^\/+/, '');
		}
	}
	return path;
};
