# Pre-Event Readiness

> **Historical planning/preparation record.** This file preserves its original checkpoint; pending or proposed items are not a statement of current functionality. For the implemented v0.1.5 prototype, see the [project README](../README.md), [setup guide](SETUP.md), and [live acceptance](LIVE_ACCEPTANCE.md).

Prepared September 11, 2026. Local tooling checked at 14:15 UTC / 22:15 HKT. This checklist records preparation and factual dependencies; it does not claim that product integrations work.

## Product decisions are sufficient

The owner endorses automatic relationship discovery within an authorized work session, in-place notices, and reviewed actions across affected applications. The main demonstration follows a venue change expressed differently in Slack, Google Docs, and Gmail.

The next step is implementation preparation. Additional platform brainstorming, detailed visual styling, and an exhaustive fact taxonomy are not prerequisites. Exact model settings, notice timing, adapter mechanics, and UI placement should be decided from real integration evidence during the event.

For the owner's concrete next steps, follow [Owner setup steps](OWNER_SETUP_STEPS.md). They separate personal identity and authorization decisions from configuration the assistant can perform.

The subsequent [browser checks](BROWSER_READINESS.md) replace broad requests for the owner to repeat account setup. Gmail draft input, Docs input with a saved-state indication, and Slack workspace access were observed. Intermittent Google connectivity remains a practical demo concern.

## Highest-value preparation

| Dependency | Prepare before the event | Current status |
| --- | --- | --- |
| Google access | The owner's personal Google account for Docs and Gmail. Cloud project, Docs API, and OAuth setup are conditional on selecting the API adapter. | Owner reports switching from the school account. Earlier editor checks are historical; personal-account access needs verification before future writes. Intermittent connectivity was observed previously. Cloud setup deferred; product adapters remain unimplemented. |
| Slack access | A test workspace where the owner can install the app, a suitable test channel, and a second test participant if demonstrating a coordination reply. | Existing ArthasL1Slack workspace and test channel visible. App-installation rights and API integration remain unverified; no messages sent. |
| Model service | A usable API project, credentials, and capacity for development and the demo. | Owner provided Azure access in ignored local `.env` and reports sufficient budget. Sol, Terra, and Luna passed generic connectivity, structured output, and function-call checks. Initial selection: Sol. See the model readiness report. |
| Local runtime | A usable browser, Git, JavaScript runtime, and package manager. | Verified below. |
| Demo preparation | A suitable browser profile, recording workflow, and written examples. | Five English cases prepared by the assistant. Owner reports recording/export already tested successfully; no repeat recording test requested. Browser/account readiness remains separate. |
| Submission logistics | GitHub account access, team registration, portal deadline, video destination, and required sponsor handles. | GitHub profile verified for ArthasL1. Portal deadline verified: September 12, 17:00 HKT. Owner will decide the team at the venue; no advance team action requested. Repository creation/push rights, video destination, and exact sponsor handles remain unverified. |

