# Preparation and Build Provenance

Core build start: **September 12, 2026, 02:54 UTC / 10:54 HKT**, after the owner explicitly confirmed that the official hackathon had started and authorized implementation and parallel module work.

Status: the owner has reloaded v0.1.5 in Edge. The dedicated fixture passed actual observation, native notice, evidence review, approval, both saved edits, persistence after reload, and correct final resolution. A separate reviewed Slack bot reply also passed delivery and post-send interpretation. The public GitHub requirement remains pending because the uploaded repository is private. The latest full suite passed **104/104 tests**. Twelve recorded Azure evaluation calls across seven unique synthetic cases passed. This record separates preparation, existing building blocks, and code created during the event. It records the owner's start confirmation, not a separately obtained organizer timing ruling.

## Preparation completed

| Item | Origin | Status |
| --- | --- | --- |
| Product concept and interaction decisions | Owner discussion and assistant planning | Written planning only. |
| Hackathon brief and eligibility wording | Owner-supplied excerpt, public listing, and authenticated portal/handbook read on September 11 | Eligibility wording and September 12, 17:00 HKT submission deadline verified. Scheduled Build block recorded; full eligibility window not explicitly defined. |
| Workspace and project instructions | Created during preparation | Local Git repository and documentation; no product implementation. |
| Local environment inventory | Existing machine and bundled development runtime | Version/path checks completed; no product dependencies installed. |
| Integration research | Official Chrome, Google Docs, and Slack documentation linked in the planning files | References reviewed before the event; no adapter was implemented during preparation. |
| Generic model API readiness | Owner-supplied Azure credentials; temporary shell requests using Python's standard library | 21 generic requests across Sol, Terra, and Luna; no LivingThread semantic prompts or product integration. Synthetic results recorded separately. |
| Demo and acceptance scenarios | Owner-approved story and assistant behavioral specifications | Five English written cases prepared; no automated product tests or scripted demo implementation. |
| Recording readiness | Owner's earlier recording/export test | Owner reports success; not independently re-tested by the assistant. |
| Ordinary account/editor checks | Existing Edge control tool and signed-in applications | Private neutral Google Doc and unsent Gmail draft created for ordinary editing checks; Slack read only. No extension adapter or agent behavior implemented. Intermittent Google connectivity recorded. |

## Reused product building blocks

The prototype uses native JavaScript and Node built-ins, browser extension APIs, and hosted platform/model APIs. No third-party npm package, downloaded starter repository, or copied application component is currently included in the runtime. Existing development tools and hosted models are not claimed as LivingThread inventions.

