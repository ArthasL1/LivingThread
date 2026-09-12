# LivingThread operator guide — v0.1.5

Use this runbook to rehearse and record the real Slack → Google Docs → Gmail venue-change workflow. The operator posts the fixture messages in Slack; LivingThread discovers the connection, proposes two edits, and executes only the edits you approve. No email is sent.

The central story is **an agent showing up where work is already happening**. Configure and start the session before the final recording. Keep the confirmed Slack change → return to Gmail → automatic notice in one continuous segment wherever practical. The operator does not first notice the error, open an assistant chat, request a comparison, or enroll the individual resources. Show those facts through the interaction, then show the evidence and reviewed action. The full English voiceover is in [DEMO_SCRIPT.md](DEMO_SCRIPT.md).

The UI labels below come from v0.1.5. Model-written summaries and replacement wording vary. “Expected” describes a checkpoint to verify, not a claim that your next take has already passed. Previous live results are recorded separately in [LIVE_ACCEPTANCE.md](LIVE_ACCEPTANCE.md).

## 1. Understand the three switches

| Component | What it does | What starting it does not do |
| --- | --- | --- |
| Edge extension | Reads supported open pages and displays notices, previews, and receipts. | Installing it does not start the local service or the work session. |
| Local service | Runs on this computer at `127.0.0.1:4317`; handles the model, Slack, context, and operation journal. | Starting it does not authorize observation. It starts with the work session paused. |
| Work session | Enables supported page observation, starts configured Slack observation, and schedules comparisons. | Starting it does not approve any edit or message. |

**Connect local service** pairs the extension with the running service. **Start work session** enables observation. **Pause work session** stops observation and cancels analysis; it does not clear the session's collected context or reverse edits.

Keep the extension, Docs, and Gmail in the same intended Edge profile. Slack uses the service's configured app connection, not the browser's login alone. Its tab is useful for the demonstration, but keeping it open is not required for event delivery.

## 2. Choose one take pack

Open one pack and copy its English blocks into the indicated applications. Do not mix names or dates between packs.

| Pack | Event | Date | Purpose |
| --- | --- | --- | --- |
| [Take 01](demo/take-01-rehearsal.md) | Harbor customer demo | 21 September 2026 | First complete rehearsal |
| [Take 02](demo/take-02-recording.md) | Cedar customer demo | 22 September 2026 | Recording after rehearsal |
| [Take 03](demo/take-03-retake.md) | Maple customer demo | 23 September 2026 | A clean additional take |

Each uses 15:00–15:30 HKT, a third-floor baseline, a confirmed move to Level 5, Room 502, Jamie as presenter, and Morgan as customer. The packs supply the Slack baseline, Doc title/body, Gmail subject/body, and confirmed Slack update. Copy only the intended text block, not Markdown fences or section headings.

The main recording is **venue change only**. Do not introduce the separate proposed-16:00-time branch, its draft, or clarification into these takes. Close old test Docs and composers before preparation. Retain real Slack history; a fresh event name and date distinguish each take.

## 3. Start the local service and check the extension

If the development assistant already owns the running LivingThread service, ask it to restart that service when needed. Do not launch a second copy. An existing connected, paused installation can continue directly to the page preparation below.

For a manually operated service:

1. Open PowerShell in the LivingThread repository folder. The folder contains `Start-LivingThread.ps1` and `extension`.
2. Run:

   ```powershell
   .\Start-LivingThread.ps1
   ```