A registered account alone does not establish API access, and a browser-based Docs adapter does not inherently require the Docs API. If the API route is selected, Google documents the Cloud project, API enablement, and OAuth setup prerequisites in its [Docs quickstart](https://developers.google.com/workspace/docs/api/quickstart/nodejs). Choose the appropriate client type and consent flow for the actual adapter; do not copy the quickstart's desktop-client choice into an extension architecture without checking it.

Slack's [app quickstart](https://docs.slack.dev/quickstart/) describes setting up a workspace and authenticating for app development. App installation and relevant channel access are the useful readiness checks; installing a CLI is not itself a required product decision.

The owner can handle account registration, login, and interactive consent. The assistant can prepare the configuration steps and validate the chosen integration when access is available. Do not ask the owner to paste keys into conversation or commit credentials to the repository.

## Verified local environment

These are direct local observations, not a full integration test.

| Tool | Observed state |
| --- | --- |
| Git | 2.53.0.windows.1; callable. |
| Node.js | v24.19.0; callable through the bundled runtime. |
| pnpm | 11.19.0; version command executed successfully through Node. |
| Python | 3.13.0; callable. |
| Chrome | Installed at C:/Program Files/Google/Chrome/Application/chrome.exe; file version 152.0.7977.83. |
| npm | Not available on the current PATH. A working pnpm entry point is available, so no npm installation has been performed. |
| GitHub CLI | Not found on PATH; not required to begin local development. |

The verified pnpm entry point on this machine is:

    node "C:/Users/zeqia/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/bin/pnpm.cjs" --version

This path belongs to the local bundled runtime and should not be hard-coded into portable product scripts. A later browser-control check verified opening, reading, and clicking through public pages in the connected Edge profile. Chrome is not yet available through that control channel. Loading the future LivingThread extension, account authorization, network access to the chosen API providers, and actual product read/write integrations have not been tested.

## Prepare the demonstration specification

Keep the example small and repeatable:

- One identifiable event with a specific date and timezone.
- An original venue explicitly stated as "Level 3, Room 301."
- Independently phrased document and email text mentioning "the third floor."
- A confirmed update to "Level 5, Room 502."
- A legitimate difference, such as earlier staff arrival, that should be preserved.
- A pending proposal that should prompt a question instead of a confirmed update.
- A failure case, such as an unavailable document, that should leave a visible incomplete status.

During implementation, make the scenario resettable and verify it against real apps. Do not substitute an imitation Slack, Docs, or Gmail page for an integration. Use a second test participant only when their response adds meaningful evidence to the coordination story.

## Preparation checks versus product tests

These are recommendations based on the stated eligibility rule, not a separate organizer ruling. Product-specific observation and action adapters remain event-built work.

| Before the official build period | During the official build period |
| --- | --- |
| Confirm ordinary Gmail/Docs login, manual document editing, and draft access in the intended browser profile. This does not establish extension access. | Implement and test automatic Docs text extraction, coverage, refresh, and source tracking. |
| Check that the browser permits loading an existing, unmodified official extension sample; record its source if used. Check the assistant's control connection separately. | Build LivingThread content scripts, context collection, in-place notices, and editor actions. |
| Confirm a suitable Slack workspace and app-installation rights; inspect the required scopes and existing SDK documentation. | Implement event handling, context retrieval, authorized communication, and outcome verification. |
| Generic Azure connectivity, strict JSON, and function-call checks completed with owner-provided access. See [model readiness](MODEL_READINESS.md). | Develop and evaluate LivingThread-specific semantic prompts, fact association, interpretation, and orchestration. |
| Write English example inputs and expected outcomes; make a short recording check of an ordinary page without private content. | Run those examples against the real agent, record real integrations, and verify the final demo. |
| Resolve team registration, submission fields, public repository setup, video destination, and available sponsor resources. | Publish the completed project, record the final video, and submit accurate artifacts with the required authorization. |

Azure inference access is verified for the three tested deployments. Account/extension access remains the main environment check. Existing runtime version checks need not be repeated. Google Cloud setup remains deferred. Recording success is owner-reported. Extension sample and product tests remain unexecuted; documentation is not evidence of a pass.

Use five compact written cases: a genuine venue change, an independently authored pre-existing conflict, a legitimate arrival/start distinction, a tentative proposal, and an unavailable or stale source. The existing concept supplies the expected behavior; do not expand into an exhaustive taxonomy before the event.

These cases are now written in [Demo cases](DEMO_CASES.md), with English source text and expected actions. They have not been executed against the product.

## First build milestones

Prioritize the [actual-adapter validation gate](MVP_PROPOSAL.md#integration-confidence-and-first-validation-gate). The assistant's existing browser control is not evidence that LivingThread can perform the same actions. Resolve the Docs browser/API route early using saved edits and explicit reading coverage.

1. Verify access and a reliable read/observe path for the first real application pair.
2. Demonstrate automatic association of an independently written draft within the session scope.
3. Show a relevant in-place notice with source evidence.
4. Execute and verify approved draft and document corrections.
5. Add the Slack observation and meaningful communication workflow, with clear pending-agreement behavior.
6. Exercise a semantic non-conflict and an operational failure, then record the demonstrated behavior.

If integration evidence requires a scope change, preserve automatic discovery, genuine cross-app context, in-place intervention, and a verified action. Do not fall back to mandatory resource enrollment or a chat-only comparison without discussing the product impact.

## Stop condition for preparation

The build is ready to start once the required accounts and consent paths are accessible, a model API is available, the local tools are usable, and the initial demo state is specified. Finalize integration behavior through implementation during the official period. See the [provenance record](BUILD_PROVENANCE.md) for the separation between preparation and core work.
