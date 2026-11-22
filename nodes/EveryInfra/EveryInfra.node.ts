import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestOptions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError, NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

const BASE_URL = 'https://api.everyinfra.com';

const SEARCH_TOOLS = [
	['crawl', 'Crawl several pages of one site and return their text'],
	['crosscheck', 'Run one question through several retrieval chains and rank sources by agreement'],
	['deep', 'In-depth search with a text summary per result'],
	['forum', 'Search discussions written by real people'],
	['harvest', 'Structured extraction from a site (long-running)'],
	['lens', 'Reverse image search'],
	['map', 'List the URLs of a site'],
	['media', 'Find images and videos by keyword'],
	['news', 'News search'],
	['places', 'Places and local business search'],
	['read', 'Fetch the main text of a URL'],
	['scholar', 'Academic papers or patents'],
	['semantic', 'Natural-language semantic search'],
	['shopping', 'Product search and price comparison'],
	['similar', 'Find pages similar to a URL'],
	['suggest', 'Search autocomplete suggestions'],
	['web', 'General web search'],
].map(([value, description]) => ({ name: value, value, description }));

function parseJsonParameter(
	context: IExecuteFunctions,
	name: string,
	itemIndex: number,
): IDataObject {
	const raw = context.getNodeParameter(name, itemIndex, '{}') as string | IDataObject;
	if (typeof raw === 'object' && raw !== null) return raw;
	if (!raw || raw.trim() === '') return {};
	let parsed: unknown;
	try {
		parsed = JSON.parse(raw);
	} catch {
		parsed = undefined;
	}
	if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
		throw new NodeOperationError(context.getNode(), `"${name}" must be a JSON object`, {
			itemIndex,
		});
	}
	return parsed as IDataObject;
}

function buildRequest(context: IExecuteFunctions, itemIndex: number): IHttpRequestOptions {
	const resource = context.getNodeParameter('resource', itemIndex) as string;
	const operation = context.getNodeParameter('operation', itemIndex) as string;
	const options: IHttpRequestOptions = {
		method: 'GET',
		baseURL: BASE_URL,
		url: '',
		json: true,
		headers: { 'User-Agent': 'n8n-nodes-everyinfra' },
	};

	if (resource === 'data' && operation === 'call') {
		options.method = 'POST';
		options.url = '/api/v1/social';
		options.body = {
			platform: context.getNodeParameter('platform', itemIndex) as string,
			action: context.getNodeParameter('action', itemIndex) as string,
			params: parseJsonParameter(context, 'params', itemIndex),
		};
	} else if (resource === 'data' && operation === 'catalog') {
		options.url = '/api/v1/social/catalog';
		const platform = context.getNodeParameter('catalogPlatform', itemIndex, '') as string;
		options.qs = platform ? { platform } : { compact: 1 };
	} else if (resource === 'search') {
		options.method = 'POST';
		options.url = '/api/v1/search';
		options.body = {
			tool: context.getNodeParameter('tool', itemIndex) as string,
			params: parseJsonParameter(context, 'searchParams', itemIndex),
		};
	} else if (resource === 'captcha') {
		options.method = 'POST';
		options.url = '/api/v1/captcha';
		options.body = {
			...parseJsonParameter(context, 'captchaParams', itemIndex),
			type: context.getNodeParameter('captchaType', itemIndex) as string,
		};
	} else if (resource === 'account') {
		options.url = '/api/v1/account';
	} else {
		throw new NodeOperationError(
			context.getNode(),
			`Unsupported operation "${resource}: ${operation}"`,
			{ itemIndex },
		);
	}
	return options;
}

