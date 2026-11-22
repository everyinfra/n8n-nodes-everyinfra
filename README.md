# n8n-nodes-everyinfra

This is an n8n community node for [EveryInfra](https://everyinfra.com). It gives your n8n workflows one API key for three things:

- **Data**: structured public data from 106 platforms (714 capabilities), for example TikTok, Amazon, Google Maps, Xiaohongshu, Reddit and LinkedIn.
- **Web Search**: 17 search and reading tools (web, news, forum, scholar, shopping, places, read, crawl, map and more).
- **CAPTCHA**: solve 52 CAPTCHA types and get a ready-to-use token.

The node is marked `usableAsTool`, so an n8n AI Agent can call it as a tool.

[Installation](#installation) · [Credentials](#credentials) · [Operations](#operations) · [Examples](#examples) · [Resources](#resources)

## Installation

Follow the [community nodes installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) and install the package `n8n-nodes-everyinfra`.

## Credentials

1. Create an API key in the [EveryInfra console](https://everyinfra.com/app).
2. In n8n, add an **EveryInfra API** credential and paste the key.

The credential test calls `GET /api/v1/account`, which is free.

## Operations

| Resource | Operation | API call |
|---|---|---|
| Data | Call Capability | `POST /api/v1/social` with `platform`, `action`, `params` |
| Data | List Capabilities | `GET /api/v1/social/catalog` (all platforms, or one platform with its parameters and fields) |
| Web Search | Run Tool | `POST /api/v1/search` with `tool`, `params` |
| CAPTCHA | Solve | `POST /api/v1/captcha` with `type` and the type's parameters |
| Account | Get | `GET /api/v1/account` (balance, rate limit, last 24 hours of usage) |

Parameters are passed as JSON because each of the 714 capabilities has its own parameters. Use **List Capabilities** with a platform ID to see what a capability accepts. An unknown parameter or a wrong value returns a 422 error that lists the accepted parameters, so the request is not charged.

## Examples

**Search Xiaohongshu notes**

- Resource: Data, Operation: Call Capability
- Platform: `xiaohongshu`, Action: `search`
- Parameters: `{"keyword": "AI tools", "limit": 20}`

**Search the web**

- Resource: Web Search, Tool: `web`
- Parameters: `{"q": "best web scraping API", "num": 10}`

**Read a page as text**

- Resource: Web Search, Tool: `read`
- Parameters: `{"url": "https://example.com/article"}`

## Billing

Calls are billed per request in USD from your EveryInfra balance; prices are listed on each platform page and on [everyinfra.com/pricing](https://everyinfra.com/pricing). Failed calls and empty results are not charged.

## Compatibility

Tested with n8n 1.x and `@n8n/node-cli` 0.57.

## Resources

- [EveryInfra documentation](https://everyinfra.com/docs)
- [Full API reference for AI agents (llms-full.txt)](https://everyinfra.com/llms-full.txt)
- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)

## License

[MIT](LICENSE.md)
