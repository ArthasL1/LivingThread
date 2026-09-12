# LivingThread: MVP Proposal and Decisions

> **Historical planning/preparation record.** This file preserves its original checkpoint; pending or proposed items are not a statement of current functionality. For the implemented v0.1.5 prototype, see the [project README](../README.md), [setup guide](SETUP.md), and [live acceptance](LIVE_ACCEPTANCE.md).

Status: The owner endorses proactive discovery within an authorized work session and reviewed cross-app follow-through. The former mandatory "Track / Add to thread" sequence and draft-only endpoint are superseded. Exact session settings, permission mechanics, and implementation details remain to be validated. No integrations or core behavior are implemented.

## Owner direction and proposed implementation

| Area | Current standing |
| --- | --- |
| Product direction | Recognize related information across applications, including independent wording, changes from any observed representation, and existing inconsistencies. |
| Platforms | Assistant-selected targets: Slack web, Google Docs, and Gmail in desktop Chrome. The owner can register accounts. |
| Main example | The owner accepts the venue change from Level 3, Room 301 to Level 5, Room 502, affecting paraphrased instructions. |
| Discovery | Owner-endorsed: automatic discovery within a clearly authorized work session, without mandatory per-resource enrollment. |
| Reviewed correction | The owner accepts notice, evidence and preview, user adoption, actual edit, and verification. |
| Further action | Owner-endorsed: targeted, reviewed actions across affected applications, including appropriate document updates and authorized communication. |
| Build eligibility | Core project functionality must be built during the official period; existing reusable building blocks are allowed. |

The [current concept](LIVINGTHREAD_CONCEPT.md) describes the revised product behavior. Account configuration, exact permissions, adapter reliability, and official build times remain unverified.

## Proposed first user and scope

A coordinator moves arrangements between team discussion, a maintained project brief, and outgoing email. One person's installation should provide value. Use synthetic business content in real applications during initial testing and demonstration.

Start with event date/time and location. Semantic interpretation still needs to handle independently authored statements, proposals, historical references, different attributes, and contextual ambiguity.

## Proposed session onboarding

