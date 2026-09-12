# LivingThread: Current Product Concept

> **Historical planning/preparation record.** This file preserves its original checkpoint; pending or proposed items are not a statement of current functionality. For the implemented v0.1.5 prototype, see the [project README](../README.md), [setup guide](SETUP.md), and [live acceptance](LIVE_ACCEPTANCE.md).

**Different apps. One living thread.**

Status: Direction endorsed by the owner, including automatic discovery within an authorized work session, the venue-change demonstration, and reviewed cross-app follow-through. Exact permission mechanics, UI details, and adapter behavior remain to be validated. No core functionality is implemented.

## Product intent

An agent that recognizes related information across apps, appears when a meaningful discrepancy affects the user's work, and helps coordinate the appropriate follow-through.

Information may be independently written or paraphrased as it moves through Slack, Google Docs, and Gmail. LivingThread should discover supported relationships, observe changes from any connected representation, and detect existing inconsistencies without requiring a comparison prompt.

The planned platforms are Slack web, Google Docs, and Gmail in desktop Chrome. The owner delegated platform selection to the assistant and can register accounts. Access and adapter behavior still need validation.

## Observation and discovery

### Product form and tab requirements

Recommended MVP packaging: a browser extension as the user's in-place interface, a local Agent service for observation state and orchestration, and application-specific access adapters. Official APIs are candidate adapters, not a universal prerequisite. The first valuable intervention occurs while the user edits or reuses information that may have become stale, such as an outgoing email containing an old venue instruction.

The extension observes eligible browser context and displays anchored notices and action reviews. The service associates facts, interprets changes, prepares actions, and records verified outcomes. For the hackathon prototype, the service will need to be started locally in addition to loading the extension. Model inference may use the chosen external API; a local service does not imply offline inference. A hosted service is a possible later packaging improvement, not a prerequisite for this prototype.

The owner has questioned whether Google Docs can be handled entirely through the extension. The assistant recommends deferring Google Cloud setup and validating browser-based Docs reading and reviewed editing first during the official build period. This is an implementation recommendation pending validation, not an owner-approved reduction of the product's action capabilities. Showing a suggestion, retrieving complete current content, and applying a persisted edit are separate capabilities. A page-based adapter does not require the Docs API or its Cloud/OAuth project, but Docs' canvas rendering means ordinary DOM text access is not sufficient evidence that it works. Keep the API route available for reliable structured access and refresh without an open document tab.

Tab requirements depend on the chosen adapter; the earlier unconditional closed-Docs-tab promise applies only to the API route:

| Surface | Proposed initial access | Tab requirement |
| --- | --- | --- |
| Gmail compose window | Extension observes the current eligible draft and renders notices/previews. | Keep the composer open in the browser profile running LivingThread for current editing assistance. A closed draft is not continuously observed or edited through a Gmail API in this MVP proposal. |
| Google Doc | Validate extension-based observation and reviewed editor actions first. The Docs API remains an alternative for authorized structured reads and edits. | Page-based access needs the document loaded and accessible; an open background tab alone does not prove fresh or complete observation. Closing the tab leaves only the last observed snapshot until it is revisited. With an authorized API adapter, the service can refresh its server-visible content after the tab closes. Neither route promises an instantaneous keystroke stream. |
| Slack channel or discussion | A Slack app receives permitted events and retrieves permitted context; action APIs support approved communication. | A Slack browser tab need not stay open. Changes originating in Slack desktop or mobile can reach the connected service through supported events. Permissions, channel membership, event coverage, and runtime availability still apply. |

These are implementation targets, not verified integrations. Slack's [Events API](https://docs.slack.dev/apis/events-api/) supports event delivery to an app; [Socket Mode](https://docs.slack.dev/apis/events-api/using-socket-mode/) is a candidate for the local service. [Google Docs document retrieval](https://developers.google.com/workspace/docs/api/reference/rest/v1/documents/get) provides a candidate refresh path for already authorized documents.

For the first release, use one browser profile for page-based discovery and editing assistance. Shared observation across separate Chrome and Edge profiles is not an initial promise. A remote or mobile edit to an already known API-connected resource is different from observing a new page in another browser. The latter remains outside the initial browser coverage.

The service and session must be active for the promised checks. Do not promise continuous monitoring after the session ends, the service stops, or the computer goes offline. Keep unsupported or stale sources visibly unchecked. Product browser support will be verified during implementation; the assistant's working Edge control connection is a development tool, not proof that the LivingThread extension is implemented or supports that browser.

The earlier plan required users to create a Thread and add each discussion, document, and draft. The owner challenged the setup burden: people should not need to anticipate which information might go wrong or identify all related resources in advance. That interaction is superseded as the recommended default.

Owner-endorsed replacement: the user enables an explicitly scoped work session. The scope identifies the connected accounts and permitted applications or channels, and whether currently opened documents and compose windows may be observed. During that session, supported content encountered within the scope becomes eligible for automatic association. Opening an eligible Gmail draft does not require an additional "Add to thread" action.