3. Leave that PowerShell window running. Expect a line beginning **LivingThread ready at http://127.0.0.1:4317** and `Model configured: true`.
4. Optionally open [the local health page](http://127.0.0.1:4317/health). It should report `status: "ready"`, version `0.1.5`, and `modelConfigured: true`. This is a health check, not the product interface.

If the extension is not installed, open `edge://extensions/`, enable **Developer mode**, click **Load unpacked**, and select the repository's **extension** folder. Pin LivingThread through Edge's extensions menu for convenient access. If it is already loaded, keep that installation; loading another folder/profile can create a different extension identity.

After replacing extension files with a newer build, use **Reload** on its extension-management card, then refresh the supported app pages once. A backend-only restart does not require an extension reload.

Click the toolbar's **LivingThread** icon. Check its version, then:

1. If disconnected, click **Connect local service**. A subsequent attempt may be labeled **Retry connection**.
2. Wait for **Connected · work session paused**. Connection alone should leave the session paused.
3. If it is already active, click **Pause work session** while preparing the baseline. Allow any already-running operation to finish before pausing; pause is not a rollback or an emergency undo button.

For a new installation, configure model and Slack access before recording. Use [SLACK_SETUP.md](SLACK_SETUP.md) for app installation and channel membership; keep credentials in the local `.env`. Merely logging into Slack in Edge does not configure the service. The current Docs path uses authenticated browser export and the Docs editor; this take does not require a Google Cloud setup step.

## 4. Prepare three real application pages

Use the intended personal Google account for both Docs and Gmail. An account slot such as `/u/0/` or `/u/1/` is not proof of which account is selected; check the visible account avatar/menu.

### Slack: establish the original arrangement

Open [Slack](https://app.slack.com/) and the dedicated demo channel already included in the service's channel allowlist. Confirm the LivingThread app is a member. The operator pastes and posts the pack's **baseline** as a channel message.

Keep the demo channel quiet enough for this baseline to remain among its latest 15 channel-history messages. Do not post the confirmed update yet. Using channel messages avoids relying on historical thread-reply backfill.

### Google Docs: create a new operational document

Open [Google Docs](https://docs.google.com/document/), create a blank document, rename it with the pack's title, and paste its body. Use a simple, single-document-tab text fixture. Wait for Google Docs to report that changes are saved to Drive.

Keep this editor tab open. A Docs home page, preview, or closed document does not provide the active editable source needed for this workflow.

### Gmail: create a new recipientless draft

Open [Gmail](https://mail.google.com/), click **Compose**, and paste the pack's subject and body into their separate fields. Leave **To**, **Cc**, and **Bcc** empty. Expand the composer if necessary so its content and LivingThread's card fit comfortably.

Wait for Gmail to save. Keep this composer visibly open; do not send it. Its wording should still say **third floor**. The extension observes open composers, not the entire inbox or closed draft collection.

Arrange the three browser tabs in Slack, Docs, Gmail order. Close old Docs and old composers, including any separate pending-time proposal draft. A clean take needs one current Doc and one current Gmail composer, although retained Slack history may produce more than three total source records.

## 5. Verify the baseline before recording

1. Open LivingThread's toolbar popup and click **Start work session**.
2. Wait for **Connected · work session active**.
3. Visit the prepared Doc and Gmail composer. Allow initial reads and analysis to complete. The popup can show **Checking…** beside its source/finding counts.
4. Confirm its source list includes the intended Doc and draft titles. The popup shows only its last eight source rows; it is not a complete browsing-history display.
5. Expand **Connection & editor diagnostics**. Check that Slack's diagnostic state is `connected` and that recent history for the intended channel has `ok: true`. A connected service alone does not establish Slack history coverage.
6. Wait for a completed baseline check with **no finding for this take** and no error. In a clean session, expect **0 open findings** globally. Old Slack records can increase global counts, so inspect the event name instead of relying on the number alone. On a new page with no earlier receipt or relevant finding, the small in-page indicator should say **LivingThread · Watching this session**.

“Partial coverage” on Docs or Slack is expected in this prototype. It is not equivalent to a failed read, but it also does not establish complete multi-tab document or historical thread coverage.

The detailed Slack venue and the Doc/email's shorter “third floor” wording agree. Omission of Room 301 should not produce a conflict. If a notice is already present, stop and inspect its event and sources before beginning the take.

## 6. Run the venue-change interaction

1. **Post the change yourself.** In the same Slack channel, post the pack's confirmed venue-update block once. It explicitly changes the event to Level 5, Room 502 while preserving the date and time.
2. **Return to Gmail.** Leave its old third-floor wording untouched. Do not open a comparison chat, manually register resources, or click any Track/Add-to-thread control; those are not part of this interface.
3. **Wait for the native notice.** Expect **A detail may be out of date**, the current event name, and **Review the connection →** beside the affected composer. The summary is model-generated.
4. **Click the notice.** Under **What connects these details**, inspect the quoted old wording and confirmed Slack update. Source titles open evidence links; timestamps and coverage describe what was observed.
5. **Review both proposed edits.** Under **Review the next steps**, expect **Update Google Docs** and **Update Gmail**, each with **Current wording** and **After your approval**. The new text must establish the fifth-floor venue and preserve the event time and unrelated content. The model may use “fifth floor” or “Level 5, Room 502.”
6. **Approve the exact plan once.** Both available actions are selected by default. Confirm both checkboxes, then click **Apply 2 changes**. If the button instead includes sending a message, or targets an unexpected resource, inspect the plan rather than following this step blindly. The venue take requires no redundant Slack announcement.
7. **Let the editors finish.** Keep both pages open and avoid typing or changing editor focus during execution. Docs may briefly open its own Find and replace dialog and show a debugger-related browser banner. The product closes its owned dialog and detaches after its editor operations.
8. **Read the receipts.** Expect **Applying your reviewed changes**, followed by **Reviewed actions completed** and **2 of 2 actions verified.** The separate operation rows should say **Google Docs · succeeded** and **Gmail · succeeded**.
9. **Check the applications themselves.** Read the changed Gmail sentence, then switch to Docs and read its changed passage. Keep the saved-state indicators visible where practical. A later manual reload can provide another persistence check after the take; it is not the way to approve an edit.
10. **Check resolution.** Allow the follow-up analysis to finish. Expect no remaining venue conflict; the receipt may say **No open finding is currently reported for this page.** The original third-floor Slack message remains legitimate history because the later confirmed change supersedes it.

**Minimize results** collapses the receipt. **LivingThread · Review results →** or **Review your recent action results →** reopens it. A success receipt remaining visible is not another conflict. Use **What you approved** to inspect the remembered local preview while that page still has it.

## 7. Shape the two-minute recording

Prepare and verify the baseline before pressing Record. The first rehearsal is untimed: learn the buttons and finish the full flow before trying a two-minute take. For the final video, connection, account checks, and initial reading are completed off camera. Suggested pacing:

| Time | Show |
| --- | --- |
| 0:00–0:15 | The same named event across Slack, Docs, and Gmail; explain that wording differs. |
| 0:15–0:35 | Post the confirmed Slack venue change and return to the untouched Gmail draft. |
| 0:35–1:00 | LivingThread appears; open the quoted evidence. |
| 1:00–1:25 | Show both exact previews and click **Apply 2 changes** once. |
| 1:25–1:50 | Show the two verified results and the actual updated Doc and draft. |
| 1:50–2:00 | End with “Different apps. One living thread.” |

These are recording targets, not latency promises. Keep a longer raw capture if necessary, then trim waiting while preserving the causal sequence; do not present edited waiting time as a measured response latency. The operator's two Slack fixture posts are distinct from any message sent by LivingThread. This take demonstrates reviewed editor changes, not a bot conversation or an email send.

## 8. Repeat safely with a fresh take

Do not restore the old floor in the same event after completing its confirmed move. The still-existing Slack update correctly makes that old wording inconsistent again.

1. Let queued/running actions reach a reported outcome. If an outcome is uncertain, inspect that target before proceeding.
2. Click **Pause work session** and confirm the paused state.
3. After their saves finish, close the old Doc tab and save/close the old Gmail composer. Preserve the actual files, drafts, and Slack messages.
4. Restart only the intended backend: in its own PowerShell window press **Ctrl+C**, wait for the prompt, then run `.\Start-LivingThread.ps1` again. If the assistant owns the service, ask it to perform this specific restart instead.
5. Keep `.runtime` intact. Restart clears in-memory observations, findings, clarifications, and dismissals. It retains pairing and `.runtime/operations.json`; it does not revert applications, delete Slack history, or replay approved actions. Previously interrupted queued/running operations recover as `uncertain`.
6. Create a **new Doc and new recipientless draft** from the next pack, and post that pack's baseline. Start the session and repeat the baseline checks.

Slack rereads up to the latest 15 channel messages on connection. Older thread replies are not backfilled. Earlier takes may therefore reappear as historical Slack context, but their different event names/dates should keep them separate from the current take.

Every model request supplies the service's current observations and clarifications with `store: false`; the code does not use an Azure response conversation ID to carry hidden chat history. Restarting changes the local context, not the external records it will observe again.

Refreshing an editor is also not a reset: the service retains context, and Docs may recover an earlier receipt through its stable identity. Gmail composer IDs change across a full page reload, so the old composer observation is removed and its old receipt cannot reliably attach to the reopened draft. The journal still retains the operation. Do not infer failure from a missing page receipt or approve the same change merely to recreate it.

## 9. Recover from common problems

| Symptom | Concrete next step |
| --- | --- |
| **Local service not connected** | Check the intended service window and health page, then use **Connect local service** or **Retry connection**. |
| **Connection not authorized** | Reconnect from the existing LivingThread installation. If another extension identity is paired, ask for targeted pairing diagnosis; do not delete `.runtime`. |
| Port already in use | Do not start another server or terminate all Node processes. Identify the existing LivingThread service and use its window or ask its owner to restart it. |
| No in-page indicator | Confirm an active session, an actual Doc editor or open Gmail composer, and the correct Edge profile. After an extension reload, refresh the supported page once. Paused sessions hide the in-page UI. |
| Docs looks unchanged in observation | Idle exports are spaced about 30 seconds apart; an observed Saving → Saved transition requests a refresh sooner. Wait for save/read completion and inspect diagnostics. |
| Docs HTTP 429/rate limit | Reads back off for 60 seconds. Stop refreshing repeatedly; wait, then check the next read. Other read errors use a shorter backoff. |
| Model check takes a long time | A timeout/network failure gets one read-only retry after about two seconds. Two 45-second attempts can take roughly 92 seconds. If both fail, an error remains visible; no edit/message is retried. |
| Check failed after an edit | Read operation receipts first: a model recheck failure does not undo a saved edit. With no operations running, pause/resume to request another analysis of retained context. |
| **Some actions need attention** or `uncertain` | Inspect each target and save state. Do not click repeatedly. A partial success stays successful; uncertainty requires checking the actual application before any new attempt. |
| Old receipt instead of current notice | Use **Review the current finding →** if shown. **Earlier reviewed actions →** navigates receipts, not unresolved conflicts. For another full take, use the fresh-take procedure. |

There is no visible **Reset session**, **Clear memory**, or **Rescan** button in v0.1.5. **Dismiss** hides that finding; **This difference is intentional… → Reconsider with this context** changes interpretation without authorizing actions. Neither is a clean-recording reset.

When asking for help, report the pack, extension version, session state, source titles, operation statuses, and the displayed diagnostic error. Keep credentials and private account details out of recording frames and shared reports.
