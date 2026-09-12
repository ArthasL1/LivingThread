# LivingThread — Two-minute demo

**Recording plan; final video pending.** The actual venue-change workflow passed live acceptance on September 12: Slack event delivery, Docs/Gmail observation, automatic Gmail notice, two approved saved edits, and persistence after both application reloads. The semantic interpretation of retained historical messages and the continuity of operation results received follow-up fixes. See [live acceptance](LIVE_ACCEPTANCE.md) for the current evidence and limitations.

The scenario is fictional and runs in real Slack, Google Docs, and Gmail. The product must obtain observations through its own adapters and produce findings through the configured Azure model. Do not inject a prepared finding, hardcode “Atlas,” run the test-fixture evaluator as the application, or use the development assistant's browser tools as a hidden product runtime.

## Rehearsal setup

- Use the intended personal Google account in the paired browser profile, a short editable Google Doc, one recipientless Gmail draft, and an allowed demo Slack channel.
- Run the local service, connect the extension, and choose **Start work session**. Keep the Doc and Gmail composer open. No resource enrollment is required.
- Establish actual observations of the baseline below and wait for the current check to finish. Verify that the source list contains the intended Doc, draft, and Slack messages. The session's observation scope must be visible to the demonstrator.
- Confirm both target adapters can save the exact approved edit and verify the result. Test reopening the Doc and saved draft before filming. A page overlay or a successful helper test does not satisfy this check.
- Reset with explicit, current baseline wording in the test channel and both editors. Use a fresh, clearly identified test event if old messages would make the reset ambiguous. Start a fresh rehearsal only after the source state is verified; preserve operation history and uncertain outcomes.
- Finish the recording under two minutes. The timestamps below are a target edit, not measured product latency. If waiting is shortened in the final video, label the cut; do not imply a faster reaction than actually observed.

## Baseline content

**Event:** Atlas customer demo, 18 September 2026, 15:00–15:30 HKT. Initial location: Level 3, Room 301. Updated location: Level 5, Room 502. All names and arrangements are synthetic.

Slack baseline:

> Confirmed: the Atlas customer demo is on 18 September 2026, 15:00–15:30 HKT, at Level 3, Room 301. Jamie will lead the product walkthrough.

Google Doc title: **Atlas demo brief**

> The Atlas customer demo is scheduled for 18 September 2026, from 15:00 to 15:30 HKT. The demo will take place on the third floor. Jamie will lead the product walkthrough.

Gmail subject: **Atlas demo: arrival details for 18 September**

```text
Hi Morgan,

We look forward to the Atlas customer demo on 18 September 2026, from 15:00 to 15:30 HKT. When you arrive, head to the third floor. Jamie will meet you there.

Best,
Jamie
```

New Slack message for the presenter to post during the demonstration:

> Confirmed with facilities: the Atlas customer demo on 18 September 2026 has moved to Level 5, Room 502. The time remains 15:00–15:30 HKT.

This script is not authorization for the development assistant to send that message. The presenter controls the synthetic change in the intended demo channel.

## Two-minute sequence

