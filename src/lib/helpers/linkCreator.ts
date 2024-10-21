import {
	DEFAULT_LANG,
	DEFAULT_PROD_LANG,
	Environments,
	type Link,
	type userInfoType
} from '../types';

const getLocalHostPath = ({ language, path }: { language?: string; path: string }) => {
	return [
		{
			name: 'Localhost',
			href: `http://localhost:8081/${language || DEFAULT_PROD_LANG}/${path}`
		}
	];
};

const getJiraTicketPath = ({ ticketNumber }: { ticketNumber?: string }) => {
	if (!ticketNumber) return [];
	return [
		{
			name: 'Jira Ticket',
			href: `https://bitgrip.atlassian.net/browse/KSBP-${ticketNumber}`
		}
	];
};

const getProdPreviewPath = ({ language, path }: { language?: string; path: string }) => {
	return [
		{
			name: 'Prod Preview',
			href: `https://preview-e2e-sales.ksb.com/${language || DEFAULT_PROD_LANG}/${path}`
		}
	];
};

const getProdPath = ({ language, path }: { language?: string; path: string }) => {
	return [
		{
			name: 'Prod',
			href: `https://www.ksb.com/${language || DEFAULT_PROD_LANG}/${path}`
		},
		{
			name: 'CM Prod Content',
			href: `https://live-resources-e2e-sales.ksb.com/api/v1/page/${language}/${path}`
		}
	];
};

const getStagePreviewPath = ({ language, path }: { language?: string; path: string }) => {
	return [
		{
			name: 'Stage Preview',
			href: `https://preview.ksb-stage.bitgrip.berlin/${language}/${path}`
		},
		{
			name: 'CM Stage Preview Content',
			href: `https://preview-api.ksb-stage.bitgrip.berlin/api/v1/page/${language}/${path}`
		}
	];
};

const getDevPath = ({ language, path }: { language?: string; path: string }) => {
	return [
		{
			name: 'Dev Preview',
			href: `https://preview.ksb-dev.bitgrip.berlin/${language || DEFAULT_LANG}/${path}`
		},
		{
			name: 'CM Dev Preview Content',
			href: `https://preview-api.ksb-dev.bitgrip.berlin/api/v1/page/${language || DEFAULT_LANG}/${path}`
		}
	];
};

const getBranchDeploymentPaths = ({
	ticketNumber,
	language,
	path
}: {
	ticketNumber?: string;
	language?: string;
	path?: string;
}) => {
	const links: Link[] = [];
	if (!ticketNumber) return links;
	return [
		{
			name: 'Branch Deployment',
			href: `https://ksbp-${ticketNumber}.ksb-dev.bitgrip.berlin/${language || DEFAULT_LANG}/${path}`
		}
	];
};
export const linkCreator = (userInfo: userInfoType) => {
	const {
		language = DEFAULT_LANG,
		path = '',
		ticketNumber,
		optionalTicketNumber,
		environment
	} = userInfo;
	let links: Link[] = [];

	if (ticketNumber || optionalTicketNumber) {
		let useTicketNumber = ticketNumber || optionalTicketNumber;
		if (ticketNumber && optionalTicketNumber) {
			useTicketNumber = optionalTicketNumber;
		}

		links = [
			...links,
			...getBranchDeploymentPaths({
				ticketNumber: useTicketNumber,
				language: language,
				path
			})
		];

		links = [
			...links,
			...getJiraTicketPath({ ticketNumber: ticketNumber || optionalTicketNumber })
		];
	}

	if (environment?.name === Environments.PROD) {
		links = [
			...links,
			...getProdPreviewPath({ language, path }),
			...getStagePreviewPath({ language, path }),
			...getLocalHostPath({ language, path })
		];
	}
	if (environment?.name === Environments.PROD_PREVIEW) {
		links = [
			...links,
			...getProdPath({ language, path }),
			...getStagePreviewPath({ language, path }),
			...getLocalHostPath({ language, path })
		];
	}

	if (environment?.name === Environments.DEV_PREVIEW) {
		links = [
			...links,
			...getStagePreviewPath({ language, path }),
			...getLocalHostPath({ language, path })
		];
	}

	if (environment?.name === Environments.STAGE_PREVIEW) {
		links = [...links, ...getDevPath({ language, path }), ...getLocalHostPath({ language, path })];
	}

	if (environment?.name === Environments.LOCALHOST) {
		links = [
			...links,
			...getDevPath({ language, path }),
			...getProdPath({ language, path }),
			...getStagePreviewPath({ language, path })
		];
	}

	return links;
};
