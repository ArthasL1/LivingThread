# LivingThread

**Different apps. One living thread.**

Team **LivingThread** · Solo participant **Zeqi Li**.

An agent that connects related information across apps, flags conflicts where you work, and helps coordinate the right updates. Built for the Agents Everywhere hackathon.

**Status: the real observation-to-resolution workflow is verified.** The owner has loaded v0.1.5 in Edge; fresh Docs/Gmail observations and the native Gmail notice were rechecked after reload. The product observed the personal-account Google Doc and Gmail draft, received actual Slack events, and displayed its native Gmail notice. The compatible baseline produced zero findings; a confirmed venue change produced one conflict and two proposed edits. Both were approved through LivingThread, saved by its adapters, and freshly verified after reloading both apps. A final live check correctly returned no findings after the historical-message correction. The reviewed result group now remains available as findings change; the Docs page can reopen it after a reload. See [live acceptance](docs/LIVE_ACCEPTANCE.md) for exact evidence and limits.

The GitHub repository is currently **private**; the hackathon's public-repository requirement is still pending.

Core implementation began on **September 12, 2026 at 02:54 UTC / 10:54 HKT**, after the owner confirmed that the official hackathon period had started. See [build provenance](docs/BUILD_PROVENANCE.md) for the preparation/build separation.

## What LivingThread does

Someone confirms a new demo venue in Slack. A Google Doc says “the third floor,” and an independently written Gmail draft tells the customer to “head to the third floor.” LivingThread is designed to recognize that these statements refer to the same event, surface the inconsistency beside the work, and propose precise corrections with source evidence.

The user starts a work session and works normally. There is no required “Track” or “Add to thread” step. The agent associates observed information automatically and distinguishes confirmed changes from tentative proposals, historical arrangements, different audiences, and unrelated events.

The implementation provides an in-page review panel for evidence, exact before/after edits, clarification, dismissal, and operation results. Model output only proposes actions. The user must approve specific actions before the service dispatches a Gmail/Docs edit or a Slack message. Gmail sending is not supported.

## Run the prototype

For a first hands-on rehearsal, follow the [operator guide](docs/OPERATOR_GUIDE.md), use its separate rehearsal/recording/retake text packs, and read the [two-minute script](docs/DEMO_SCRIPT.md). The guide explains which pages to open, how observation starts, what each review step should show, and how to repeat a take without confusing old context with a new event.

Requirements: **Node.js 22 or newer**, a Chromium desktop browser, an Azure deployment supporting the Responses API and structured output, and signed-in Google accounts for the pages you want to use. Edge is the first live validation target; Chrome compatibility is not yet verified. No npm packages or extension build step are required.

1. From the repository root, copy [.env.example](.env.example) to `.env` **only if you do not already have a configured `.env`**. Fill in the Azure key, endpoint, and deployment. Process environment variables override values in `.env`.
2. Start the local service:

   ```sh
   node server/main.mjs
   ```

