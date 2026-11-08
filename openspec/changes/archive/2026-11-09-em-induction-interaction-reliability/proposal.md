## Why

The high-school electromagnetic-induction page has four canvas-based learning panels, but hidden canvases are sized while their panels have zero width and are not reliably resized when first shown. Pausing and immediately resuming the moving-magnet or AC model can leave more than one animation frame loop active. The quiz accepts repeated clicks on one correct answer as separate progress, and the Lenz-law animation does not visibly orient each named pole consistently with its stated action. These defects can make the display, explanation, and completion state disagree.

The flux and AC controls are qualitative levels, while their readings currently use physical-unit labels. The per-turn flux value also includes the coil-turn multiplier before Faraday's law multiplies by the number of turns again. Learners therefore cannot tell which values are normalized, and the displayed emf does not scale linearly with turns.

## What Changes

- Make the four learning topics an accessible tab set with keyboard navigation, clear panel relationships, and named range controls.
- Resize and redraw a canvas when its panel becomes visible and after viewport changes, preserving each model's state.
- Keep at most one scheduled animation frame per moving-magnet and AC model; pausing cancels its pending frame and resuming starts one loop.
- Make Lenz-law pole orientation and current direction agree for north/south insertion and withdrawal, and expose the result as readable text from the magnet side.
- Treat flux and AC readings as normalized teaching values, use per-turn flux in Faraday's law, and label units accordingly.
- Lock each quiz question after its first answer and count only distinct first-try correct answers toward completion.
- Add desktop and narrow-viewport browser regression coverage and refresh the interaction evidence indexes.

## Capabilities

### New Capabilities
- `em-induction-learning-reliability`: Accessible controls, canvas lifecycle, induction-model interpretation, animation lifecycle, and quiz completion.

### Modified Capabilities

## Impact

- Page: `physics/high/em-induction.html`
- Tests: `tests/browser/em-induction-learning-reliability.spec.js`, browser test registration in `package.json`
- Evidence: `docs/assessments/interaction-evidence.json` and generated interaction/page inventories
- Contract: `openspec/specs/em-induction-learning-reliability/spec.md`
