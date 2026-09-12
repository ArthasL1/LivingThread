# Architecture and implementation boundaries

LivingThread runs as a Manifest V3 extension and a local Node.js service. Application observation is enabled by a work session. Model output proposes grounded findings and actions; execution requires a separate human approval followed by deterministic validation.

## Code map

| File | Responsibility |
| --- | --- |
| [`extension/background.js`](../extension/background.js) | Paired service communication, source/tab routing, Docs exports, and restricted debugger bridge |
| [`extension/content/runtime.js`](../extension/content/runtime.js) | Shared content-script observation/state/action messaging |
| [`extension/content/ui.js`](../extension/content/ui.js) | Shadow DOM notices, evidence, exact edit previews, clarification, and results |
| [`extension/content/docs.js`](../extension/content/docs.js) | Doc identity, reading coordination, and editor save checks |
| [`extension/content/gmail.js`](../extension/content/gmail.js) | Open-composer identity, text observations, exact edits, and save checks |
| [`extension/popup.js`](../extension/popup.js) | Connection, work-session controls, and diagnostics |
| [`server/main.mjs`](../server/main.mjs) | Local HTTP routes, orchestration, analysis scheduling, and action dispatch |
| [`server/agent.mjs`](../server/agent.mjs) | Azure Responses requests, semantic instructions, structured-output validation, and grounding |
| [`server/state.mjs`](../server/state.mjs) | Observations, freshness, findings, source versions, and action preconditions |
| [`server/slack.mjs`](../server/slack.mjs) | Socket Mode, bounded history, message updates, and reviewed bot replies |
| [`server/journal.mjs`](../server/journal.mjs) | Serialized, checksum-protected atomic operation persistence and recovery |

The runtime uses native JavaScript and Node.js APIs with no third-party npm dependencies. It has no runtime dependency on OpenAI Codex or a browser-control MCP server.

## Analysis and action sequence

1. The extension or Slack adapter supplies a source observation with identity, text, version, freshness, and coverage context.
2. The local service assembles bounded context for the configured Azure model. Instructions distinguish genuine incompatibility from omitted detail, historical facts, tentative plans, different purposes, and unrelated events.
3. Structured findings must pass grounding and action validation before they appear in the affected page's review UI.
4. The user reviews quoted evidence and exact replacements, or supplies an explanation for reconsideration. An explanation alone does not approve an edit.
5. On approval, the service checks current source versions and unique exact targets, journals the attempt, and dispatches the specific action to its adapter.
6. The adapter checks the target, executes the approved change, and verifies the resulting text and application save state. A Slack reply is verified using the API response and target thread.
7. Results return to the in-page review UI. Fresh observations can trigger another semantic check. A later model failure does not erase an already verified save.

## Integration coverage

| Environment | Actual approach | Boundary |
| --- | --- | --- |
| Google Docs | Signed-in authenticated text export in the extension worker; native Find and replace through a restricted debugger bridge for approved edits | Short text fixtures verified, including reload persistence. Multi-tab/complex documents unverified; coverage reported partial. |
| Gmail | Content scripts observe subject/body of current composers; recheck identity and exact text before editing; verify save indication | No inbox crawl, closed-draft monitoring, attachments, or email sending. A reloaded composer gets a new identity and cannot recover its earlier in-page receipt. |
| Slack | Socket Mode events and Web API; allowed channels only; at most 15 initial channel messages; edits/deletions supported by the adapter | Older thread replies and file contents are not backfilled. Live message edit/deletion behavior remains unverified. A browser Slack tab is not required for event delivery. |

Docs reads use a 30-second idle export cache, refreshes for relevant saved changes/explicit requests, and a 60-second backoff after HTTP 429. These reduce polling; they do not guarantee continuous freshness. Closed/unavailable sources are not treated as live evidence. Slack reconnection does not establish complete historical coverage.

## Data and action boundaries

- The service binds to `127.0.0.1:4317` and pairs with one extension identity. Keep the pairing credential private.
- Starting a session enables observation of matching open Docs pages and Gmail composers in that profile and configured Slack channels. Per-account/document exclusion controls are not implemented.
- Observed text, source titles/URLs, limited application context, and clarifications go to the configured Azure model. Requests specify `store: false`; Azure resource data-handling settings still apply. This is not an entirely offline product.
- Observations and findings live in service memory. `.runtime/` stores private pairing information, operation metadata/status, and local diagnostics; the extension stores its pairing token locally. Model/API credentials remain in service configuration.
- Pausing stops new observation and cancels analysis, but does not erase observed context or undo already-started operations.
- No edit or Slack message is dispatched without explicit approval of the specific proposed action. Gmail sending is absent.

## Failures and recovery

Every proposed edit requires a unique exact target and version checks. The journal records attempts before dispatch. Timeout or unverifiable results are **uncertain**, rather than successful. Interrupted queued/running operations recover as uncertain and are never blindly replayed after restart.

Read-only model analysis retries a timeout or transport failure at most once after two seconds. Pausing cancels the analysis and pending retry. Validation, refusal, and HTTP failures are not automatically retried. Actions are not retried by the analysis retry mechanism.

Analysis is bounded to 40 sources, 50,000 characters per source, and 160,000 characters overall. Exceeding these limits reports an error. Long-running sessions and broad workspaces are not validated. Source coverage and known interruptions remain explicit.

See [live acceptance](LIVE_ACCEPTANCE.md) for actual saved edits, reload checks, Slack delivery, and resolved failures; [semantic evaluation](SEMANTIC_EVALUATION.json) for the focused model calls; and [`tests/`](../tests/) for automated checks.
