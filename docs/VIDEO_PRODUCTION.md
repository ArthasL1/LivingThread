# LivingThread — Silent capture and post-production

The operator records the real workflow without speaking. The final submission is edited to **at most two minutes**, with English AI narration and English captions. Raw footage can be much longer. The screen sequence and narration in [DEMO_SCRIPT.md](DEMO_SCRIPT.md) are editing targets, not a stopwatch for the operator.

## Record a complete, readable take

1. Complete the [operator guide](OPERATOR_GUIDE.md) setup and baseline check before the main take. Rehearse with Harbor; use the fresh Cedar pack for recording. The existing reset procedure still applies between takes. Video editing does not reset the agent or application state.
2. Record the browser at 1920 × 1080 and 30 fps if available. Keep a consistent window size. Disable microphone recording; no live narration is needed. If these settings are unavailable, keep the native recording resolution and share the original file.
3. Keep Slack, the current Google Doc, and the recipientless Gmail composer visible as browser tabs. Keep text readable and the Gmail composer expanded. Start with the unchanged third-floor draft.
4. Show the matching Doc and Slack baseline, then send the take's confirmed venue-change message yourself. Return directly to Gmail and keep recording until the notice appears. Do not open a comparison chat or manually enroll sources to trigger it.
5. Hold the automatic notice for about three seconds before opening it. Show the supporting quotes and both edit previews; pause on each so the editor has usable frames. Click **Apply 2 changes** once when the previews are correct.
6. Record the full wait, both saved results, updated Gmail wording, updated Doc, and completed conflict recheck. Leave each important result visible for three to five seconds. Keep the email as a draft.
7. Stop only after the result is captured. Five to ten minutes of raw footage is fine; prioritize a complete successful run over a fast run. A failed attempt is useful diagnostic footage, but must not be presented as a successful workflow.

Record the main sequence continuously where possible. If the workflow fails or requires a reset, preserve that original file and start a clearly separate take. Avoid repeatedly posting the change message to hurry the agent.

## Deliver the source footage

Save the original MP4 or MKV in `artifacts/private/recordings/`, for example `cedar-take-01.mp4`, and provide its local path. Another local folder is also fine. These private recordings are excluded from Git. Do not upload source footage to the public repository.

Optional notes can identify the successful take or a moment worth keeping. Timestamps and a prepared edit list are not required. Do not re-encode the original into a smaller, blurry file first.

## Editing plan

- Review the footage and select actual baseline, trigger, notice, evidence, approval, and saved-result moments.
- Build a 110–118 second cut, leaving a small margin below the two-minute limit. Crop or zoom into the in-page notice, source quotes, previews, and saved wording while preserving enough of the application to show where the agent appears.
- Keep the **Slack change → return to Gmail → automatic notice** causal sequence clear. Label shortened waits, for example **Waiting accelerated**. Do not splice a notice or success receipt from another take into that sequence or present edited duration as measured latency.
- Adapt the English narration to the exact recorded event and observed results. Generate a neutral English AI voice, align it with the actions, and add readable captions. Avoid success narration until the footage actually verifies the result.
- End with **Different apps. One living thread.** Credit **LivingThread · Zeqi Li**. The main story is an agent appearing where work already happens, followed by human review and verified action.

## Outputs and verification

Deliver a 1080p H.264/AAC MP4, an English SRT file, and the final English narration text. Keep raw takes and editing notes locally. Check output duration, caption readability, audio alignment, and the continuity of the demonstrated action before publication. The operator reviews the finished video before any upload or submission.

The local FFmpeg editing pipeline has been tested. The entrant has supplied two real recordings, and a 1:55 first review copy now uses English male AI narration, matching the entrant's voice preference. This is a generated narrator, not a recording or clone of the entrant's voice. See [the demo edit record](VIDEO_EDIT.md) for the actual timeline and editing decisions. Publication remains pending.
