# Ideation 03: Recurring Problems and Existing Alternatives

> **Historical planning/preparation record.** This file preserves its original checkpoint; pending or proposed items are not a statement of current functionality. For the implemented v0.1.5 prototype, see the [project README](../README.md), [setup guide](SETUP.md), and [live acceptance](LIVE_ACCEPTANCE.md).

Status: Discussion only; no selection or core implementation. Sources checked September 11, 2026. Market comparisons are a limited initial scan, not an exhaustive novelty assessment.

Subsequent owner feedback: LivingCopy was endorsed for deeper exploration and the project is now named LivingThread. The concept now includes changes in any connected representation and conflicts between independently expressed information, extending this pass's source-to-copy framing. See [the current concept](LIVINGTHREAD_CONCEPT.md). The ideas below retain their original brainstorming names as historical alternatives.

## Updated constraints

- A visibly distinct experience from assigning a task to a capable general-purpose agent remains important.
- The problem must recur naturally for the intended user. Avoid requiring an unusually choreographed scenario to demonstrate value.
- Include installation, setup, answering questions, and correcting mistakes in the cost of using the product.
- Assume computer and phone hardware. Team size and coding specialization are not selection bottlenecks according to the owner; Codex will assist with implementation.
- Treat application permissions, platform access, latency, and integration reliability as practical constraints.

## LivingCopy

Working pitch: "The facts you copy should not silently go stale."

Intended users: people who reuse changing information in announcements, project updates, support replies, and other written communications.

Natural workflow: a coordinator copies an event's location from a planning page into an announcement draft and rewrites it in their own words. Someone later changes the location in the source. The draft retains the old meaning even though it no longer contains an exact copy of the original text.

Proposed interaction: an extension records the selected source, its version, and a user-created connection to a destination passage. When the source changes, the agent checks whether the destination's meaning has become outdated. It highlights the affected passage inside the editor, shows the source change, and proposes a minimal revision. The user reviews the revision before it is applied.

Example: a source changes the workshop location from "Level 3, Room 301" to "Level 5, Room 502." A draft saying "Meet us on the third floor" becomes suspect. Floor information is explicit in the source, not guessed from room numbers. An unrelated wording edit in the source should produce no warning. A deliberate quotation of the old announcement should remain historical when marked as such.

Core differentiator: capture the relationship at the moment information is reused, retain it through supported paraphrases, and act in the destination editor when the original changes. General agents can compare documents when given both; they do not obtain this particular relationship merely from a task prompt.

Build boundary: one source adapter, one destination editor adapter, explicit linked paste, two or three factual relationships, and user-reviewed patches. Track observed source versions; show an unknown or outdated-check status if the source cannot be read. Do not promise coverage of arbitrary apps, arbitrary manual edits, or already-sent messages.

Demonstration: copy into a draft, paraphrase, change the source, see an anchored warning, review and apply a correction. Include a harmless source edit that produces no warning.