| Time | Screen and action | English narration |
| --- | --- | --- |
| 0:00–0:12 | Show the baseline Slack message and briefly show the enabled work-session popup. | “Plans live in conversations, documents, and emails. When a detail changes, those versions drift. LivingThread connects the information while you work.” |
| 0:12–0:28 | Switch to the Doc, then the Gmail draft. Point at “third floor” in each. | “Here is one customer demo, described differently in three apps. I have enabled a work session. I have not tagged these items, copied them into a chatbot, or asked for a comparison.” |
| 0:28–0:41 | In Slack, the presenter posts the confirmed Level 5 update above. Return to the Gmail composer. | “The team confirms a new venue. The customer email still points to the old floor.” |
| 0:41–0:56 | Keep the Gmail composer visible while the product observes and checks. Capture the notice **A detail may be out of date** appearing. | “LivingThread shows up beside the affected draft. It recognizes the shared event even though the wording differs.” |
| 0:56–1:14 | Click **Review the connection →**. Show **What connects these details**, the exact source quotes, source links, and coverage/observation labels. | “The notice shows its evidence: the confirmed Slack change and the outdated wording. I can inspect what it observed before deciding what to change.” |
| 1:14–1:29 | Under **Review the next steps**, inspect **Update Gmail** and **Update Google Docs**. Show **Current wording** and **After your approval**. Leave the two intended edits selected and click **Apply 2 changes** once. | “It proposes two precise edits. The floor changes; the event time and everything else stay intact. I approve both changes here.” |
| 1:29–1:51 | Keep **Operation results** visible. After actual success, show the Gmail wording and switch to the Doc to show its saved fifth-floor wording. Use the rehearsed reload/reopen check if it fits; otherwise include a clearly labeled cut from the same verified run. | “Each action reports its own result. The draft and the saved brief now agree. The email remains a draft, and there is no redundant Slack announcement.” |
| 1:51–2:00 | End on the real corrected draft or Doc with the LivingThread review/result panel. | “LivingThread: different apps, one living thread. It catches the inconsistency where the work is happening—and keeps the decision with you.” |

The model may choose a longer unique substring than “third floor,” or include “Level 5, Room 502.” Narrate the actual displayed proposal. Do not force a specific generated summary or manufacture an exact checkbox count; **Apply 2 changes** is the current UI label only when two valid edits are available and selected.

## Acceptance before recording the final version

1. No manual Thread enrollment or comparison prompt was needed; the finding came from real observations and a real model call.
2. The in-page notice appeared automatically in the relevant Gmail composer. Record actual change-to-notice time separately from any video edit.
3. Both proposals quote exact existing text, name the correct targets, and preserve 15:00–15:30 HKT and unrelated wording.
4. Both native applications contain the approved changes after a saved-state check. **Operation results** agrees with the actual outcome. Gmail was not sent.
5. A separate failure check confirms changed/unavailable targets produce a failure or uncertain result, rather than false success. Do not spend the main two-minute story demonstrating every branch.

If a target reports `failed` or `uncertain`, stop the success narration and say: **“This edit has not been verified. LivingThread reports that separately so I can inspect the target.”** Preserve that outcome, fix the integration, and repeat the rehearsal before recording a successful full-flow claim.

## Optional explanation for questions after the video

The actual UI offers **This difference is intentional…**, an **Explain the difference** field, and **Reconsider with this context**. A clarification triggers another interpretation; it does not authorize a write. Pending findings say **Keep the decision open** and retain existing arrangements. A useful Slack communication has an **Exact message** preview showing the channel, parent thread, LivingThread identity, and audience before a **Send message** approval. These branches should be described as implemented features until separately verified in the real application.

### Coordination branch for a separate rehearsal

Keep the confirmed customer demo at 15:00–15:30 HKT and Level 5, Room 502. In a separate recipientless Gmail draft, propose moving it to 16:00–16:30 HKT and explicitly state that the team and facilities have not agreed. Keep the original customer draft saved.

Expected behavior: a pending notice, with no speculative document or draft replacement. If the appropriate audience is unclear, explain that the observed Slack conversation is the internal coordination thread. Inspect any proposed Slack question, its exact destination, and its wording before approval. The message must ask about agreement rather than announce a confirmed change. Sending the question does not confirm the proposed time.

Suggested narration: “This time the change is only a proposal. LivingThread keeps the confirmed plan and helps me ask the relevant team before updating customer details.”

This is a separate functional check. The main two-minute video remains focused on the complete venue-change story. Creating this rehearsal plan does not authorize an external message.

## Final recording record

| Field | Value |
| --- | --- |
| Recording date/time and Git revision | TODO after successful rehearsal |
| Browser/version and account profile | TODO; redact personal account identifiers in public materials |
| Slack observation and exact target channel verified | TODO |
| Observed change-to-notice latency | TODO; preserve actual timing |
| Gmail save/reopen check | TODO |
| Google Docs save/reload check | TODO |
| Both operation results | TODO; record actual statuses |
| Final video URL and duration | TODO; at most two minutes |