| Existing building block | Role | Provenance and changes |
| --- | --- | --- |
| Node.js 22+; local development runtime previously inventoried as 24.19.0 | HTTP service, fetch/WebSocket, hashing, filesystem, and test runner | Existing [Node.js runtime](https://nodejs.org/), MIT-licensed; no upstream runtime modifications or vendored code |
| Chromium Manifest V3 extension APIs | Content scripts, storage, runtime messaging, tab routing, and Docs debugger bridge | Existing browser platform; LivingThread extension implementation written during the event |
| Azure model deployment `gpt-5.6-sol` | Structured semantic analysis | Owner-provided hosted deployment; product instructions, validation, fixtures, and evaluation harness written during the event |
| Slack Web API and Socket Mode | Scoped observation and reviewed bot messages | Existing hosted APIs; dependency-free LivingThread transport adapter written during the event |
| Gmail and Google Docs web applications | Native environment containing observed facts and reviewable edits | Existing applications; experimental LivingThread page adapters written during the event |

When adding a third-party component later, record its name, upstream URL, exact version/revision, license, role, and modifications here.

## Core work created during the event

| Area | Build status | Evidence to add |
| --- | --- | --- |
| Real app observation and action adapters | Actual personal-account baseline reads verified: Gmail 238 characters, Docs 336 characters. Both product edits passed saved-state and fresh post-reload checks | [Gmail adapter](../extension/content/gmail.js), [Docs adapter](../extension/content/docs.js), [extension background](../extension/background.js), [live acceptance](LIVE_ACCEPTANCE.md) |
| Work-session scope and automatic relationship discovery | Actual three-source compatible baseline returned zero findings; fourth source confirmed the venue change and produced one conflict with two Docs/Gmail replacements and no Slack action | [Live acceptance](LIVE_ACCEPTANCE.md), [local service](../server/main.mjs), [state](../server/state.mjs), [content runtime](../extension/content/runtime.js), [manifest](../extension/manifest.json) |
| Semantic association and change/conflict interpretation | Compatible-specificity and superseded-history false positives corrected with general rules; regression calls and the actual final resolved-state check passed | [Agent](../server/agent.mjs), [evaluation harness](../scripts/evaluate.mjs), [fixtures](../tests/fixtures/semantic-cases.json), [actual evaluation report](SEMANTIC_EVALUATION.json) |
| In-place evidence and action review interface | Native Gmail notice and **Apply 2 changes** approval used in the real flow; keeping results continuous through finding refresh is being refined | [In-page UI](../extension/content/ui.js), [popup](../extension/popup.html) |
| Cross-app execution, verification, and recovery | Actual product Docs/Gmail edits succeeded and persisted after reload; exact original time, presenter, and remaining text preserved | [State/action checks](../server/state.mjs), [operation journal](../server/journal.mjs), [journal tests](../tests/journal.test.mjs), [live acceptance](LIVE_ACCEPTANCE.md) |
| Bounded Slack coordination | Real Socket Mode receives the dedicated channel; a separately approved question was posted by LivingThread in the intended thread, verified in Slack, and followed by a pending finding with no duplicate question | [Slack adapter](../server/slack.mjs), [synthetic Slack tests](../tests/slack.test.mjs), [live acceptance](LIVE_ACCEPTANCE.md) |
| Automated verification | Latest full suite: 104/104 passed. Earlier full and focused checkpoints overlap and are not additive | [Tests](../tests/), [syntax and manifest checks](../scripts/check.mjs) |
| Demo, video, and submission artifacts | Core live fixture completed through resolution; final recording/submission pending. GitHub repository verified private, so public visibility is still required | [Demo cases](DEMO_CASES.md), [event requirements](EVENT_BRIEF.md), [live acceptance](LIVE_ACCEPTANCE.md) |

## Recorded evaluation

The first product semantic evaluation ran on September 12, **03:05:34–03:05:56 UTC**, using `gpt-5.6-sol` with `low` reasoning effort. All five synthetic cases passed their specified behavioral checks: confirmed venue change, existing conflict, legitimate time differences, tentative proposal, and unrelated events. No app writes or communications were performed by that evaluation. Its report describes limits and model-call latency; this is not a reliability benchmark or proof of browser observation/saved edits.

The live compatible baseline initially produced a false positive because a shorter description omitted details asserted by another source. A general instruction now requires explicitly incompatible claims, and does not treat omitted room/year details as contradictions. The follow-up evaluation ran **04:01:42–04:01:59 UTC** and passed two compatible-specificity checks and two confirmed-venue-change checks. The report therefore contains nine real evaluation calls across six unique cases. Ordinary live model calls are separate from that count.

Real adapter evidence is recorded in [live acceptance](LIVE_ACCEPTANCE.md): the baseline's three sources returned zero findings after the correction; the second Slack facilities message created a four-source context with one conflict, two exact replacement proposals, and no redundant Slack action. The Gmail notice was visually verified. The assistant posted the two synthetic fixture messages as the signed-in user under explicit approval; LivingThread received them through its own adapter. At **05:04:56 UTC**, a separately approved pending-time question was posted through LivingThread's own bot action and independently verified in the actual Slack thread. The subsequent check retained the confirmed time and proposed no duplicate question.

At **04:15:08 UTC**, the assistant clicked the actual product's **Apply 2 changes** control. LivingThread's Docs operation succeeded at **04:15:15 UTC**, with exact saved-export and Saved to Drive verification. Its Gmail operation succeeded at **04:15:17 UTC**, with a fresh saved-state indication. Both applications were then reloaded; at approximately **04:16 UTC**, their own adapters freshly re-observed the approved Level 5 / Room 502 content with the original time, presenter, and remaining text unchanged. These are product adapter writes, not assistant text edits standing in for the implementation.

The first post-write model check flagged the obsolete original Slack baseline with zero actions. A general historical-versus-current rule was added. Two resolved-history evaluations passed at **04:16:57–04:17:00 UTC**, followed by a confirmed-change regression at **04:17:14–04:17:20 UTC**. Together with the initial five and earlier four checks, the report now contains twelve real evaluation calls across seven unique cases, all passing.

The root agent restarted the service at approximately **04:18 UTC** with the corrected instructions. All four actual sources were freshly re-observed, and the live post-write check returned `findings: []` in **2,495 ms**. The complete automatic-notice, evidence, approval, two saves, reload, and resolution sequence passed for this fixture. Operation-result UI continuity was subsequently verified in v0.1.4, including reopening the two-result group from the actual Docs page and retaining a new Gmail action result through a model timeout.

Earlier Docs content-script export failures are retained in the live record and are superseded by the successful v0.1.3 read. The current 30-second idle export cache, saved-change/explicit refresh behavior, 60-second 429 backoff, and sender-tab binding have focused tests. These do not claim unrestricted export reliability or complete document coverage.

Automated suite checkpoints are recorded separately from real acceptance: earlier full runs passed 71, 90, and 95 tests as regressions were added. The root agent has now recorded **104/104 passing tests** in a full run, plus syntax checks for 14 JavaScript files and manifest validation. The v0.1.5 fixes prevent page-state notifications from holding the service pump, explicitly acknowledge receipt, discard obsolete delayed broadcasts, and immediately deliver exact approved-action receipts without replaying actions.

The owner authorized parallel modules, with the root agent retaining architecture, integration, final acceptance, and repository ownership. Contributors implemented bounded modules against the shared [implementation contract](IMPLEMENTATION_CONTRACT.md); they did not independently publish or configure external applications.

Add actual completion times and real acceptance evidence as development progresses. Preserve unresolved checks rather than inferring success from source code, automated tests, or the development assistant's browser access.
