# Ideation 02: Distinct Interaction Mechanisms

Status: Discussion proposals only. No product has been selected or implemented. These are design hypotheses, not claims of market originality or verified feasibility.

Owner review: The mechanisms demonstrated meaningful differentiation, but the scenarios felt too constructed or restrictive. The next pass must retain differentiation while grounding it in recurring user problems and accounting for setup effort. See [Ideation 03](IDEATION_03.md).

## Owner feedback

The initial ideas were not detailed, specific, creative, or visibly differentiated enough from general-purpose agents such as Codex. The owner also requested divergent thinking rather than narrowing the discussion to familiar platform categories.

## A stronger comparison

Compare against a capable general-purpose agent with common integrations, browser tools, memory, and automation. Browser form filling and interacting with application interfaces are established tool-enabled capabilities; see the [OpenAI computer-use guide](https://developers.openai.com/api/docs/guides/tools-computer-use), checked September 11, 2026.

The proposed advantage must be a specific product mechanism: collecting previously unavailable information, maintaining physical event history, handling independent participants' commitments, or coordinating an unfolding performance. Adding the missing mechanism to a general agent could reproduce the experience; that is a product engineering comparison, not an impossibility claim about model intelligence.

Do not select an idea merely because it uses cameras, multiple model calls, or an unusual device. It must solve a recognizable problem and have a visible result.

## Unsaid

Working pitch: "Catch the disagreement hidden inside everyone's yes."

During a small team's planning meeting, everyone agrees to "ship the beta on Friday." The product generates one concrete consequence question, such as whether an outside customer should be able to sign up that day. Participants answer privately on their phones. Different answers reveal different interpretations of the same agreement.

The agent identifies the exact unresolved decision, asks a targeted follow-up, drafts an explicit shared commitment, and collects confirmation before updating the team's decision record. It uses explicit answers; it does not infer beliefs or emotions from faces or voices.

The distinct mechanism is active acquisition of missing information through a discriminating scenario. A transcript alone does not contain the participants' unspoken interpretations. The demonstration should show unanimous assent, conflicting private answers, then an explicitly resolved decision.

MVP proposal: three participants, one short meeting segment, one decision, private response cards, and one shared decision record. A stronger test would have a participant introduce a fresh interpretation after the initial example.

Main objection: this can become an intrusive poll or ordinary meeting assistant. Its value depends on asking very few, well-chosen questions and revealing a disagreement that a transcript summary misses. Private answers still reach the service in this MVP; do not imply cryptographic privacy.

## Undo

Working pitch: "A rewind button for physical work."

A person disassembles a simple mechanical kit under a fixed camera, placing parts into labeled tray cells. The agent records confirmed changes and associates each part with its observed source and location. A second person later takes over without knowing the sequence. The agent uses the actual event history to guide reassembly, displays the relevant earlier frame, and checks each visible result.

The demonstration's decisive moment is selecting the wrong similar-looking part: the agent points back to evidence of where the correct part came from. Occluded or ambiguous transitions remain unresolved until the user confirms them. A spoken request to return to an earlier state produces a proposed sequence of feasible steps; it must not imply all physical actions are reversible.

The distinct mechanism is persistent memory tied to a particular physical object's history, available across people. A generic manual describes a standard procedure; this product must use what actually happened to this instance.

MVP proposal: one fixed camera, a small tray with labels, one safe mechanical toy or kit, four to six parts, and a short sequence. Camera, voice, image annotations, and a structured event log should be evaluated before adding any special hardware.

Main objection: a capable video assistant can explain assembly too. If a single current photo and a manual suffice for the demo, the proposal fails its differentiation test. Tracking subtle or occluded physical changes is the largest engineering uncertainty.

## Stagehand

Working pitch: "The show changes. The stage keeps up."

A small improvised performance uses a laptop microphone, speakers, and a projected backdrop. The agent follows the current scene and controls an approved set of audio and visual cues. When an actor paraphrases a line, skips a scene, or introduces a plausible change, it revises pending cues instead of blindly playing the original sequence.

Example: the scene expects a storm, but the actor says that the apparent thunder is a train approaching the station. The agent follows that interpretation, cancels the pending storm cue, changes the backdrop, and plays a train cue at the appropriate opening. If the transition is ambiguous, it holds the current scene and requests a discreet operator decision.

The distinct mechanism is semantic interpretation coupled to an ongoing performance and concrete output control. The demonstration must include an unannounced, bounded improvisation and show the cue sequence adapting while the scene continues.

MVP proposal: one short scene, two or three allowed branches, preloaded sound and visual assets, microphone input, and a visible stop/override control. No custom lighting hardware or live asset generation is required for the first version.

Main objection: a fixed set of keyword triggers could imitate a staged demo. Test paraphrases and a freshly chosen branch, and expose the agent's revised cue plan. Latency and unintended sound triggers are the largest risks.

## SwapCircle

Working pitch: "Find the swap that needs everyone to say yes."

Three event volunteers have different shifts and privately express conditional availability through messages. A owns 10:00-11:00 and wants 12:00-13:00; B owns 11:00-12:00 and wants 10:00-11:00; C owns 12:00-13:00 and wants 11:00-12:00. No pairwise swap satisfies the stated preferences, but a three-person exchange does.

The agent interprets each person's conditions, checks the proposed exchange with deterministic validation, presents each person's own before/after state, and waits for independent acceptance of the same proposal version. It updates the prototype's shared roster in one transaction only after all accept. Rejection or expiry leaves the roster unchanged; revised terms require fresh acceptance.

The distinct mechanism is a live, multi-party commitment protocol across private conversations. Finding a cycle alone is an ordinary computation a general agent can perform. Model count is not the innovation; correct information boundaries and coordinated execution are.

MVP proposal: three actual participant sessions, one prototype roster, one cyclic exchange, one rejection or expiry case. A single backend can coordinate the protocol. Atomicity applies to its own roster; do not claim a transaction across unrelated external calendar services.

Main objection: this may resemble conventional shift-management software. A convincing demo must show natural conditional negotiation and independent changing decisions, beyond a precomputed swap. Privacy means restricting what participants see, not hiding all inputs from the backend.

## Discussion priorities

Undo and Stagehand have the most immediately visible physical demonstrations among this pass's proposals. Unsaid explores a subtler interaction around information that is absent from the shared record. SwapCircle offers a concrete multi-party protocol, but needs especially careful differentiation from conventional scheduling software.

Before selecting any candidate, identify the hardest assumption and its shortest meaningful feasibility test. Keep a concept open only if its core value survives comparison with a well-equipped general-purpose agent and with a simple non-agent implementation.
