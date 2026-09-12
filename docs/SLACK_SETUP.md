# Slack setup

LivingThread uses its own Slack app, bot token, and Socket Mode connection. It does not use the development assistant's Slack connection. App installation and real-workspace checks are still required; the module's automated tests use synthetic data only.

## Create and install the app

1. Open [Slack app management](https://api.slack.com/apps), choose **Create New App → From a manifest**, and select the intended demo workspace.
2. Use the manifest below. It supports public channels; private-channel access is an explicit optional addition.
3. Install the app to that workspace and copy the **Bot User OAuth Token** (`xoxb-…`) from **OAuth & Permissions** into the local, ignored `.env` as `SLACK_BOT_TOKEN`.
4. Under **Basic Information → App-Level Tokens**, generate a token with the [`connections:write` scope](https://docs.slack.dev/reference/scopes/connections.write/). Save the resulting `xapp-…` value as `SLACK_APP_TOKEN`.
5. Confirm **Socket Mode** and the `message.channels` bot event are enabled. No public callback URL or tunnel is required. See Slack's [Socket Mode setup](https://docs.slack.dev/apis/events-api/using-socket-mode/) and [connection method](https://docs.slack.dev/reference/methods/apps.connections.open/).
6. Add the LivingThread app to the intended channel through the channel's **Integrations → Add apps** UI. If workspace administration restricts apps, its owner must approve installation. Merely installing an app does not grant membership in every channel.
7. Copy the channel ID from the channel details or its browser URL. Put only intended channel IDs in `SLACK_CHANNEL_IDS`, separated by commas.
8. Restart the local LivingThread service, then enable the work session. Confirm the Slack status reports connected and history retrieval succeeded for the intended channel. The app posts as **LivingThread**, not as the account owner.

```json
{
  "display_information": {
    "name": "LivingThread",
    "description": "Connect related information across your authorized work session.",
    "background_color": "#183C35"
  },
  "features": {
    "bot_user": {
      "display_name": "LivingThread",
      "always_online": false
    }
  },
  "oauth_config": {
    "scopes": {
      "bot": ["channels:history", "chat:write"]
    }
  },
  "settings": {
    "event_subscriptions": {
      "bot_events": ["message.channels"]
    },
    "socket_mode_enabled": true,
    "org_deploy_enabled": false,
    "token_rotation_enabled": false
  }
}
```

Use placeholders only in shared examples:

```dotenv
SLACK_BOT_TOKEN=xoxb-your-installed-app-bot-token
SLACK_APP_TOKEN=xapp-your-connections-write-token
SLACK_CHANNEL_IDS=C0123456789
```

`SLACK_CHANNEL_IDS` is an application-level observation **and destination** allowlist. Supplying IDs does not grant Slack permissions. The service must pass this list to the adapter only for an enabled, authorized session. Do not put tokens in extension code, screenshots, Git, or submission materials.

## Exact permissions

| Permission or event | Purpose |
| --- | --- |
| Bot `channels:history` | Read public-channel messages where the bot is a member; enables the `message.channels` event |
| Bot `chat:write` | Post an exact, reviewed message as LivingThread |
| App-level `connections:write` | Open the Socket Mode WebSocket connection |
| Bot event `message.channels` | Receive public-channel messages, edits, deletions, and replies |

For **private channels**, additionally grant bot `groups:history`, subscribe to `message.groups`, reinstall the app to approve the added scope, and invite the bot to each intended private channel. The first version does not request direct-message, channel-listing, user-profile, file, impersonation, or all-public-channel posting permissions. Slack documents [history access by token and membership](https://docs.slack.dev/reference/methods/conversations.history/) and [posting permissions](https://docs.slack.dev/reference/methods/chat.postMessage/).

## What is actually observed

- On connection, the adapter reads at most **15 recent channel history messages per allowed channel**. It does not crawl the workspace or paginate through old history.
- Subsequent allowed-channel message events update stable per-message observations. Edits replace the current observation; deletions emit an empty-text tombstone with the same ID and `context.deleted=true`. The service must invalidate its prior evidence.
- Thread replies received while connected are included with their parent timestamp. Older thread replies are **not** backfilled by this implementation. A future bounded backfill can use [`conversations.replies`](https://docs.slack.dev/reference/methods/conversations.replies/), with token permissions and rate limits validated against the actual installation. The current implementation cannot claim complete historical threads.
- Message text is captured as supplied by Slack, including Slack's markup. Files, attachment contents, canvases, and external links are not read. Every observation reports `coverage: "partial"`.
- Socket refresh and failures trigger reconnection and another bounded history read. Events missed during downtime, especially old-thread edits/deletions, may remain unknown. `coverageGap` records interruption or ingestion gaps; the service must mark cached Slack evidence non-live whenever `connected` becomes false.
- Slack observation stops with the work session/service. Cached text is not proof of current Slack state. A reconnect does not establish full historical coverage.

## Reviewed posting and failure handling

The adapter never sends a message in response to an observation. The service may call `postMessage` only after the user approves the exact text, channel, and optional parent thread. The message does not broadcast a thread reply or unfurl links. Slack supplies the posted channel, timestamp, and returned message used for confirmation; the result includes `actualText` if Slack normalizes the submitted text.

Each operation needs a stable `clientMsgId`. In-process duplicate calls reuse its stored result and reject changed content or destinations. Timeouts, transport errors, HTTP 5xx, and ambiguous Slack server errors return `status: "uncertain"`; they are never retried automatically. Inspect the destination before deciding what to do next. Known API rejections are reported as failures, including rate limits and their `Retry-After` when present.

The adapter ledger is in memory. The main service must persist operation outcomes and preserve uncertain states across process restarts; recreating an adapter must not cause approved sends to be replayed. Source-event deduplication is also bounded and is not a durable event log.

## Verification without sending

Run `node --test tests/slack.test.mjs`. Tests inject a fake fetch implementation and WebSocket, and never contact Slack.

After real installation, the owner can post and edit a short synthetic message in the allowed demo channel. Check that LivingThread receives its text and then its changed text under the same source identity. Delete the synthetic message and verify the old evidence disappears. Real reviewed posting should be tested separately only after approval of a specific message and destination.

| Status | Next check |
| --- | --- |
| `unconfigured` | Bot/app tokens and at least one valid channel ID must be supplied locally |
| Identity error | Use an installed bot token from the intended workspace |
| Socket `missing_scope` | The app-level token needs `connections:write` |
| History `not_in_channel` / `channel_not_found` | Check channel ID, app membership, and public/private scopes |
| Connected but no message events | Check bot event subscriptions, reinstall after scope changes, and channel allowlist |
| `reconnecting` | Network or Slack refresh; cached evidence is not live |
| Post `uncertain` | Inspect Slack; do not blindly retry or replace the operation ID |

Implementation was created during the official hackathon period. Official documentation above was checked on September 12, 2026. Real Slack installation, credentials, and end-to-end posting are not established by synthetic tests.