Existing alternative: [Microsoft Loop components](https://support.microsoft.com/en-us/loop/get-to-know-loop-components) already synchronize shared content across supported surfaces. The proposed distinction is tracking independently worded text and proposing semantic repairs, rather than displaying another instance of the same component. If the prototype only synchronizes exact copies, it fails this test.

Key uncertainty: whether source-to-passage links survive useful edits with acceptably few false alarms. Recurring demand for this exact interaction has not yet been established through user interviews.

## FormRelay

Working pitch: "The form asks the right person."

Intended users: project coordinators or operations staff completing third-party questionnaires that require answers from several people.

Natural workflow: a customer's onboarding questionnaire asks about service requirements, technical configuration, and an implementation date. Its recipient knows only some answers and must forward questions, interpret replies, and copy the results back into a single submission.

Problem evidence: [a Typeform community discussion](https://community.typeform.com/build-your-typeform-7/collaborative-form-2225) contains firsthand descriptions of this problem, including technical qualification questionnaires and separate business/technical contributors. The posts establish that the problem occurs; they do not establish its population frequency or Typeform's current feature availability.

Proposed interaction: the extension reads the live form's fields and constraints. The coordinator identifies the relevant contributors. Each contributor receives a limited mobile request through a link the coordinator shares. The agent interprets their reply, asks only for unresolved required details, and proposes values in the original form. A conditional field appearing after an answer generates the corresponding follow-up. The coordinator reviews and submits through the original website.

Core differentiator: add a coordinated contribution workflow to an existing third-party form from the respondent's side. The recipient does not need to own or redesign that form. The agent handles interpretation and follow-up; deterministic code validates required fields, options, and proposal versions.

Build boundary: one supported form family, two contributor sessions, a small set of input types, text replies, and a genuine conditional field. Contributor links are scoped and expire. Contributors only see relevant questions, but the coordinator necessarily sees answers inserted into the final form. Keep website login credentials on the coordinator's side.

Demonstration: an original form remains open on the computer while a phone contributor answers. Choosing an option exposes a new required field, the agent asks the relevant follow-up, and the validated response returns to the original form.

Existing alternatives: [Liveblocks](https://liveblocks.io/use-cases/collaborative-form) supports building collaborative forms, while [Formester](https://formester.com/features/collaborative-forms/) supports roles and field-level assignees in its own platform. Simply building another collaborative form would be weak. Respondent-side adaptation and agent-driven clarification must be demonstrated.

Key uncertainty: whether supporting enough third-party forms is worth the integration effort. A shared document plus manual entry is a serious baseline; the prototype must remove coordination work rather than add a second form to manage.

## Turnkeeper

Working pitch: "Your conversation should not move on before you can answer."

Intended users: adults who type messages to participate in spoken conversation, initially focusing on text-based AAC users.

Problem evidence: [CommunicationFIRST's guide written by AAC users](https://communicationfirst.org/wp-content/uploads/2025/03/Best-Practices-for-Online-Meetings-with-AAC-Users-by-AAC-Users-v1.pdf) explicitly asks conversation partners to wait while a message is being composed and to avoid moving the conversation on without the participant. This supports the existence of the problem, not the effectiveness of this proposed product.

Proposed interaction: while the user composes a reply on a phone, the system associates it with a selected or suggested question from the ongoing conversation. It can display a user-controlled indication that a reply is being prepared. When the message is ready, the user authorizes playback. If the topic has changed, the agent proposes a short reference to the original question, which the user can approve together with the exact response. It waits for an appropriate opening or lets the user play immediately.

Example: the user types "Yes" in response to meeting on Friday. Before they finish, others discuss bringing equipment. The interface identifies that "Yes" belongs to the date question and proposes "About meeting on Friday: yes." It never silently interprets that answer as a commitment to bring equipment.

Core differentiator: link the user's composing state, the live spoken context, and the timing and reference of their authorized contribution. The agent protects the connection between what was asked and what the user actually chose to answer.

Build boundary: a foreground mobile web app, microphone permission, a short visible conversation history, editable response anchoring, large controls, and text-to-speech for user-approved content. Demonstrate an in-person conversation before attempting meeting-platform integration. Do not require video, infer emotion, or generate opinions for the user.

Existing alternative: [Speech Assistant AAC](https://www.asoft.nl/SpeechAssistantAAC-Android-UserManual.pdf) already provides message entry, speech output, and stored phrases. A fixed request to wait plus ordinary text-to-speech is an important simpler baseline. The agent must contribute meaningful reference and timing support beyond that baseline.

Key uncertainty: user preference and accessibility. An extra decision step or automatic conversational interruption could make the experience worse. A working prototype would not establish suitability as an AAC product; feedback from intended users would be essential before prioritizing deployment.

## Directions deprioritized during this pass

- Intelligent copy/paste that maps data into forms: [UiPath Clipboard AI](https://docs.uipath.com/clipboard-ai/standalone/latest/user-guide/introduction?fallbackCount=1&fallbackReason=invalidTopic&isFallback=true) already covers semantic data transfer and transformations.
- Automatic privacy masking during screen sharing: [Safe Screen Share](https://www.safescreenshare.com/) describes both pattern matching and contextual AI redaction; other direct alternatives also surfaced.
- Adaptive screen guidance for software tutorials: [Tarcy](https://www.tarcy.in/) describes guides that adapt to the learner's screen.
- Multilingual live collaboration: [Linqa](https://linqa.eu/) and [Unison](https://unison.devtochukwu.me/) describe related collaborative translation experiences.

These product descriptions were used to identify overlap; their reliability and market adoption were not independently tested.

## Implementation basis

The browser approach is grounded in [Chrome content scripts](https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts), which can read and modify supported pages' DOM with appropriate permissions, and browser [copy events](https://developer.mozilla.org/en-US/docs/Web/API/Element/copy_event). This does not imply universal access to canvas editors, protected pages, or every embedded frame.

The phone audio approach uses [getUserMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia), subject to user permission and a secure context. Device behavior, network latency, and supported audio output still need to be tested on the actual phone.

## Provisional discussion order

LivingCopy has the most promising combination of a familiar activity and a distinctive in-place intervention. FormRelay has clearer firsthand problem evidence and a visible computer-to-phone workflow, with a substantial risk of becoming ordinary form software. Turnkeeper has strong firsthand evidence for the underlying access barrier and a distinct live interaction, but the largest user-experience validation gap.

No ranking constitutes a product selection. The next decision should identify which recurring problem feels convincing enough to justify a narrow feasibility test.
