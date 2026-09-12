# Live integration acceptance

This record distinguishes the product's real integrations from synthetic tests and development-assistant browser actions. Account identifiers, private fixture URLs, and credentials are intentionally omitted.

## September 12, 2026 checkpoint

| Check | Evidence | Result |
| --- | --- | --- |
| Extension pairing and loaded build | Initial pairing succeeded with v0.1.1 at approximately 03:38 UTC. Edge now has v0.1.4 loaded; the real service returns authenticated HTTP 200 responses. | Passed |
| Work-session activation | Owner clicked Start work session; service recorded `enabled: true` at 03:41:14 UTC. | Passed |
| Gmail observation | The actual content adapter reported the open Atlas demo draft's subject/body to the service, 238 characters, editable and fresh. The draft was restored after a browser reload. | Passed for this synthetic personal-account draft; no inbox crawl or email send |
| Google Docs observation | The product's authenticated export produced a fresh 336-character baseline observation from the intended personal-account document. | Passed for this fixture; multi-tab coverage remains unverified |
| Slack installation and event delivery | Owner installed the app and its runtime connection is active in a dedicated allowed channel. Two owner-approved synthetic messages were posted by the development assistant as the signed-in user and received by the product's Socket Mode adapter. | Actual connection and message observation passed; this does not test posting as the LivingThread bot |
| Compatible baseline | The service observed three sources: Slack baseline, Google Doc, and Gmail draft. After the semantic specificity correction below, it returned zero findings. | Passed for the actual observed fixture |
| Confirmed venue change | The second facilities confirmation added a fourth observed source. Actual product analysis returned one conflict, exactly two replacement proposals targeting Docs and Gmail, and no Slack action. | Automatic association and action proposal passed for this fixture |
| Native Gmail notice | The product's in-page notice was visually verified in the real Gmail composer after the confirmed venue change. | Passed |
| Semantic evaluation | Twelve recorded real Azure evaluation calls cover seven unique synthetic cases, including compatible-specificity and resolved-history regressions. All recorded evaluations passed. | Scenario evaluation passed; broader model reliability is not established |
| Actual reviewed edits | At 04:15:08 UTC, the development assistant clicked the product's **Apply 2 changes** control for the reviewed actions. The product reported Docs success at 04:15:15 after exact saved-export verification and the Saved to Drive indication, and Gmail success at 04:15:17 after a fresh saved-state indication. | Both actual adapter writes passed; these were dispatched through LivingThread |
| Persistence after application reload | At approximately 04:16 UTC, both applications were reloaded and their own product adapters freshly re-observed the Level 5 / Room 502 wording. Original time, presenter, and remaining text were unchanged. | Passed for both real applications |
| Post-write resolution | After the historical-message correction and service restart at approximately 04:18 UTC, all four actual sources were freshly observed. The real post-write check completed in 2,495 ms and returned `findings: []`. | Passed; the superseded Slack baseline no longer produced a warning |
| Complete automatic notice → evidence → approval → saved changes → reload → resolution | Real observations produced the native notice and two proposals; the product applied the reviewed edits, verified both saves, freshly observed both after reload, and resolved the issue. | Passed for the dedicated live fixture |
| Public repository requirement | The root agent inspected GitHub: the repository is private, and anonymous access returns 404. | Public submission requirement pending; uploaded does not mean public |

The two Slack fixture messages were sent by the development assistant under explicit owner approval, using the signed-in user's identity. Their creation is test setup; their receipt through LivingThread's own adapter is product integration evidence. Neither fixture message was posted through LivingThread's approved bot-message action. The assistant later clicked the product's reviewed approval control; the actual text changes were carried out and verified by LivingThread's own adapters. No email was sent. Ordinary assistant browser editing is not counted as product saved-edit success.

## Remaining issues

- **Analysis availability:** A subsequent v0.1.4 Gmail edit was saved successfully, but its post-write Azure analysis timed out. The UI retained the successful edit receipt and separately reported that the check was unavailable. The service now retries a timeout or transport failure once after a two-second delay. Cancellation stops a pending retry; pausing the session cancels the analysis. Both attempts can still fail, and their error remains explicit. Edits are never replayed by an analysis retry.
- **Gmail receipt lifetime:** The current composer retains its action results as findings change. Gmail generates a new composer identity after a full page reload, so that new composer cannot recover its old receipt. The private operation journal retains the result, and the stable Docs source can reopen its relevant group.
- **Slack actions:** Actual posting through LivingThread's reviewed bot-message action, and live edit/deletion event handling, remain separate pending checks.
- **Submission visibility:** The GitHub repository is currently private. Public visibility must be established before the required public-repository submission is complete.