3. Check [the local health endpoint](http://127.0.0.1:4317/health). It should report `status: "ready"`. `modelConfigured` only confirms that a key is present; it is not an API connectivity test.
4. Open your browser's extension manager, enable **Developer mode**, choose **Load unpacked**, and select this repository's `extension` directory. For Edge, the extension manager is `edge://extensions/`; for Chrome, it is `chrome://extensions/`.
5. Open LivingThread from the browser toolbar and choose **Connect local service**, then **Start work session**. The popup must report **Connected · work session active**. Loading the extension alone does not start observation.
6. Refresh already-open Gmail and Google Docs tabs after loading or reloading the extension. Use a dedicated demo browser profile and short synthetic documents/drafts while live validation continues.
7. Open **Connection & editor diagnostics** in the popup to inspect collected sources, coverage, and Slack state. **Pause work session** stops new observation and checks; keep the service running while using the prototype.

Keep port `4317` for this prototype: the extension and manifest currently target that port. The local service binds to `127.0.0.1`, and one extension identity is paired to the local runtime. Keep `.runtime/pairing.json` private. Do not remove the operation journal to troubleshoot pairing, because it protects against repeating uncertain actions.

### Model configuration

The initial deployment is **gpt-5.6-sol** with `low` reasoning effort. Configure a deployment name actually available in your Azure resource:

```dotenv
AZURE_OPENAI_API_KEY=your-azure-api-key
AZURE_OPENAI_BASE_URL=https://YOUR-RESOURCE.openai.azure.com/openai/v1
LIVINGTHREAD_MODEL=gpt-5.6-sol
LIVINGTHREAD_REASONING=low
```

The service also recognizes the owner's existing `AZURE_OPENAI_MODEL_J_DEPLOYMENT` setting when `LIVINGTHREAD_MODEL` is absent. One deployment is used for the different analysis steps; no model router is required. The key stays in the service configuration and is not embedded in the extension.

### Slack configuration

Follow [Slack setup](docs/SLACK_SETUP.md) for the importable app manifest, exact permissions, and installation steps. Supply `SLACK_BOT_TOKEN`, `SLACK_APP_TOKEN`, and a comma-separated `SLACK_CHANNEL_IDS` allowlist in `.env`. Restart the service after configuration changes.

The public-channel setup uses bot `channels:history` and `chat:write`, an app-level `connections:write` token, and `message.channels` events. Add the app to each allowed channel through **Agents & apps → Add Agent or App**. Slack is reported as **unconfigured** when credentials or channel IDs are missing. No public callback server or tunnel is required. Installation, a real Socket Mode connection, receipt of the two approved synthetic fixture messages, and one reviewed bot reply are verified. The reply asked about an unconfirmed time proposal; the next check retained the existing arrangement and proposed no duplicate question. See [live acceptance](docs/LIVE_ACCEPTANCE.md) for the state-notification issue found during this check.

## Architecture and access boundaries

| Component | Implemented approach | Current boundary |
| --- | --- | --- |
| Browser extension | Manifest V3 content adapters, work-session popup, Shadow DOM review UI | Same installed browser profile; no mobile or cross-profile observation |
| Local service | Native Node HTTP service, paired extension access, session state, bounded Azure analysis | Must be running locally; no hosted service |
| Gmail | Observe the subject/body of open composers; recheck identity and exact text before a local edit | Reviewed edit, save indication, and reload persistence verified for the fixture; no inbox crawl, closed-draft monitoring, attachments, or email sending |
| Google Docs | Authenticated plain-text export in the extension worker, bound to the actual sending Doc; native find/replace editor integration with a Docs-restricted debugger bridge | Fixture read, reviewed save, and reload persistence verified; multi-tab coverage and broader editor reliability remain unverified; observations are partial |
| Slack | Socket Mode events, recent allowed-channel history, edited/deleted messages, reviewed posts | At most 15 initial messages per channel; older thread replies and file contents are not backfilled |
| Operation journal | Serialized, checksum-protected atomic persistence of operation status | Interrupted queued/running operations recover as uncertain and are never replayed automatically |

The current Docs implementation uses the signed-in browser and does not require Google Cloud/OAuth setup. The live fixture passed authenticated reading, the exact reviewed edit, saved-result verification, and a fresh read after reload. This is one acceptance case rather than proof of general editor reliability. Successful exports are cached for 30 seconds while idle, with relevant saved-change/explicit refreshes and a 60-second backoff after a 429 response. These limits reduce repeated requests and do not imply continuous document freshness.

The extension requests `debugger` permission for the experimental Docs editor bridge. The bridge restricts target pages and supported commands and detaches after each command. The browser may display its debugger permission/attachment notice; this is not hidden from the user.

## Privacy, scope, and failure behavior

- Starting a session enables observation of matching open Google Docs pages and Gmail composers in the installed profile, plus the configured Slack channels. **The first version does not yet provide per-account or per-document exclusion controls.** Keep unrelated sensitive pages outside the demo profile/session.
- Observed text, source titles/URLs, limited application context, and user clarifications are sent to the configured Azure model. This is not an entirely offline product. Requests specify `store: false`; that flag does not replace the Azure resource's own data-handling settings.
- Observations and findings live in service memory. `.runtime/` contains private pairing information, operation metadata/status, and local connection diagnostics. The extension stores its local pairing token in browser storage. `.env` and `.runtime/` are ignored by Git.
- Pausing does not erase already observed information or undo an operation that has already started. Closing a page or losing Slack connectivity makes its cached evidence non-live. A later snapshot cannot establish changes in content the adapter did not observe.
- Every proposed edit requires a unique exact target and version checks. The service records attempts before dispatch. A timeout or unverifiable result is **uncertain**, not success; inspect the actual target before taking further action. The journal is kept across restarts to prevent blind retries.
- Read-only model analysis retries a timeout or transport failure at most once after two seconds. Pausing cancels the active analysis and pending retry. Validation/refusal/HTTP failures are not retried automatically. A model-check failure remains separate from an already verified editor save.
- The model's analysis is bounded to 40 sources, 50,000 characters per source, and 160,000 characters total. Exceeding a bound reports an error rather than silently claiming all content was checked. Long-running sessions and broad workspaces are not yet supported.

## Verification

Run the local automated suite and syntax/manifest checks from the repository root:

```sh
node --test tests/*.test.mjs
node scripts/check.mjs
```

The latest full suite passed **104/104 automated tests** across semantic validation, state/action preconditions, Gmail helper behavior, Slack transport, operation persistence, extension boundaries, Docs read policy, and local HTTP behavior. This includes stale-history recovery, an unresponsive state recipient, old snapshot ordering, and exact remote-action receipt delivery. Earlier full/focused checkpoint counts overlap and are not additive. Synthetic tests are separate from the real saved-write and reload checks recorded in [live acceptance](docs/LIVE_ACCEPTANCE.md).

To run the current synthetic cases against the real configured Azure deployment:

```sh
node scripts/evaluate.mjs
```

This uses your Azure budget and writes a report to [SEMANTIC_EVALUATION.json](docs/SEMANTIC_EVALUATION.json). The initial September 12 run passed five cases: confirmed venue change, pre-existing conflict, legitimate time differences, tentative proposal, and unrelated events. Live checks exposed false positives from compatible differences in specificity and explicitly superseded Slack history. General prompt corrections were checked with seven follow-up calls, including compatible baselines, confirmed changes, and resolved changes with history. All passed: **twelve real Azure evaluation calls across seven unique cases**. This count excludes normal live analysis calls and does not measure general reliability or complete observation-to-notice delay.

Actual personal-account Docs/Gmail observations, Slack event receipt, automatic association, the native Gmail notice, two approved saved edits, persistence after reloading both apps, and final resolution have passed for the dedicated fixture. The original time, presenter, and remaining text were preserved. After a service restart and fresh observation of all four sources, the live resolved-state analysis completed in 2,495 ms with no findings; that is model-check time, not complete workflow latency. Review-result continuity is verified in the actual UI; Gmail receipt recovery after a full page reload remains unsupported. A separate pending-time scenario passed a reviewed Slack bot reply and a subsequent check that retained the existing time without proposing a duplicate question. An unresponsive Docs state recipient temporarily delayed the originating Gmail receipt; refreshing that page released the wait and displayed the successful result without resending. v0.1.5 makes state notifications nonblocking and acknowledges them explicitly. A transient model timeout was shown separately from successful saved edits. The development assistant created the two original Slack fixtures as the user and clicked the product's reviewed controls under authorization. LivingThread itself observed, executed, and verified the product actions.

## Project documents

- [LivingThread concept and current direction](docs/LIVINGTHREAD_CONCEPT.md)
- [MVP proposal, open decisions, and acceptance scenarios](docs/MVP_PROPOSAL.md)
- [Pre-event readiness and verified local environment](docs/PRE_EVENT_READINESS.md)
- [Azure checks and initial model selection](docs/MODEL_READINESS.md)
- [Browser and account checks](docs/BROWSER_READINESS.md)
- [English demo cases and expected behavior](docs/DEMO_CASES.md)
- [Current module interfaces](docs/IMPLEMENTATION_CONTRACT.md)
- [Slack installation and scope](docs/SLACK_SETUP.md)
- [Owner setup steps: accounts and personal authorization](docs/OWNER_SETUP_STEPS.md)
- [Preparation and build provenance](docs/BUILD_PROVENANCE.md)
- [Project instructions](AGENTS.md)
- [Event brief and submission checklist](docs/EVENT_BRIEF.md)
- [Initial product directions](docs/PRODUCT_DIRECTIONS.md)
- [Second ideation pass: distinct interaction mechanisms](docs/IDEATION_02.md)
- [Third ideation pass: recurring problems and existing alternatives](docs/IDEATION_03.md)

Communication with the project owner is in Chinese. Project materials and the product itself are in English.

## Sources and timing

- [Hackathon handbook](https://hong-kong.aitinkerers.org/hackathons/h_5fqVrXbED6w/handbook)
- [Hong Kong chapter event listing](https://hong-kong.aitinkerers.org/)

The public chapter listing shows September 12, 2026, 10:00-17:00 HKT. The authenticated portal and handbook were read on September 11: the submission deadline is September 12 at 17:00 HKT, and the schedule labels 11:15-15:30 as Build. The complete eligibility window is not explicitly defined there. Aim to have a demonstrable build by 15:00 and submission materials ready by 15:30; these are planning targets, not additional event rules. See the event brief for the differing published local presentation times.
