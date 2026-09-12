# LivingThread — Submission draft

**Submission materials; portal status requires confirmation.** The real venue-change workflow has passed live acceptance, including both saved edits and reload persistence. A 1:57 English demo now also shows an intentional arrival-time difference, its clarified wording, and a successful Gmail save. Team details are owner-confirmed. Public repository visibility, video/social publication, and portal submission require fresh confirmation.

## Project title

**LivingThread**

*Different apps. One living thread.*

## Written description

Use the [copy-ready Project Description](docs/PROJECT_DESCRIPTION.md) for the portal. It covers the problem, why the cross-app environment matters, automatic in-page intervention, intentional differences, technical implementation, and validated behavior. Its examples match the [recommended 1:57 demo edit](docs/VIDEO_EDIT.md).

## Why this environment matters

The useful moment is when someone is about to carry an outdated detail into another tool. Gmail supplies the current composition context, Docs contains the maintained brief, and Slack supplies the surrounding discussion and confirmation. Different wording can refer to the same real arrangement; different numbers can also be legitimate when the audience or purpose differs.

LivingThread uses that cross-app context to decide whether an inconsistency needs attention and puts the evidence beside the relevant work. The user can then approve precise actions against the actual document, draft, or conversation. A separate chat window would require the user to first notice the issue and assemble the relevant sources; LivingThread's intended interaction begins before that explicit comparison request.

## Implementation

| Area | Stack and approach |
| --- | --- |
| In-place experience | Manifest V3 Chromium extension, plain JavaScript, Shadow DOM notice/review panel |
| Local orchestration | Node.js 22+ built-ins, local HTTP service, paired extension access, explicit work-session state |
| Reasoning | Azure Responses API, initial `gpt-5.6-sol` deployment with low reasoning effort, structured findings and action proposals |
| Gmail | Current-composer subject/body observations and exact local edits; no email sending |
| Google Docs | Experimental authenticated text export and native find/replace integration using a Docs-restricted debugger bridge |
| Slack | Allowlisted channels, Socket Mode, bounded recent history, edited/deleted messages, reviewed bot posting |
| Action control | Grounded quotes, unique exact targets, version checks, per-operation results, durable journal and uncertain-outcome recovery |

The model proposes actions and does not execute tools directly. The prototype uses no third-party npm runtime package. The repository includes installation instructions, synthetic tests, and an English demo rehearsal script.

## Validation and current limitations

At the recorded development checkpoint, **104 automated tests passed**. Real Azure evaluation covers confirmed venue change, pre-existing conflict, legitimate time differences, a tentative proposal, unrelated events, compatible differences in specificity, and resolved changes with retained conversation history. The initial five cases and seven follow-up calls passed their expectations. These are focused regressions, not a general accuracy benchmark. See the [evaluation report](docs/SEMANTIC_EVALUATION.json).

Real extension pairing, session activation, Slack event delivery, Docs/Gmail observations, automatic in-page notice, reviewed edits, application save confirmation, and post-reload persistence are verified for the synthetic venue-change scenario. A separate pending-time scenario also passed reviewed Slack bot delivery: after audience clarification and the owner's exact-message approval, LivingThread posted a question in the correct thread and retained the confirmed arrangement. The subsequent check proposed no duplicate question. A blocked page notification delayed the Gmail receipt; it appeared after the test Doc was refreshed, without resending. v0.1.5 includes a tested fix that keeps state notifications from blocking service checks. See [live acceptance](docs/LIVE_ACCEPTANCE.md). The [two-minute script](docs/DEMO_SCRIPT.md) remains a recording plan.

The current prototype requires a local running service and the installed browser profile. An enabled session observes matching open Docs pages and Gmail composers plus configured Slack channels; per-document and per-account exclusion controls are not yet implemented. Closed or unavailable sources are not treated as fresh. Slack history is bounded and older thread replies are not backfilled. Docs multi-tab coverage and complex-document behavior remain experimental; saved editing is verified for the short live fixture. Model analysis has bounded input size.

Observed text and limited source context are sent to the configured Azure deployment. Credentials remain in local service configuration; local pairing and operation records are private runtime files. Each actual edit or Slack message requires an explicit review. An uncertain action is not automatically replayed after a restart. The demonstration uses fictional business details inside real applications; test fixtures are not substituted for runtime reasoning.

## Build eligibility and provenance

Core implementation began **September 12, 2026 at 02:54 UTC / 10:54 HKT**, after the owner confirmed the official hackathon had started. Pre-event work consisted of concept discussion, documentation, account/environment checks, generic API readiness tests, and written synthetic scenarios. The extension, adapters, semantic instructions/validation, orchestration, review UI, operation journal, and product tests were written during the event.

Existing building blocks are the JavaScript/Node/browser runtimes, Azure models, and the Slack/Google applications and APIs. They are not claimed as original project inventions. See [build provenance](docs/BUILD_PROVENANCE.md) for the detailed record.

## Submission fields to complete

| Required field | Draft/status |
| --- | --- |
| Title | LivingThread |
| Written description | [Copy-ready portal description](docs/PROJECT_DESCRIPTION.md), matched to observed behavior and demo v2 |
| Public GitHub repository | [ArthasL1/LivingThread](https://github.com/ArthasL1/LivingThread); code pushed, currently Private. Public visibility is required before submission |
| Two-minute video | TODO: upload the verified demo and insert its public URL; confirm duration ≤ 2:00 |
| Social post | TODO: publish after final review, using verified partner handles; insert public post URL |
| Team name | LivingThread — confirmed by the owner |
| Team member | Zeqi Li — sole participant, confirmed by the owner; portal entry still pending |
| Final validated revision | TODO: record the revision shown in the final video |
| Portal submission confirmation | TODO: record only after actual submission |

## Social copy draft

**Do not publish until the live demo is validated and the handles/links are filled.**

> I built LivingThread at Agents Everywhere: an agent that connects related details across Slack, Google Docs, and Gmail, surfaces inconsistencies where you work, and helps you review the right updates. Different apps. One living thread.
>
> Demo: [VIDEO URL] · Code: [PUBLIC REPOSITORY URL]
>
> [VERIFIED EVENT AND PARTNER HANDLES]

No social post, message, or portal submission is authorized or performed by this draft. Final partner tags must match the actual event/platform instructions; do not invent handles.
