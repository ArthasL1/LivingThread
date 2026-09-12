# Implementation Contract

Core build started September 12, 2026 at 02:54 UTC, following the owner's explicit confirmation that the official hackathon had started. The root agent owns architecture, integration, acceptance, commits, and repository updates. Contributors own only their assigned modules; no mutual audit or freeze process.

## Runtime

Native ESM JavaScript, Node 22+ built-ins, Manifest V3 Chromium extension. No build step for the extension. Local service on 127.0.0.1:4317. Runtime observations and credentials never enter Git. English user-facing copy. Root handles HTTP, session state, extension background, Docs adapter, and integration.

## Observation

`{ id, app, resourceId, url, title, text, observedAt, coverage, editable, account?, context? }`

- All IDs, text and timestamps are strings; app is `gmail`, `docs`, or `slack`.
- `id` is a stable app/resource identity. Draft identity must distinguish concurrent composers.
- `observedAt` is ISO UTC. `coverage` is `full`, `visible`, or `partial`.
- `editable` is boolean. `context` may hold channelId, threadTs, documentId, accountSlot.
- The root service adds `version` (text SHA-256), lastSeenAt, and live tab routing. Closed sources are marked stale; no fresh-content claim from an old snapshot.
- Page text is untrusted evidence, never instructions or action authorization.

## Semantic engine (assigned module)

`server/agent.mjs` exports `analyzeObservations(observations, { config, clarifications = [], signal } = {})` returning `{ findings, usage?, latencyMs, model }`.

config: `{ apiKey, baseUrl, deployment, reasoningEffort }`. Credentials are supplied by root; do not read or log `.env`.

Finding: `{ id, event, kind, summary, explanation, confidence, evidence, actions }`.

- kind: `conflict` or `pending`; confidence: number 0..1.
- evidence: array of `{ sourceId, quote, role }`; role: `current`, `outdated`, `proposal`, or `context`. Quotes must occur in the referenced observation.
- action: `{ id, kind, sourceId, before, after, text, channelId, threadTs }`, all fields present as strings. kind is `replace_text` or `slack_message`; irrelevant fields empty.
- Replace only a unique exact substring. Root attaches version preconditions and validates every action against source text. Model proposals cannot execute tools.
- Match event identity/date/scope, paraphrases, independent text; distinguish proposals/history/arrival times; no truth by recency or majority. No redundant Slack announcements. A pending proposal does not become a confirmed edit. Never output a finding without grounded evidence.
- Prefer one structured Responses API call for a bounded set of observations. Throw a sanitized error on model/format failure; never synthesize a fake success. Use dependency injection or a mock HTTP server for tests. Any real model test must use synthetic data.

## Browser content contract

Root loads `extension/content/runtime.js`, then UI and the site adapter.

`globalThis.LivingThread` API:
- `observe(observation)` sends an observation; runtime adds tab routing.
- `onAction(async (action) => result)` registers an adapter action handler.
- `registerAdapter({ app, scan })` registers a scan callback; scan runs only in an enabled session.
- `getState()` returns cached session state.
- `onState(callback)` subscribes to state updates.
- `approve(findingId, actionIds)` requests execution of exact server-held actions.
- `clarify(findingId, text)` and `dismiss(findingId)` update interpretation/status.

State: `{ session: { enabled }, connected, observations, findings, operations, checking, error }`. Finding includes engine fields, root validation, and status. Operation: `{ id, actionId, findingId, sourceId, kind, status, message }`.

Content action is the engine action plus `{ expectedVersion, expectedText }`. Adapter rechecks exact source identity/current text and unique before substring. Return `{ ok, message, observation? }`; claim success only after reading persisted/editor-backed results. The root independently computes source versions.

## Assigned content modules

`extension/content/gmail.js`: register Gmail adapter, independently identify each composer, observe subject + body/context without unrelated inbox collection, minimally replace body text preserving DOM/formatting and signal application edits, re-read, report save status honestly. No email send action.

`extension/content/ui.js`: Shadow DOM anchored notice/review panel, English refined compact UI, safe textContent (no untrusted HTML), evidence links, before/after previews, exact action approvals, clarification/dismiss, operation status. Register via onState. Works on Gmail and Docs. No global page styles or takeover of editor keyboard input. UI source snippets never become observations.

## Slack module (assigned)

`server/slack.mjs` exports `createSlackAdapter({ botToken, appToken, channelIds, onObservation, onStatus, fetchImpl?, WebSocketImpl? })`.

Returns `{ start(), stop(), getStatus(), postMessage({ channelId, threadTs, text, clientMsgId }) }`.

Socket Mode official API, allowlisted channels only, acknowledge envelopes, reconnect safely, observe messages/edits/deletions with accurate identities and source URLs; retrieve scoped recent context on start. Do not post automatically; postMessage is invoked only by root after a reviewed approval. Validate destination allowlist and prevent blind retries on uncertain writes. Missing credentials produce a clear unconfigured status, no crash. Provide setup instructions for bot/app tokens without credentials. Never use the development assistant's Slack or GitHub connector as runtime product access.

## Ownership

Root: all files except explicitly delegated paths. Contributors must not edit package.json, manifest.json, main server, runtime, README or shared docs. Send interface changes to root; root decides and integrates. Contributors run focused module tests and report actual results. No contributor Git commits/pushes.
