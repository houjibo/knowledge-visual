## Context

`switchTab()` currently changes CSS classes only. The flux canvas is visible at initial load, while the Lenz and AC canvases are measured with `offsetWidth === 0`; the window resize handler also measures all canvases, including hidden panels. Both the magnet and AC loops schedule another `requestAnimationFrame` without consistently cancelling a pending frame on pause. The quiz recreates enabled option buttons for every question and calls `bumpTotalCorrect()` for every correct click, so a learner can increment completion repeatedly on one question.

The Lenz canvas always draws N above S, even when a button says the S pole is approaching. Its current direction is encoded only as canvas text. The flux model labels normalized geometry as webers and multiplies flux by turns before multiplying its rate by turns in Faraday's law. The AC field and speed sliders are also levels, so the current volt labels imply units the model does not calculate.

OpenStax describes Faraday's law as `emf = -N ΔΦ/Δt` and states that an approaching north pole induces counterclockwise current while an approaching south pole induces clockwise current, viewed from the magnet side ([University Physics Volume 2, Lenz's Law](https://openstax.org/books/university-physics-volume-2/pages/13-2-lenzs-law)). This change uses that view consistently and calls illustrative readings relative values.

## Goals / Non-Goals

**Goals:**
- Keep the current single-page structure and visual language.
- Make topic, parameter, simulation, and quiz controls keyboard-operable and clearly named.
- Preserve animation/model state across topic switches while resizing visible canvases.
- Ensure one scheduled animation loop per running model and deterministic quiz progress.
- Make displayed induction directions and normalized relationships testable.

**Non-Goals:**
- Do not turn the canvas into a quantitative electromagnetic solver or claim real magnetic-field measurements.
- Do not replace the page architecture, add a framework, or redesign unrelated physics pages.
- Do not claim complete screen-reader or physical-device accessibility from browser automation alone.

## Decisions

1. **Use native buttons with the ARIA tabs pattern.** The tab list will have one selected tab and roving `tabindex`; Left/Right and Home/End move selection, and each tab names its panel. This keeps the existing button interaction while making relationships and keyboard behavior explicit.
2. **Resize only the active panel and redraw it on entry.** Keep the existing two-times backing resolution and fixed canvas heights to avoid a coordinate-system rewrite. On viewport resize, resize/redraw the active canvas; on tab entry, measure that panel and draw its retained state. Inactive canvas state is not reset.
3. **Give each loop one stored frame ID.** Scheduling is guarded by a single-frame helper. Pause clears the pending request before changing state; a resumed model schedules one callback. The tests replace RAF with a controlled queue to exercise immediate pause/resume deterministically.
4. **Show each Lenz case from the magnet side.** The named pole is drawn at the approaching/withdrawing end; the four cases use north-in counterclockwise, north-out clockwise, south-in clockwise, and south-out counterclockwise. A live text result repeats the pole, motion, and induced-current direction so the canvas is not the only source.
5. **Keep numeric displays explicitly qualitative.** The magnet model uses per-turn relative flux and applies the turn count once in `ε = -N dΦ/dt`. Flux, flux rate, and emf labels use relative units. AC field and speed inputs are described as levels and the emf/peak use relative-value labels; the standard formula remains as the conceptual relationship.
6. **Treat the first answer as final for a question.** Disable all four answer buttons after selection. Increase progress only for a first-try correct answer to a distinct question; preserve the existing three-correct completion threshold.
7. **Expose manual magnet positioning to keyboard users.** Add a named position range control and make pointer dragging start only on pointer-down. While the magnet animation runs, disable manual position changes; the other controls remain active and their current values are used by subsequent frames.

## Risks / Trade-offs

- Resizing a canvas clears its pixels. → Redraw the active model immediately after assigning dimensions and test representative canvas pixels after every tab entry and viewport resize.
- Lenz directions depend on the viewing side. → State “from the magnet side” in the panel and live feedback, and assert all four pole/action combinations.
- Calling readings relative may be less realistic than adding physical dimensions. → Keep the learning target on direction and proportional relationships; make the normalization explicit instead of implying measured units.
- A fixed two-times backing store is not optimized for every device pixel ratio. → Preserve the page's current coordinate scale in this scoped fix and leave DPR-specific refinement for a separate measured change.
- The page still contains multiple simplified electromagnetic models. → Record the normalized assumptions in the UI and leave broader model validation for a separately scoped review.

## Verification Plan

1. Add the focused test first and verify it reproduces zero-width hidden canvases, duplicated pending frames, incorrect pole presentation/direction, repeated quiz counting, and misleading unit labels.
2. Implement tabs/canvas, induction-model, animation, and quiz changes in small slices; run the focused test on desktop and mobile after each slice.
3. Run static checks, the full browser suite, all-page smoke tests, and strict OpenSpec validation; update test evidence and generated indexes.
4. Commit and push the completed feature; verify Actions, the public release manifest, and both local and public pages before archiving.