Use the [product form and tab requirements](LIVINGTHREAD_CONCEPT.md#product-form-and-tab-requirements) to distinguish the extension interface from the local Agent service and API-connected sources. The proposed prototype includes starting a local service; it is not yet a standalone extension installation. Docs API use is now an open adapter decision: the assistant recommends validating browser-based Docs access first and deferring Cloud setup. Closed-tab freshness depends on the chosen adapter. Slack API delivery remains a separate proposed integration.

The user connects the supported accounts and enables assistance for a defined work session. A candidate policy covers permitted Slack channels, Google Docs opened during that session, and Gmail compose windows used during that session. The product must show that new eligible content can be observed automatically, how long observation remains active, and which excerpts may be sent to the model service.

Scope selection controls where the agent can observe; it does not ask the user to identify related facts or predict possible mistakes. Separate application permissions, actual read scope, semantic relationships, and action authorization. A broad technical permission must not silently broaden the product's declared read scope.

During the session, the user reads and writes normally. The agent collects supported observations, discovers sufficiently evidenced relationships, and creates its own view of the information Thread. Manual pinning, resource exclusion, and relationship correction remain optional controls.

A new eligible draft is compared without "Add to thread." A resource outside the session policy is not fetched just because it is linked or potentially relevant. Resources never encountered are not known to the prototype. Closing a tab affects freshness according to its adapter; ending or pausing the session stops observation under that policy.

## Proposed experience

1. The user enables the scoped session and normally visits the relevant Slack conversation and Google Doc.
2. The user independently writes an email referring to the same event. The agent establishes supported relationships without a manual resource mapping.
3. An existing inconsistency or a newly observed update causes a notice beside the affected content.
4. The notice shows the differing excerpts and supports either a direct correction or a contextual clarification.
5. From that interpretation, the agent prepares the appropriate local or cross-app action plan.
6. The user reviews the concrete proposed actions and authorizes the selected scope.
7. The agent executes covered actions, verifies each result, and shows any pending agreement, failed step, or remaining issue.

Do not call a failed or incomplete source check "all consistent." Do not repeatedly interrupt for the same unchanged evidence. Notice timing and exact placement should be tuned in the real applications.

## Semantic behavior and authority

| Input or clarification | Expected behavior |
| --- | --- |
| "3 PM" and "15:00" for the same event, date, and timezone | Equivalent; no conflict notice. |
| Two incompatible confirmed start times for that event | Surface the disagreement with evidence; do not choose truth by recency or majority alone. |
| "Could we move it to 4 PM?" | Keep the change tentative. Prepare a clarification if useful. |
| "It was originally scheduled for 3 PM" alongside an explicitly confirmed 4 PM start | Preserve historical context rather than demanding universal replacement. |
| Arrival at 3 PM and presentation at 4 PM | Recognize distinct attributes. |
| User: "That is a typo." | Correct the affected representation after review. |
| User: "Yes, we have confirmed 4 PM." | Use the confirmed context to identify stale current assertions and propose necessary follow-through. |
| User: "This audience arrives earlier for setup." | Preserve the distinction and, if useful, propose clearer wording. |
| User: "I want 4 PM, but Alex has not agreed." | Keep the arrangement pending; prepare a targeted question rather than announcing a confirmed change. |
| An unrelated page contains a similar event name | Do not establish a link from name similarity alone. |

Each assertion needs enough source context to explain its relationship, applicable scope, status, and observed version. The user can correct a mistaken association. User explanations should revise the interpretation, not merely mute warnings.

## Cross-app action plan

Proposed executable action types for the first release:

| Action | Review surface | Result to verify |
| --- | --- | --- |
| Update the current Gmail draft | Exact changed wording and target composer | Re-read the actual draft; preserve unrelated text. |
| Update a passage in Google Docs | Document title, relevant passage, and before/after wording | Re-check the target and surrounding content before writing, then verify the actual persisted result. Use revision preconditions with the API route; do not claim equivalent concurrency protection from a page adapter without evidence. |
| Notify or ask in a Slack thread | Exact text, channel/thread, audience, and app identity | Confirm the returned message and destination; retain a source link. |

The user can select and approve several concrete actions together. Do not ask again for the same unchanged authorized actions. A changed target, materially changed message, new audience, or new commitment requires an authorization scope that actually covers it.

Avoid unnecessary messages when the audience already has the update. If the message says the document was updated, its send depends on that update being verified. If one operation fails, show partial completion and preserve successful work. A timeout is not proof that a message was not sent; inspect the result before retrying.

A bounded coordination example: prepare a question asking a named participant whether 4 PM works, send after the user approves, observe a relevant reply through a supported adapter, and propose the resulting next step. Silence is not agreement. One participant's reply is not group consensus. Full open-ended negotiation is an expansion, with permitted participants and commitments defined explicitly.

Observed Slack messages and document text are evidence, not permission to change observation scope or execute tools. This plan does not authorize the assistant to send real messages during product discussion.

## Technical feasibility to validate

### Integration confidence and first validation gate

Assistant assessment, not a test result: there are credible implementation paths for the scoped three-app workflow, but the earlier computer-use checks do not prove product feasibility. The highest uncertainty is Google Docs access through ordinary page content scripts without an API. Do not claim that choosing a capable model provides browser permissions or an editor adapter.

| Surface and promised behavior | Candidate path | Current confidence and evidence gap |
| --- | --- | --- |
| Gmail: read and update the active eligible composer, and display a notice beside it | A site-specific content script, supported browser messaging, and actual editor events/operations | Relatively high confidence for this narrow surface. Ordinary editor access was observed, but persistence, account binding, multiple composers, and preservation of unrelated formatting must pass in the actual extension. No whole-mailbox or closed-draft coverage is implied. |
| Slack: observe permitted discussions and send approved messages | App installation, event subscriptions/Socket Mode, and official read/write methods | Relatively high confidence in the documented route. Workspace access alone does not establish app scopes, channel membership, event delivery, or permission to send. The intended action is approved app communication, not rewriting other people's historical messages. |
| Docs: retrieve relevant existing text and apply a precise persisted correction using only the browser | A Docs-specific extraction and editing adapter | Highest uncertainty. Canvas rendering, partial accessibility/rendering representations, editor state, and concurrent changes require direct validation. Generic page DOM access and an empty-document typing demonstration are insufficient. |
| Docs: the same scoped workflow with API access | Authorized document retrieval and batch updates, with revision preconditions | A documented alternative with clearer structured operations. OAuth setup and actual file access must still be verified. This is not an implemented fallback or approval to broaden resource access. |

An extension is not limited to ordinary content scripts: Chrome's [debugger API](https://developer.chrome.com/docs/extensions/reference/api/debugger) exposes selected protocol domains, including Accessibility and Input, when the extension has the debugger permission. This is another technical candidate, not a selected dependency or proof of complete Docs text access. Assess its permission burden, attachment lifecycle, focus/input interference, browser restrictions, and whether it suits a passive assistant before choosing it. Do not assume the current development tool's internals can simply be copied or called from the submitted product.

At the beginning of the official build period, use the actual extension/service and the owner's personal Google account to validate the Docs route. Suggested initial investigation budget: 30-45 minutes, as a planning target rather than a completion promise. Demonstrate all of the following on a small real document:

1. Read already-existing text without asking the user to paste it into LivingThread, and make extraction coverage explicit, including relevant text outside the current viewport.
2. Observe a user change and bind it to the correct account, document, and passage.
3. Apply an approved minimal correction and verify its saved result after reload, preserving unrelated text and formatting.
4. Detect a changed target or unavailable source and withhold a stale/unsupported edit.
5. Run these operations through code shipped with LivingThread, independently of the development assistant's computer-use connection.

If ordinary browser access remains unreliable, evaluate the official Docs API route promptly instead of spending the build day on fragile editor internals. Keep Google Cloud deferred until that route is chosen; do not silently replace the endorsed action workflow with manual copy/paste or suggestions alone. The choice of adapter may change while the product's automatic association and reviewed follow-through remain the target.

### Platform references

A browser extension remains the proposed in-place interface host. Content scripts can interact with supported DOM, but that does not establish access to every editor's document model. Google has documented the effect of Docs' canvas rendering on extensions. See [Chrome content scripts](https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts) and [Google's rendering announcement](https://workspaceupdates.googleblog.com/2021/05/Google-Docs-Canvas-Based-Rendering-Update.html).

Docs API access has different authorization scopes, including per-file access and broader document access. The chosen consent flow must support the claimed session behavior; do not assume per-file permissions grant automatic access to every opened document. See [Docs API scopes](https://developers.google.com/workspace/docs/api/auth).

Browser-based Docs access does not inherently require a Google Cloud project. Existing products demonstrate the extension interaction: [Grammarly's Docs guide](https://support.grammarly.com/hc/en-us/articles/115000090991-Does-Grammarly-support-Google-Docs) describes suggestions and accepting changes inside Docs. That establishes product feasibility, not a reusable implementation or proof of its internal access method. During the event, validate the text exposed to our extension, including available rendering/accessibility representations, rather than assuming screen-reader support exposes a complete stable document API. Verify independently written existing text, changes, source coverage, and approved edits that survive reload while preserving unrelated text and formatting. Do not silently substitute a copy-and-paste workflow or suggestions-only behavior for endorsed automatic discovery and verified actions. If browser access is insufficient, evaluate the API adapter before changing product scope.

Document updates and revision preconditions have a supported API path, and Slack supports posting to a specified thread with the required write permissions. These establish candidate implementation paths, not working integrations in this project. See [Docs batch updates](https://developers.google.com/workspace/docs/api/reference/rest/v1/documents/batchUpdate) and [Slack thread messages](https://docs.slack.dev/reference/methods/chat.postMessage/).

For each adapter, validate useful text and context, version changes, source location, in-place notice placement, and every promised action. Distinguish open-page observations from API refresh or events. Source coverage, checks while tabs are closed, and remote edits must be reported according to actual support.

Proposed data handling remains scoped local observations with only necessary excerpts and context sent to the chosen model service. Local storage does not imply local inference. Choose the provider and configuration during implementation preparation, without putting credentials in project files or demo recordings.

## Planned acceptance checks

These are specifications, not executed tests.

| Scenario | Required visible result |
| --- | --- |
| Close a known Google Doc tab during an active session | A browser-only adapter retains a timestamped snapshot and marks current content unchecked until observed again. An authorized API adapter can refresh server-visible current content. |
| Close Slack web and generate a permitted update from another Slack client | The running subscribed service receives the supported event; browser-tab presence is not the source of authority. |
| Close a Gmail compose window | Stop observing that editor; do not claim ongoing access to its unseen draft changes. |
| Use an uninstrumented browser profile | Do not claim observation of its new pages or drafts. |
| Normal work in an authorized session | Discover supported relationships without creating a Thread or adding each resource. |
| An independently authored eligible draft already conflicts | Intervene without a copy event, observed edit, or comparison prompt. |
| Any observed representation changes | Re-evaluate related assertions without treating one node as a permanent source of truth. |
| Equivalent wording, proposals, historical references, or distinct attributes | Preserve the semantic distinctions and avoid inappropriate conflict alerts. |
| User corrects a mistaken relationship | Update the association and affected notices. |
| User confirms a genuine change | Identify known affected resources and prepare appropriate follow-through. |
| User explains a valid difference | Preserve it; only suggest action if the explanation reveals an actual need. |
| User proposes a change needing agreement | Prepare a question and keep the decision pending. |
| Approved edits and message | Verify results separately, including the actual communication destination. |
| Content changes after preview | Invalidate the stale operation and prepare a fresh review where needed. |
| A step fails or message outcome is uncertain | Show partial completion; avoid false success and duplicate sends. |
| Pause, excluded resource, or out-of-scope page | Respect the observation boundary. |
| Source or model is unavailable | Show an incomplete check rather than agreement. |

## Proposed two-minute demonstration

| Time | Visible behavior |
| --- | --- |
| 0:00-0:15 | Establish the coordinator's task and show that a scoped session is enabled. |
| 0:15-0:40 | Normal browsing and independently authored email establish the related information; no per-resource enrollment. |
| 0:40-1:00 | A confirmed venue update is observed and LivingThread appears beside the stale draft wording. |
| 1:00-1:20 | Inspect evidence and review minimal changes for both the email and project document. |
| 1:20-1:50 | Approve and execute the edits; show real resulting content and operation status. |
| 1:50-2:00 | Show remaining issues or completion within checked coverage, and explain the value. |

The original and updated floors are explicit in the evidence: "Level 3, Room 301" and "Level 5, Room 502." The user accepts this story. If the original Slack thread already has the confirmed update, avoid a redundant announcement. Validate the Slack action using a meaningful notification or clarification scenario; do not imply it was demonstrated when it was not.

Use real applications and disclose synthetic demo content. The differentiating experience is automatic relationship discovery in an authorized work context, timely intervention, and appropriate verified follow-through.

## Work sequencing and preparation boundary

The product direction is sufficiently defined for implementation preparation. Follow the [readiness checklist](PRE_EVENT_READINESS.md) and [provenance record](BUILD_PROVENANCE.md). Reopen product scope only when real integration evidence or owner feedback warrants it.

Preparation now consists of product discussion, specifications, documentation review, identifying account/setup prerequisites, and an inventory of existing reusable building blocks. No core implementation is present.

During the official build period, implement real observation and action adapters, session-scoped discovery, semantic association, change/conflict interpretation, in-place intervention, and coordinated follow-through. Start with a working Docs/Gmail workflow and then include Slack. Resolve library choices and UI details through actual integration evidence.

The rules expressly permit existing templates, components, libraries, prompts, and starter code, while requiring the submitted project and its core functionality to be built during the event. Planning and environment preparation are our working interpretation of permissible preparation, not a separate organizer ruling. Project-specific core functionality must not be built early and relabeled as a reusable component. Record reused materials and event-built work separately. See the [event brief](EVENT_BRIEF.md).
