# Run LivingThread locally

This guide is for a fresh installation of v0.1.5. The published [1:57 demo](https://youtu.be/GGgn0UvC4n0) shows the expected interaction. The runtime uses its own application integrations; OpenAI Codex is not required to run it.

## Requirements

- Node.js 22 or newer and Git, or a downloaded copy of this repository.
- Desktop Microsoft Edge, the browser used for live acceptance. The extension targets Chromium Manifest V3; Chrome has not been independently validated.
- An Azure deployment supporting the Responses API, structured JSON output, and the configured reasoning effort. The live build used `gpt-5.6-sol` with `low` reasoning effort. Requests use your Azure budget.
- Signed-in Google Docs and Gmail, with permission to edit your test document and draft.
- For the three-app scenario: a Slack workspace where you can install an app, plus an allowed channel containing the app. Slack is optional for Docs/Gmail-only exploration, but required for the demo's Slack trigger.

Use one dedicated browser profile with short synthetic Docs and recipientless Gmail drafts. Start with one document tab, one composer, and one quiet Slack channel. You do not need a Google Cloud project, Google Docs API credentials, a public server, or a tunnel.

## 1. Configure the local service

Clone the repository and enter its root:

```sh
git clone https://github.com/ArthasL1/LivingThread.git
cd LivingThread
```

Copy `.env.example` to `.env` **only if no configured `.env` already exists**. For example, in PowerShell:

```powershell
if (-not (Test-Path -LiteralPath .env)) { Copy-Item -LiteralPath .env.example -Destination .env }
```

Fill in your actual Azure endpoint, key, and deployment:

```dotenv
AZURE_OPENAI_API_KEY=your-azure-api-key
AZURE_OPENAI_BASE_URL=https://YOUR-RESOURCE.openai.azure.com/openai/v1
LIVINGTHREAD_MODEL=your-responses-api-deployment
LIVINGTHREAD_REASONING=low
LIVINGTHREAD_PORT=4317
```

The deployment must exist in your Azure resource; a model name alone does not provision access. The service also recognizes `AZURE_OPENAI_MODEL_J_DEPLOYMENT` when `LIVINGTHREAD_MODEL` is absent. Process environment variables override `.env` values. One deployment performs the analysis; no model router is needed.

For Slack, follow [SLACK_SETUP.md](SLACK_SETUP.md) to create/install the app and configure `SLACK_BOT_TOKEN`, `SLACK_APP_TOKEN`, and `SLACK_CHANNEL_IDS`. The bot needs channel membership in addition to installation. Logging into Slack in a browser does not configure the service's API connection.

Keep credentials in the ignored `.env`, never in extension source. No npm packages are required. Start the service from the repository root:

```sh
node server/main.mjs
```

On Windows, `Start-LivingThread.ps1` is an alternative launcher. Keep one service instance running. The [health endpoint](http://127.0.0.1:4317/health) should report `status: "ready"`, version `0.1.5`, and `modelConfigured: true`. `modelConfigured` checks that a key is present; it does not test model connectivity. Keep port 4317: the extension and manifest target it.

## 2. Load and connect the extension

1. In the intended Edge profile, open `edge://extensions/`.
2. Enable **Developer mode**, click **Load unpacked**, and select this repository's `extension` folder.
3. Review the requested browser permissions. The `debugger` permission supports the experimental Google Docs editor bridge; the bridge restricts target pages and commands and detaches after each command. The browser may display a debugging banner.
4. Refresh already-open Google Docs and Gmail pages so they receive the content scripts.
5. Open LivingThread from the toolbar and click **Connect local service**. Expect **Connected · work session paused**.
6. Prepare your synthetic content, then click **Start work session**. Expect **Connected · work session active**.
7. Open **Connection & editor diagnostics** to inspect observed sources, coverage, and Slack state.

Docs and Gmail must be open in the installed browser profile. A Slack browser tab is useful for posting the demo change, but Socket Mode delivery does not require keeping that tab open. Loading the extension or starting the service alone does not enable a work session.

After updating extension files, reload the extension in its manager and refresh the supported pages. A backend-only restart does not require an extension reload. Restart the service after changing its environment configuration.

## 3. Reproduce the demo

Use the [Harbor text pack](demo/take-01-rehearsal.md) and [operator guide](OPERATOR_GUIDE.md):

1. Establish the Slack baseline, Doc, and Gmail draft with matching event details.
2. Start the session and wait for a completed baseline check with no finding for that event.
3. Post the pack's confirmed Slack venue change once, then return to the unchanged Doc or draft.
4. Open LivingThread's notice, inspect source quotes and exact changes, and approve the two intended edits.
5. Keep the editors open while actions run. Inspect both saved results and the applications' updated wording.

For the intentional-difference continuation, change the Gmail arrival wording to 14:00 while the official event remains 15:00–15:30. If a finding appears, choose **This difference is intentional**, explain that Morgan should arrive one hour early, and choose **Reconsider with this context**. Review the new wording and approve only if it correctly preserves both times. Model-generated wording and latency can vary; this is a scenario to verify, not a prerecorded runtime response.

Use the guide's fresh event names for repeated takes. Pausing does not clear context. Do not delete the operation journal to reset a demo or pairing problem.

## Scope and troubleshooting

An enabled session observes matching open Docs pages and Gmail composers across the installed profile, plus allowed Slack channels. Per-account/document exclusions are not implemented. Observed text, titles/URLs, application context, and clarifications are sent to Azure. Each edit or message still requires separate approval. [Data handling and failure behavior](ARCHITECTURE.md#data-and-action-boundaries).

| Symptom | Check |
| --- | --- |
| Local service cannot connect | Confirm the service is running on `127.0.0.1:4317`; check `/health`, then retry the popup connection. |
| Port already in use | Use the existing intended service or stop your own old instance; do not start a second copy. |
| Connected but no sources | Start the work session, refresh supported pages, and keep a Doc editor and Gmail composer open. Home pages and closed drafts are not observed. |
| Slack is `unconfigured` | Supply both tokens and valid allowed channel IDs, add the bot to the channel, and restart the service. |
| Slack connection succeeds but baseline is missing | Check recent-history diagnostics, channel membership, and event subscriptions. Initial history is limited to 15 messages per channel. |
| Docs reads are delayed | Check signed-in access and saved state. Idle reads use a 30-second cache and a 60-second backoff after export rate limiting. |
| Model check fails | Check endpoint, deployment support, key, network, and the displayed error. A verified editor save remains separate from a later analysis failure. |
| An action is `uncertain` | Inspect the real application before doing anything else. The service deliberately does not replay uncertain actions automatically. |

`.env`, `.runtime/`, and private recordings are ignored by Git. Preserve `.runtime/` across ordinary restarts: its pairing information and durable operation records are part of recovery.
