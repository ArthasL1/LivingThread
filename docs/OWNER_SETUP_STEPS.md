# Owner Setup Steps

> **Historical planning/preparation record.** This file preserves its original checkpoint; pending or proposed items are not a statement of current functionality. For the implemented v0.1.5 prototype, see the [project README](../README.md), [setup guide](SETUP.md), and [live acceptance](LIVE_ACCEPTANCE.md).

Purpose: minimize the owner's work to account access, identity verification, and decisions about terms, permissions, or expenditure. Routine application configuration, implementation, and testing remain the assistant's responsibility.

## Current actions after the September 11 checks

The earlier speculative setup steps below are conditional reference material, not a new owner task list.

- Azure access is provided and verified. Initial model: gpt-5.6-sol. No provider signup or key delivery is requested. See [model readiness](MODEL_READINESS.md).
- The owner has switched Google use to a personal account. Earlier ordinary Gmail/Docs checks used the school account; the assistant will verify the active personal account before future tests. The existing Slack workspace is accessible. No additional account registration or owner-run technical test is requested. See [browser readiness](BROWSER_READINESS.md).
- Google connectivity was intermittent. Keep the intended demo browser/network available; later login or concrete authorization prompts will be presented when actually needed.
- The assistant prepared the [five English cases](DEMO_CASES.md).
- Recording/export is already tested according to the owner. No repeat test requested.
- Team selection is deferred to the venue at the owner's request.

## Current tool status

- GitHub connector profile access is verified for ArthasL1. This does not establish permission to create a particular repository or push to it. No new GitHub account or token is needed merely to continue preparation.
- Browser control has recovered for Edge (Profile 1). Opening a temporary public page, reading its contents, clicking a link, and reading the destination were verified. One earlier diagnostic page interaction failed; basic navigation was then verified on a simpler page. Chrome is installed but is not currently available through the control channel. Diagnostic tabs were closed and no account settings were changed.
- Chrome and the local development runtime were already checked. No additional runtime installation is requested from the owner.

## 1. Sign in to Google

Use an existing suitable Google account if available; a new account is not required by the product. A personal test account can avoid dependence on a school or employer administrator.

The current preparation browser is connected Edge Profile 1. The owner reports switching to the intended personal Google account. If login is needed later, use [Google Accounts](https://accounts.google.com/) and complete the required identity verification. Earlier checks and neutral test content belonged to the school account. The assistant will prepare new-account test content when needed; no owner-authored sample or migration of school material is requested.

Google Cloud setup is deferred while the Docs access route is being evaluated. The owner only needs working Gmail and Docs access at this stage. The assistant recommends validating browser-based Docs observation and reviewed editing during the official build period; that route would not require the Docs API or its Cloud/OAuth project.

The following Cloud notes apply only if the API adapter is selected. The assistant will prepare routine configuration; the owner participates in any necessary account verification or concrete consent decisions. Ordinary future product users would authorize the developer's application, not each create their own Cloud project.

For this integration, the Cloud project holds the application's API configuration, identity, and OAuth setup. The prototype can run locally; no cloud-hosting purchase or paid trial is part of the current preparation request.

Pricing checked September 11, 2026: Google states that standard Google Docs API use is available at no additional cost. Design the prototype to remain within the documented standard quotas. Google also announces future charges for above-standard usage later in 2026; do not describe the API as unconditionally free forever. See [Docs API limits and pricing](https://developers.google.com/workspace/docs/api/limits) and [planned usage tiers](https://developers.google.com/workspace/tools-safety). Model inference costs, if any, are a separate budget item. Do not treat a Cloud free-trial or billing-enrollment screen as a required step for this preparation; inspect the actual requirement before considering payment setup.

The assistant can now use the connected Edge browser to help prepare the Cloud project and API/OAuth settings when the relevant account is signed in and the task is authorized. The planned project display name is LivingThread. Project creation and API configuration are ordinary setup tasks, not intrinsically owner-only tasks. If the owner prefers to create the empty project manually, follow [Google's project creation steps](https://developers.google.com/workspace/guides/create-project) and report its Project ID.

Do not guess the OAuth client type, redirect URI, or data-access scopes. Those will be specified for the chosen adapter. Account authorization will be reviewed against the concrete configuration later. See [Google's OAuth setup guide](https://developers.google.com/workspace/guides/configure-oauth-consent).

## 2. Establish a Slack workspace the owner controls

An existing suitable workspace with app-installation rights can be reused. Otherwise, open [Create a Slack workspace](https://slack.com/get-started#/createnew), use the Google account's email or another email the owner controls, and complete the verification process and account terms decisions.

Use LivingThread Demo as the workspace name. If onboarding asks for an initial project or channel, use atlas-demo. Optional invitations can wait until the coordination demo needs a second participant.

Completion state: the workspace opens and the owner can provide its normal workspace URL. Keep app configuration, scopes, event subscriptions, and credentials for the assistant to specify. Workspace creation is normally automatable; now that Edge control is available, the owner can delegate routine setup and participate at the necessary identity and authorization steps. Slack documents that the workspace creator becomes its primary owner in its [workspace creation guide](https://slack.com/help/articles/206845317-Create-a-Slack-workspace).

## 3. Identify existing model API access

Completed: the owner supplied an ignored local `.env`, authorized Azure test requests, and reports sufficient budget. Sol, Terra, and Luna passed generic API checks. Sol is the initial selection. See [model readiness](MODEL_READINESS.md).

When the provider is selected, the owner completes any necessary identity checks and expenditure decisions. Credentials will be entered into an appropriate local configuration or supported secret-input mechanism, not posted in the conversation.

## 4. Later owner touchpoints

- Review requested Google data access and Slack installation permissions once the exact app configuration is prepared.
- Complete interactive authentication when required by the integration.
- Provide a test participant or second account only if needed for the selected coordination demonstration.
- Handle any necessary event-portal identity verification and final spending decisions.

These are not tasks to perform speculatively now. The assistant should prepare each concrete configuration or result before requesting the owner's participation.

## Minimal status reply

No status reply is required to repeat information already verified. If a later account check is blocked, report only the relevant ordinary status information:

- Google: Gmail and Docs open, or the point where access stops. Cloud console access is not currently requested.
- Slack: existing/new workspace URL, or the point where setup stops.
- Model API: provider name and availability, or no existing API access.

Passwords, verification codes, API keys, OAuth client secrets, and Slack tokens are not needed in the reply.
