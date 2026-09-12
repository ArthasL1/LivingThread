# LivingThread — Agents Everywhere

**Different apps. One living thread.**

| Submission item | Current material |
| --- | --- |
| Project and team | **LivingThread** |
| Participant | **Zeqi Li**, sole human team member |
| Public repository | [ArthasL1/LivingThread](https://github.com/ArthasL1/LivingThread) — anonymous GitHub API access verified on September 12, 2026 |
| Demo | [Watch on YouTube](https://youtu.be/GGgn0UvC4n0) — published video supplied by the participant; recommended edit is **1:57**, English narration and captions |
| Description | [Copy-ready project description](docs/PROJECT_DESCRIPTION.md) |
| Runtime demonstrated | **v0.1.5**; runtime source matches commit [0e1f6c0](https://github.com/ArthasL1/LivingThread/commit/0e1f6c0). Subsequent work prepared documentation and the video. |
| Social post | LinkedIn copy prepared; public post URL has not yet been supplied in this workspace |
| Portal submission | Completion has not yet been confirmed in this workspace |

## Project description

LivingThread connects related information across Slack, Google Docs, and Gmail, notices meaningful inconsistencies, and shows up inside the affected document or draft. Users review the evidence and exact proposed actions before the agent changes anything.

The [full project description](docs/PROJECT_DESCRIPTION.md) covers functionality, environment-specific value, innovation, technical execution, and user control. The [README](README.md) provides a visual overview and installation entry point.

## Team contributions

**Zeqi Li — Solo team member, LivingThread**

Led product direction, scope, interaction design, and demo storytelling. Prepared the application accounts and test scenarios, performed hands-on testing across Slack, Google Docs, and Gmail, validated the agent's behavior, and recorded the live demonstration.

Used **OpenAI Codex** extensively for AI-assisted implementation, debugging, automated testing, documentation, and demo production.

The project uses **Azure OpenAI's Responses API with gpt-5.6-sol** for contextual reasoning and structured action proposals; **Slack Socket Mode and the Slack Web API** for channel events and approved messages; and **Chromium Manifest V3 extension APIs** for in-page interaction. Gmail integration operates on open drafts through content scripts, while Google Docs integration uses authenticated text exports and approved editor actions through the browser debugger API.

## Prior work

Before the hackathon, we discussed the product concept, documented intended workflows, and prepared written demo scenarios. We also checked development tools, account access, basic browser editing, and generic model API connectivity. These were preparation activities; no LivingThread extension, backend, application adapters, or core agent functionality existed before the event.

All LivingThread-specific implementation was created during the hackathon, beginning on September 12, 2026, at 10:54 HKT. This includes the browser extension, local Node.js service, Slack/Gmail/Google Docs integrations, semantic reasoning instructions, automatic conflict detection, in-page review interface, approved action execution, save verification, operation journal, and automated tests.

We used existing building blocks: Node.js, Chromium extension APIs, Azure-hosted models, and Slack and Google applications and APIs. OpenAI Codex assisted development during the event. No pre-existing LivingThread application or application starter code was reused. [Detailed provenance](docs/BUILD_PROVENANCE.md).

## Review evidence

- [Published demonstration](https://youtu.be/GGgn0UvC4n0): a confirmed venue change, native intervention, two approved saves, and an intentional early-arrival clarification followed by an approved and verified Gmail rewrite.
- [Live integration acceptance](docs/LIVE_ACCEPTANCE.md): actual adapter observation, writes, reload persistence, and a separately reviewed Slack bot reply.
- [Automated tests](tests/): **104 passing tests**; synthetic checks are distinct from real application acceptance.
- [Semantic evaluation report](docs/SEMANTIC_EVALUATION.json): **12 real Azure calls across 7 unique synthetic cases**, all meeting their recorded expectations.
- [Architecture and limits](docs/ARCHITECTURE.md): current integration scope, approval boundaries, partial coverage, and uncertain-result recovery.

The demonstration uses fictional business details in real applications. No email is sent. The [video edit record](docs/VIDEO_EDIT.md) explains accelerated waits, reading holds, and continuation captures.