export class EveryInfra implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'EveryInfra',
		name: 'everyInfra',
		icon: { light: 'file:everyinfra.svg', dark: 'file:everyinfra.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["resource"] + ": " + $parameter["operation"]}}',
		description:
			'Structured public data from 106 platforms, web search and CAPTCHA solving with one API key',
		defaults: {
			name: 'EveryInfra',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		credentials: [
			{
				name: 'everyInfraApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Account', value: 'account' },
					{ name: 'CAPTCHA', value: 'captcha' },
					{ name: 'Data', value: 'data' },
					{ name: 'Web Search', value: 'search' },
				],
				default: 'data',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['data'] } },
				options: [
					{
						name: 'Call Capability',
						value: 'call',
						description: 'Run one platform capability, for example xiaohongshu search',
						action: 'Call a data capability',
					},
					{
						name: 'List Capabilities',
						value: 'catalog',
						description: 'List platforms, actions, required parameters and prices',
						action: 'List data capabilities',
					},
				],
				default: 'call',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['search'] } },
				options: [
					{
						name: 'Run Tool',
						value: 'search',
						description: 'Run one web search tool',
						action: 'Run a web search tool',
					},
				],
				default: 'search',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['captcha'] } },
				options: [
					{
						name: 'Solve',
						value: 'solve',
						description: 'Solve a CAPTCHA and return a ready-to-use solution',
						action: 'Solve a CAPTCHA',
					},
				],
				default: 'solve',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['account'] } },
				options: [
					{
						name: 'Get',
						value: 'get',
						description: 'Get the balance, rate limit and last 24 hours of usage',
						action: 'Get account balance and usage',
					},
				],
				default: 'get',
			},
			{
				displayName: 'Platform',
				name: 'platform',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'xiaohongshu',
				description:
					'Platform ID from the capability list, for example tiktok, amazon, google_maps or xiaohongshu',
				displayOptions: { show: { resource: ['data'], operation: ['call'] } },
			},
			{
				displayName: 'Action',
				name: 'action',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'search',
				description: 'Action ID on that platform, for example search, comments or profile',
				displayOptions: { show: { resource: ['data'], operation: ['call'] } },
			},
			{
				displayName: 'Parameters (JSON)',
				name: 'params',
				type: 'json',
				required: true,
				default: '{\n  "keyword": "AI tools",\n  "limit": 20\n}',
				description:
					'Parameters of the capability. Unknown parameters are rejected with an error that lists the accepted ones.',
				displayOptions: { show: { resource: ['data'], operation: ['call'] } },
			},
			{
				displayName: 'Platform Filter',
				name: 'catalogPlatform',
				type: 'string',
				default: '',
				placeholder: 'tiktok',
				description:
					'Leave empty to list every platform; set a platform ID to also get its optional parameters and returned fields',
				displayOptions: { show: { resource: ['data'], operation: ['catalog'] } },
			},
			{
				displayName: 'Tool',
				name: 'tool',
				type: 'options',
				options: SEARCH_TOOLS,
				default: 'web',
				displayOptions: { show: { resource: ['search'] } },
			},
			{
				displayName: 'Parameters (JSON)',
				name: 'searchParams',
				type: 'json',
				required: true,
				default: '{\n  "q": "best web scraping API",\n  "num": 10\n}',
				description: 'Parameters of the tool, for example q, URL, num',
				displayOptions: { show: { resource: ['search'] } },
			},
			{
				displayName: 'CAPTCHA Type',
				name: 'captchaType',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'turnstile',
				description: 'Type ID, for example turnstile, recaptcha_v2 or hcaptcha. See https://everyinfra.com/captcha.',
				displayOptions: { show: { resource: ['captcha'] } },
			},
			{
				displayName: 'Parameters (JSON)',
				name: 'captchaParams',
				type: 'json',
				required: true,
				default: '{\n  "website_url": "https://example.com",\n  "website_key": ""\n}',
				description: 'Parameters required by the CAPTCHA type',
				displayOptions: { show: { resource: ['captcha'] } },
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			const options = buildRequest(this, itemIndex);
			try {
				const response = (await this.helpers.httpRequestWithAuthentication.call(
					this,
					'everyInfraApi',
					options,
				)) as IDataObject;
				returnData.push({ json: response, pairedItem: { item: itemIndex } });
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message },
						pairedItem: { item: itemIndex },
					});
					continue;
				}
				throw new NodeApiError(this.getNode(), error as JsonObject, { itemIndex });
			}
		}

		return [returnData];
	}
}
