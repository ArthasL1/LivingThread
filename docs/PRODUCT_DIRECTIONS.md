# Initial Product Directions

> **Historical planning/preparation record.** This file preserves its original checkpoint; pending or proposed items are not a statement of current functionality. For the implemented v0.1.5 prototype, see the [project README](../README.md), [setup guide](SETUP.md), and [live acceptance](LIVE_ACCEPTANCE.md).

**Review status:** The owner found this first pass insufficiently concrete, creative, and differentiated from general-purpose agents. Its provisional recommendation is withdrawn. Retain these ideas as history, not as the current shortlist. See [the second ideation pass](IDEATION_02.md).

These are original brainstorming proposals. None has been selected, implemented, or validated with users. Feasibility assessments are provisional and depend on team skills, integration access, and the event build window.

## Selection principle

Start with an existing activity and its friction. Identify what the agent can observe and change at that exact point of work. Aim for one complete interaction:

**Context -> decision -> action -> verification -> visible result.**

For each proposal, ask what would be lost if the user had to copy the same material into a separate chat window. Strong answers include live state, identity, a shared conversation, physical context, and the ability to act directly where the result belongs.

## Candidates

| Working name | Intended user and environment | Smallest useful workflow | Main uncertainty |
| --- | --- | --- | --- |
| ThreadToDone | A small team coordinating work in a Slack thread. | Read a decision and its linked issue, propose a supported change, apply it after review, and return a verified receipt to the thread. Handle a later correction without creating a duplicate issue. | Access to a test workspace and issue tracker; differentiation from familiar task bots. |
| FormBridge | An operations worker transferring information between a source page and a web form. | Read a user-selected source and the current form, map supported fields with evidence, surface missing information, fill reviewed values, and inspect validation feedback. | Reliable access to the chosen pages and form structure. Scope must be limited to a supported workflow. |
| BenchMate | Someone assembling a simple kit at a workbench with a phone camera and voice. | Observe the current assembly step, resolve a parts question against a guide, ask for a clearer view when uncertain, and update the step checklist after visual confirmation. | Available hardware, visual ambiguity, response latency, and a reproducible physical demo. |

## First-pass recommendation (withdrawn)

ThreadToDone offers a clear path to a compact demonstration if a Slack test workspace and issue-tracker access are already available. Its value should center on maintaining a decision through corrections and verifying the resulting action. A basic summary-to-task bot would have a weaker innovation story.

If workspace access is difficult and the team is comfortable with browser extensions, evaluate FormBridge next. Limit it to one source format and one target form; avoid promising general browser automation.

BenchMate may produce a more distinctive physical interaction, but select it only if the team already has suitable equipment and experience with the relevant interfaces.

## Suggested MVP boundary

- One primary persona and one recurring problem.
- One primary environment and at most one downstream service.
- One real action with an independently inspected result.
- One useful correction or failure-recovery path.
- A clear display of proposed, completed, and failed actions.

Additional channels, billing, team administration, and broad agent frameworks can wait until the core demonstration works.

## Decision record

- Product direction: open.
- Final product name: open; the names above are working labels.
- Team composition and skills: unknown.
- Integration access: unverified.
- Technical stack: open.
- Core implementation: not started.
