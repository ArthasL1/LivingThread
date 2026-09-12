# Preparation and Build Provenance

Core build start: **September 12, 2026, 02:54 UTC / 10:54 HKT**, after the owner explicitly confirmed that the official hackathon had started and authorized implementation and parallel module work.

Status: Prototype code is implemented, with live integration validation in progress. At this checkpoint, **64 automated tests and five Azure semantic cases passed**. Extension/service pairing is still being investigated; the real-browser/Slack workflow and saved cross-app actions have not yet passed end-to-end acceptance. This record separates preparation, existing building blocks, and code created during the event. It records the owner's start confirmation, not a separately obtained organizer timing ruling.

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
| Real app observation and action adapters | Gmail and experimental Docs content adapters implemented; live saved-write acceptance pending | [Gmail adapter](../extension/content/gmail.js), [Docs adapter](../extension/content/docs.js), [extension background](../extension/background.js) |
| Work-session scope and automatic relationship discovery | Session controls, observation state, and analysis scheduling implemented; browser pairing unresolved at this checkpoint | [Local service](../server/main.mjs), [state](../server/state.mjs), [content runtime](../extension/content/runtime.js), [manifest](../extension/manifest.json) |
| Semantic association and change/conflict interpretation | Structured analysis and evidence/action validation implemented; five synthetic Azure cases passed | [Agent](../server/agent.mjs), [evaluation harness](../scripts/evaluate.mjs), [fixtures](../tests/fixtures/semantic-cases.json), [actual evaluation report](SEMANTIC_EVALUATION.json) |
| In-place evidence and action review interface | Shadow DOM notice/review UI and session popup implemented; live usability acceptance pending | [In-page UI](../extension/content/ui.js), [popup](../extension/popup.html) |
| Cross-app execution, verification, and recovery | Exact-target checks, reviewed operation dispatch, status handling, and durable journal implemented; actual cross-app execution pending | [State/action checks](../server/state.mjs), [operation journal](../server/journal.mjs), [journal tests](../tests/journal.test.mjs) |
| Bounded Slack coordination | Socket Mode, initial channel context, event handling, and reviewed posting implemented; real installation and authorized posting not yet validated | [Slack adapter](../server/slack.mjs), [synthetic Slack tests](../tests/slack.test.mjs), [installation instructions](SLACK_SETUP.md) |
| Automated verification | 64 automated tests passed at the checkpoint; synthetic fixtures do not establish live app integration | [Tests](../tests/), [syntax and manifest checks](../scripts/check.mjs) |
| Demo, video, and submission artifacts | Written English cases exist; live recording and final submission remain pending | [Demo cases](DEMO_CASES.md), [event requirements](EVENT_BRIEF.md) |

## Recorded evaluation

The first product semantic evaluation ran on September 12, **03:05:34–03:05:56 UTC**, using `gpt-5.6-sol` with `low` reasoning effort. All five synthetic cases passed their specified behavioral checks: confirmed venue change, existing conflict, legitimate time differences, tentative proposal, and unrelated events. No app writes or communications were performed by that evaluation. Its report describes limits and model-call latency; this is not a reliability benchmark or proof of browser observation/saved edits.

The 64-test checkpoint covers local logic and transport with synthetic data, including uncertain-send protection and restart recovery. Real credentials, session pairing, signed-in application behavior, and the complete venue-change demonstration must be recorded separately once observed.

The owner authorized parallel modules, with the root agent retaining architecture, integration, final acceptance, and repository ownership. Contributors implemented bounded modules against the shared [implementation contract](IMPLEMENTATION_CONTRACT.md); they did not independently publish or configure external applications.

Add actual completion times and real acceptance evidence as development progresses. Preserve unresolved checks rather than inferring success from source code, automated tests, or the development assistant's browser access.