## Earlier failures and resolved checks

- **Pairing:** The early unresolved pairing state is superseded by the real authenticated HTTP 200 check. Loading an extension alone was not counted as successful pairing.
- **Docs export:** v0.1.1 content-script requests failed with `Failed to fetch`. The export was moved to the extension worker with required host access and sender-tab binding. v0.1.3 subsequently produced the actual 336-character document observation. This resolves the read check for the fixture; it does not establish saved-write support.
- **Compatible specificity:** The initial live baseline produced a false positive from compatible differences in detail. “Level 3, Room 301” and “third floor” do not disagree merely because one omits a room. The agent instructions were corrected with a general compatibility rule, not an Atlas-specific branch. The actual three-source baseline then produced no findings. Two follow-up compatible-specificity evaluations and two confirmed-change evaluations also passed.
- **Historical Slack after saved edits:** The first post-write check still flagged the explicitly superseded Slack baseline with zero actions. A general history/current-state rule corrected that interpretation. Two resolved-history evaluations and another confirmed-change regression passed. After restart and fresh observation of all four actual sources at approximately 04:18 UTC, the live check returned no findings in 2,495 ms. The old false positive is resolved for this case.
- **Docs polling pressure:** The current reader reuses successful snapshots for a 30-second idle interval, refreshes for relevant saved changes/explicit checks, and backs off for 60 seconds after a 429 response. Focused tests verify this behavior and sender-tab binding. Those tests do not guarantee continuous server freshness or eliminate external rate limits.

## Verification checkpoints

- 64 automated tests passed before the v0.1.2 export change, including connection races, popup errors, state validation, journal recovery, semantic output validation, and synthetic transport tests.
- All 67 tests pass after the v0.1.2 changes. The extension bridge's six focused tests check that export requests are bound to their sending Doc, require an active session, and reject HTML sign-in responses as content, and that unchanged observations do not create a polling feedback loop. These tests do not prove that Google's real export route works.
- Syntax and manifest reference checks passed after the export change.
- A later full-suite checkpoint passed 71 tests, followed by 13 focused Docs/bridge tests. The latest full run now passes **90/90 tests**. These are overlapping historical checkpoints, not counts to add together.
- The [semantic report](SEMANTIC_EVALUATION.json) records the initial five passing calls plus seven follow-up calls, for **twelve evaluation calls across seven unique cases**. Live observation-triggered analyses are separate from that evaluation-call count.

## v0.1.4 review and clarification checks

- The owner reloaded v0.1.4. In the actual Docs page, the new results button reopened the original group with both verified edits after a page reload. The rendered panel was visually inspected.
- A second synthetic Gmail venue correction used the actual **Apply change** button. The exact approved group stayed visible through execution, then showed one verified saved action while the independent cross-app check was still running. The later model timeout remained separate from the edit result.
- Six transport/cancellation regression tests cover bounded retry behavior; they use synthetic transport failures and do not claim a reproduced live Azure outage recovery. The full automated suite now passes 90 tests.
- After loading the retry code, the real four-source check completed at approximately 04:33 UTC in 2,118 ms with zero findings and no error. A subsequent live service check paused during active analysis, verified clean cancellation, and restored the previously enabled session. No application actions were replayed.
- A synthetic draft time difference first produced the expected time-conflict proposal. Submitting **Reconsider with this context** explained that the earlier slot was internal staff setup. The model then proposed retaining the time and changing the activity label to internal staff setup, with no Docs or Slack action. A later recheck accepted the clarified distinction without an edit proposal. This validates reinterpretation, not deterministic wording or guaranteed follow-up edits. No action was approved in this clarification branch; the fixture was restored afterward.

Both edited resources have passed the application-reload check, and the original full-flow post-write analysis resolved the venue issue. Keep subsequent availability failures explicit and verify the final recording run independently.
