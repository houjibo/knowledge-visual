## 1. Baseline and contract

- [x] 1.1 Add desktop and narrow-viewport regression cases for hidden canvas sizing, resize redraw, and state retention across all four topics.
- [x] 1.2 Add controlled-frame tests for magnet/AC pause and immediate resume; assert one pending frame at most.
- [x] 1.3 Add tests for all four Lenz pole/action directions, readable feedback, relative-value labels, and linear turn scaling.
- [x] 1.4 Add tests proving first-answer lockout and three distinct first-try correct answers for completion.
- [x] 1.5 Write the OpenSpec capability requirements and confirm the baseline tests expose the defects (desktop baseline 7/7 failed on missing tabs, zero-width canvas, uncancelled frames, absent Lenz feedback, unsupported unit labels, and enabled quiz options).

## 2. Interaction and visualization

- [x] 2.1 Implement semantic keyboard-operable tabs and accessible labels for all range controls.
- [x] 2.2 Resize/redraw the active canvas on tab entry and viewport change while preserving model state.
- [x] 2.3 Add a keyboard-accessible magnet-position control and require pointer-down to drag.
- [x] 2.4 Correct Lenz pole orientation/current direction and provide live text feedback from the stated viewing side.
- [x] 2.5 Correct relative flux/emf relationships and remove unsupported physical-unit labels.
- [x] 2.6 Store, cancel, and guard magnet/AC animation frame IDs so pause/resume cannot create duplicate loops.
- [x] 2.7 Lock a quiz after one answer and count distinct first-try correct questions only.

## 3. Evidence and release

- [x] 3.1 Run focused desktop/mobile tests and record evidence in `docs/assessments/interaction-evidence.json` (16/16 passed).
- [x] 3.2 Regenerate page inventory, interaction coverage, and interaction risks; update `docs/gaps.md` with verified results and limits.
- [x] 3.3 Run static checks, full browser regression, all-page smoke, and `openspec validate --all --strict`.
- [x] 3.4 Commit and push the feature, confirm GitHub Actions and public release manifest, then archive the OpenSpec change.
