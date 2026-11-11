## Context

See [proposal.md](proposal.md) for the reproduced keyboard-access problem. The page already keeps all three section panels in the document and switches them synchronously, so selection has no loading delay.

## Goals / Non-Goals

**Goals:**
- Use a standard horizontal tab interaction with a single tab stop, announced selection state and explicit panel relationships.
- Keep existing click behavior and section content intact.

**Non-Goals:**
- Redesign the periodic table, element controls, trend visualization or quiz choices.
- Replace the page layout or add an accessibility library.

## Decisions

- Use native `button` elements with `role="tab"` inside a `role="tablist"`. Native buttons supply focus, Enter and Space behavior; a small key handler supplies Left/Right, Home and End movement.
- Use automatic activation because all panels are already present and `switchTab` changes them synchronously. This avoids a second focus/selection state and follows the WAI-ARIA APG recommendation for immediately available panels: https://www.w3.org/WAI/ARIA/apg/patterns/tabs/.
- Keep `switchTab` as the single state transition that synchronizes `.active`, `aria-selected`, `tabindex` and panel visibility. Each tab points to its panel with `aria-controls`; each panel points back with `aria-labelledby`.

## Risks / Trade-offs

- [Custom arrow-key handling may interfere with text entry] → Handle keys only when focus is on a top-level tab button; do not intercept Up/Down on the horizontal tab list.
- [Theme classes and ARIA state may drift] → Update both in the same `switchTab` call and assert them together in browser tests.
- [Wrapped tabs may make focus order unclear on narrow screens] → Keep DOM order aligned with visual order and verify all three tabs at 320 CSS pixels.

## Migration Plan

Change only the existing tab controls and synchronous switching function. No URL, stored data or release migration is required. Revert the page markup and function together if the new browser regression fails.
