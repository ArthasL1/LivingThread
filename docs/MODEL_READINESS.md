# Model Readiness and Initial Selection

Checked on September 11, 2026 using the owner's Azure endpoint and local environment file. The owner authorizes small comparison requests and reports sufficient Azure budget. Credentials were used only for request authentication, were not displayed or copied into reports, and `.env` is covered by the existing Git ignore rule. The environment file was not modified.

## Initial choice

Use the owner's preferred **gpt-5.6-sol** deployment as the single model for the initial prototype. This is a selection for implementation, not an implemented model integration. Separate model calls may perform different reasoning steps without requiring multiple model deployments. Keep the deployment configurable later; there is no current need for model routing or an ensemble.

OpenAI describes Sol as a flagship model for complex professional work and documents structured outputs and function calling. Our Azure calls independently verified the limited capabilities below. Neither the official description nor these small tests establishes that Sol is the most intelligent of all fourteen listed deployments. The other eleven deployments were not tested. See the [official Sol model page](https://developers.openai.com/api/docs/models/gpt-5.6-sol) and [Azure Responses API documentation](https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/responses).

Use `low` reasoning as the first configuration to evaluate during the event, since it was accepted here. Determine the appropriate effort on actual LivingThread cases during the official build period. Do not assume these short generic requests predict long-context semantic accuracy or production latency.

## Checks performed

Requests used `/openai/v1/responses`, `store: false`, and `reasoning.effort: low`. Each model received one connectivity request, three strict JSON-schema inventory exercises, and three generic multiplication function-call requests. The function was proposed only; no external tool was executed. The capability requests capped output at 512 tokens.

| Requested deployment | Connectivity | JSON cases passed | Function-call cases passed | JSON completion median, n=3 | Function-call median, n=3 | Function-call range |
| --- | --- | --- | --- | --- | --- | --- |
| gpt-5.6-sol | HTTP 200 | 3/3 | 3/3 | 2.942 s | 2.745 s | 1.982-8.063 s |
| gpt-5.6-terra | HTTP 200 | 3/3 | 3/3 | 3.167 s | 2.581 s | 2.551-5.718 s |
| gpt-5.6-luna | HTTP 200 | 3/3 | 3/3 | 3.261 s | 2.790 s | 2.406-4.811 s |

The API's returned model strings matched the requested deployments. This is reported API metadata, not independent attestation of the serving infrastructure.

Latency is local non-streaming wall time through receipt and decoding of the complete response. It includes network and server delay. The function-call repeats were added after Sol's first 8.063-second result to examine variability. Each category has only three samples; differences of a few tenths of a second are not reliable rankings. No time-to-first-token or real application end-to-end latency was measured.

Total: **21 successful requests**, with **2,064 total tokens reported by the API**. Actual Azure charges were not queried or inferred from public OpenAI prices. The generic cases used no Slack messages, Google Docs text, Gmail data, or LivingThread semantic prompts.

The [machine-readable results](AZURE_API_CHECK_RESULTS.json) include synthetic inputs, expected JSON, per-request timings, returned usage, and summaries. These are environment-readiness observations; no product adapter, core prompt, or agent workflow has been implemented.
