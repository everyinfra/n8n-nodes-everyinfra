import type {
	IAuthenticateGeneric,
	Icon,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class EveryInfraApi implements ICredentialType {
	name = 'everyInfraApi';

	displayName = 'EveryInfra API';

	icon: Icon = { light: 'file:../icons/everyinfra.svg', dark: 'file:../icons/everyinfra.dark.svg' };

	documentationUrl = 'https://everyinfra.com/docs';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			description: 'Create a key in the EveryInfra console at https://everyinfra.com/app',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://api.everyinfra.com',
			url: '/api/v1/account',
			method: 'GET',
		},
	};
}
