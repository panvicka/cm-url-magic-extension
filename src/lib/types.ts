const DEV_SUBDOMAIN = 'ksb-dev.bitgrip.berlin';
export const DEFAULT_LANG = 'demo-de-de';
export const DEFAULT_PROD_LANG = 'de-de';
export const DEFAULT_ENV = 'demo-de-de';

export type userInfoType = {
	ticketNumber?: string;
	subdomain?: string;
	secondLevelDomain?: string;
	language?: string;
	path?: string;
	environment?: EnvironmentType;
	optionalTicketNumber?: string;
};


export type Link = {
	name: string;
	href: string;
	isWorking?: boolean;
};


export enum Environments {
	DEV_PREVIEW = 'DEV_PREVIEW',
	STAGE = 'STAGE',
	STAGE_PREVIEW = 'STAGE_PREVIEW',
	PROD = 'PROD',
	PROD_PREVIEW = 'PROD_PREVIEW',
	LOCALHOST = 'LOCALHOST'
}

export type EnvironmentType = {
	name: Environments;
	label: string;
	path: string;
};

export const Environment: EnvironmentType[] = [
	{
		name: Environments.DEV_PREVIEW,
		label: 'preview dev',
		path: `preview.${DEV_SUBDOMAIN}`
	},
	{
		name: Environments.STAGE,
		label: 'stage',
		path: `stage.${DEV_SUBDOMAIN}`
	},
	{
		name: Environments.STAGE_PREVIEW,
		label: 'preview stage',
		path: `preview-stage.${DEV_SUBDOMAIN}`
	},
	{
		name: Environments.PROD,
		label: 'production',
		path: 'ksb.com'
	},
	{
		name: Environments.PROD_PREVIEW,
		label: 'preview prod',
		path: 'preview-e2e-sales.ksb.com'
	},
	{
		name: Environments.LOCALHOST,
		label: 'localhost',
		path: 'localhost:8081'
	}
];
