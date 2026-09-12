# Browser and Account Readiness

Checked September 11, 2026 through the existing Edge Profile 1 control connection. These are ordinary account/editor checks, not LivingThread extension tests. Browser control briefly failed to load its request-header policy and recovered on retry.

Account update: the owner subsequently switched Gmail and Docs from the school account used below to a personal account. The personal account is now the intended Google account for development and demonstration. This switch is owner-reported; the old editing results remain historical and do not establish access under the new account. Verify the active account before future writes. Do not assume browser account-slot numbers identify the intended person, or automatically migrate/share school-account artifacts.

| Surface | Observed result | Remaining limit |
| --- | --- | --- |
| Slack | Existing ArthasL1Slack workspace is signed in and accessible. A test channel and message editor are visible. No message was sent. | App installation rights, API scopes, subscriptions, and product integration remain unverified. |
| Gmail | Created an independent synthetic draft, entered subject/body, read the actual editor text, and selected Save & close. The Drafts count increased to one. Recipient left empty. | No email sent. Automatic extension observation, editing, and draft identification remain unimplemented. |
| Google Docs | Created a private document, renamed it, typed two neutral sentences, saw the text in a screenshot, and observed Saved to Drive. After refresh, the same text was visible. | Connection was intermittent: No connection / Trying to connect also appeared and editing was temporarily disabled. This does not establish continuous connectivity or extension text extraction. |

Both Google surfaces used the same already signed-in account; no new registration or credential entry was required. Do not publish unrelated inbox excerpts, document titles, account addresses, or authentication URLs in project artifacts.

## What the checks do and do not establish

They establish that ordinary editing was possible with the development assistant's existing browser-control tools and the then-active account. They do not establish that a new extension can retrieve complete document text, persist precise edits, monitor background resources, access a new account, or receive Slack events. Slack message sending and editing were not tested.

The product must implement its own supported access path and permissions. The Azure model can interpret supplied observations and propose actions; access and execution depend on the actual application adapters. See the [integration confidence and first validation gate](MVP_PROPOSAL.md#integration-confidence-and-first-validation-gate).

## Created preparation artifacts

Google Doc title: **LivingThread - Browser Access Check**

> Browser access check.
> This document contains synthetic preparation text only.

Gmail draft subject: **LivingThread - Browser Access Check**

> Browser access check. This is a synthetic preparation draft.

These are ordinary test content, separate from the event demo cases. Existing documents and message bodies were not edited. The assistant declined an unrelated Gmail activity-detection prompt; no additional browser permission was granted.

## Extension loading check

A September 11 attempt to inspect `edge://extensions/` was blocked by the development browser-control tool's URL security policy. The page was not inspected, developer mode was not changed, and no sample or product extension was loaded. This is a limitation of the assistant's control tool, not evidence that Edge or the user's profile prohibits unpacked extensions. No workaround was attempted.

Unpacked extension loading remains unverified. Check it when loading the first event-built extension. Do not treat a visible loading entry point, successful assistant browser control, or installation of an unrelated extension as proof that LivingThread's adapters work. If the local browser requires a user-operated settings control or folder picker, request that specific step at that time.

## Owner participation

The earlier broad request to configure browsers/accounts is superseded by these actual checks. The owner does not need to repeat them or install development tools. Keep the chosen browser profile available for development. If authentication expires, the owner completes that login; if the connection problem is visible during ordinary use, ensure the intended demo network can reliably reach Google services.

The assistant handles routine setup, example content, and later integration validation. Extension loading and application API authorization are distinct checks to perform against the actual configuration. Google Cloud remains deferred. A connected development browser does not establish product browser compatibility.