The first session need not crawl entire accounts. A practical initial proposal is permitted Slack channels, Google Docs opened during the session, and Gmail compose windows used during the session. This is an observation policy to validate, not a claim that a browser permission automatically grants document API access. Explain the actual observation boundary and model data flow during setup.

The agent establishes a Thread when the evidence supports a relationship. Explicit resource selection remains an optional pinning or correction control. Do not use matching words, shared recipients, browsing order, or copy provenance as sufficient evidence on their own. Independently authored content must also be eligible. Ask a focused clarification only when an uncertain relationship materially affects a proposed intervention.

Show the current session scope and observed resources; allow pause and exclusion. A never-observed or inaccessible resource is unknown. Refresh already encountered sources only through supported, authorized mechanisms and report their freshness. A DOM-only adapter cannot claim to observe updates to an unseen or closed page.

## What the agent understands

Associate assertions about the same entity or event, attribute, applicable period, and scope. Preserve the source excerpt, location, observed version, author/context when available, and relevant uncertainty.

Distinguish equivalent expressions, conflicting assertions, proposals, confirmed revisions, historical statements, and legitimate contextual differences. The latest edit, oldest source, or majority value does not automatically determine truth.

For example, "Starts at 3 PM" and "Starts at 4 PM" may conflict. "Arrive at 3 PM; the presentation starts at 4 PM" describes two attributes. "Could we move it to 4 PM?" is a proposal. Missing detail is not itself a contradiction.

## Appearing in the workflow

The agent should appear after a relevant change is observed, an independently written passage is found to disagree with related evidence, or a clarification creates actionable follow-up.

Present a compact notice in the affected application. Expand to show evidence, its freshness, the suspected relationship, and appropriate next actions. Avoid repeated notices for unchanged evidence. A Thread is an agent-maintained view of related information; users should not need to construct it before receiving help.

## Interpretation leads to different actions

| Situation | Appropriate proposed response |
| --- | --- |
| The current draft contains a mistake | Prepare and, after approval, apply a minimal correction to that draft. |
| The user confirms an actual change | Check known related resources, propose edits where the old assertion is still current, and prepare targeted communication where needed. |
| A difference reflects distinct audiences, attributes, or historical context | Preserve the valid distinction; optionally clarify ambiguous wording. Do not propagate one value to every representation. |
| The new arrangement still needs agreement | Prepare a question in the relevant conversation, identify whose agreement is needed, and track the decision as pending. |
| The user only dismisses the notice | Reduce interruption; do not treat dismissal as resolution or a new authoritative fact. |

"This difference is intentional" starts interpretation. A short reason may establish that the assertions are compatible, reveal a confirmed change, or expose a pending negotiation. Recording the reason alone is not always the end of the workflow.

## Cross-app follow-through

The owner-endorsed direction includes preparing a coherent action plan across known affected resources. A plan can update a Gmail draft, revise the relevant passage in a Google Doc, and post an approved update or clarification in a specific Slack thread.

Show concrete edits, message wording, target resources, audience, and dependencies before execution. The user can approve a selected group of actions together. Reading access and confirmation that a time changed do not by themselves authorize external messages. Existing explicit action authorization may cover subsequent steps within its stated bounds.

Use an identifiable LivingThread app identity for Slack communication. Do not manufacture recipients or commitments. A reply such as "4 works for me" does not establish agreement by every participant. A broader autonomous negotiation loop requires explicit limits on participants, proposals, commitments, and completion.

Verify each operation separately. Recheck document versions and draft contents before applying previews. Distinguish edits completed, messages sent, replies awaited, failed operations, and remaining unknown sources. Do not announce that an update succeeded when a prerequisite edit failed. Avoid duplicate messages after uncertain send outcomes. Historical messages should normally remain evidence rather than being rewritten.

This is product design discussion, not authorization to contact people or modify external accounts now.

## Demonstration direction

The owner accepts the venue-change example. In a permitted work session, the user naturally reads a Slack discussion and a project brief, then writes an email. The earlier venue is explicitly "Level 3, Room 301"; other passages refer to "the third floor." A confirmed update moves the demo to "Level 5, Room 502." The floor is explicit in the evidence, not inferred from a room number.

LivingThread appears beside the independently written draft, explains which statements are affected, and proposes reviewed changes to the draft and document. If the original Slack thread already contains the confirmed update, do not post a redundant announcement just to exercise a tool. Demonstrate communication using a separate meaningful clarification or a case where the relevant participants have not been informed.

## Implementation and eligibility

First validate real observation and action adapters, then build the association, intervention, and follow-through workflow during the official hackathon period. Reuse permitted existing building blocks and document their origins. See the [MVP proposal](MVP_PROPOSAL.md) and [event brief](EVENT_BRIEF.md). No core implementation has begun.
