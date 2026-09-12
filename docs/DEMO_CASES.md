# LivingThread Demo Cases

> **Historical planning/preparation record.** This file preserves its original checkpoint; pending or proposed items are not a statement of current functionality. For the implemented v0.1.5 prototype, see the [project README](../README.md), [setup guide](SETUP.md), and [live acceptance](LIVE_ACCEPTANCE.md).

Status: Written preparation only. These cases have not been run against LivingThread. They are demo fixtures and expected product behavior, not model prompts, adapter code, or an implemented evaluation system. All people, messages, and arrangements below are fictional. The assistant owns preparation and later execution of these cases.

## Shared baseline

Use real Slack, Google Docs, and Gmail during the event. Enable an explicitly scoped work session. Let the user visit and write normally; do not require them to create a Thread or enroll each resource. Reset each case independently. Dates and timezones are explicit so that unrelated events or arrival times are not conflated.

- Event: Atlas customer demo.
- Date: 18 September 2026.
- Customer demo time: 15:00-15:30 HKT (UTC+08:00).
- Initial venue: Level 3, Room 301.
- Fictional roles: Alex coordinates facilities, Jamie leads the walkthrough, Morgan is the customer contact.
- Suggested test channel: atlas-demo, subject to the selected test workspace.
- Gmail remains a draft; recipient addresses are left empty during preparation. Creating these written fixtures does not send or authorize any message.

Slack baseline:

> Confirmed: the Atlas customer demo is on 18 September 2026, 15:00-15:30 HKT, at Level 3, Room 301. Jamie will lead the product walkthrough.

Google Doc title: **Atlas demo brief**

> The Atlas customer demo is scheduled for 18 September 2026, from 15:00 to 15:30 HKT. The demo will take place on the third floor. Jamie will lead the product walkthrough.

Gmail subject: **Atlas demo: arrival details for 18 September**

> Hi Morgan,
>
> We look forward to the Atlas customer demo on 18 September, from 15:00 to 15:30 HKT. When you arrive, head to the third floor. Jamie will meet you there.
>
> Best,
> Jamie

The Doc and email independently express the floor without copying the complete Slack sentence. Room numbers do not establish floors; both original and updated floors must be stated explicitly in the evidence.

## Case 1: Confirmed venue change

Starting state: the session has observed the baseline, and the email composer is open.

New Slack evidence:

> Confirmed with facilities: the Atlas customer demo on 18 September has moved to Level 5, Room 502. The time remains 15:00-15:30 HKT.

Expected behavior:

1. A notice appears beside the affected email after the supported adapter observes the update, without a comparison prompt.
2. Show the email's "third floor" wording and the new Slack excerpt, with source links and observation times. Explain that the venue details may be out of date.
3. Preview changing "third floor" to "fifth floor" in the email and the corresponding current Doc passage. Preserve the event time, Jamie's role, and all unrelated wording.
4. After the user approves the concrete edits, re-check their targets, apply them through the actual integrations, and verify that the changes persisted.
5. Show each operation's result separately. Do not post a redundant update to the Slack audience that already received the confirmed change.

Failure conditions: mandatory resource enrollment; automatic truth chosen solely by latest timestamp; a display overlay mistaken for a saved edit; a changed preview applied to stale content; or an unverified completion claim.

## Case 2: A conflict already exists

Starting state: Slack and the Doc already state Level 5 / fifth floor when first observed. The user independently writes the baseline email saying "third floor." No update or copy event occurs while LivingThread is running.

Expected behavior: automatically associate the eligible email with the same event, identify the inconsistency, and offer the evidence and reviewed email correction. The Doc already agrees and does not need another edit. A clipboard event must not be required to trigger detection.

Control: a separate document about a different Atlas event on another date must not be linked from the name alone.

## Case 3: A legitimate arrival-time difference

Replace the relevant timing statements with:

Slack:

> For the Atlas customer demo on 18 September, staff setup starts at 14:30 HKT. The customer presentation starts at 15:00 HKT.

Doc:

> Jamie and the setup team should arrive at 14:30 HKT. The customer demo begins at 15:00 HKT.

Gmail:

> Please arrive at 15:00 HKT for the Atlas customer demo on 18 September.

Expected behavior: preserve staff arrival and customer presentation as different attributes/audiences. Do not propose changing the customer's arrival to 14:30. Treat "3 PM HKT" and "15:00 HKT" as equivalent in otherwise matching context.

If a user clarification establishes this distinction, revise the relationship interpretation rather than merely muting the warning. Do not execute any edit when no edit is needed.

## Case 4: A proposed change awaits agreement

Starting state: the confirmed demo time is 15:00-15:30 HKT.

New Slack evidence:

> Could we move the Atlas demo on 18 September to 16:00-16:30 HKT? Alex, would that work for facilities?

User clarification:

> I would prefer 16:00, but Alex has not agreed yet.

Expected behavior: keep 15:00 as the currently confirmed arrangement and 16:00 as a pending proposal. Do not rewrite the Doc or email as though the change were confirmed.

If useful, prepare this bounded communication for review:

> Alex, can you confirm whether facilities can support the Atlas demo on 18 September at 16:00-16:30 HKT? We will keep the current 15:00-15:30 arrangement until it is confirmed.

Show the exact channel, parent thread, audience, text, and LivingThread app identity. Only send when that concrete action is approved. If the question has already been asked, avoid duplicating it. Observe relevant replies only within the supported session scope. A reply confirming facilities availability does not establish the customer's agreement; identify what remains pending before proposing a final cross-app update.

This case is the meaningful Slack action check. A prepared message is not evidence of a sent message. Silence and one participant's assent are not group consensus.

## Case 5: Stale evidence or an interrupted edit

Variant A: observe the baseline Doc, then close its tab while using a page-only adapter. Later receive the confirmed Level 5 Slack update.

Expected behavior: the fresh Slack evidence may justify a notice beside the old email wording. Label the Doc excerpt with its last observation time and make clear that its current content is unchecked. Reopen and observe the Doc before proposing a current edit. Do not claim that closing the tab keeps the document synchronized. An authorized API adapter may refresh it instead, if that path was actually implemented.

Variant B: show an approved two-edit plan, but change the Doc's target passage before execution or make the Doc unavailable.

Expected behavior: re-check the affected target, withhold the stale or unsupported edit, and show the actual status. If the Gmail edit succeeded, retain it and report partial completion. Do not claim both resources were updated. Any message stating that the Doc was updated depends on verified success. Before retrying an uncertain communication result, check whether it already exists.

## Evidence to record during the event

For each case, record the actual application/browser version, adapter used, source coverage, whether behavior passed, observed notice latency, and links or recordings of verified outcomes. Measure latency from source observation as well as from the visible external change where possible. Separate model latency from adapter and UI delay. These written expectations do not themselves establish any successful integration.
