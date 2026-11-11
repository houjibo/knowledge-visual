## 1. Accessible navigation and regression coverage

- [x] 1.1 Add a browser test for initial tab semantics, keyboard focus, selection/panel synchronization, arrow wrapping, Home/End, pointer activation, keyboard activation and 320px layout; confirm it exposes the current skipped-tab defect.
- [x] 1.2 Implement native tab buttons, tablist/tab/tabpanel relationships, roving tabindex, visible focus and synchronous selected/visible state updates; verify the focused page regression passes.

## 2. Evidence and release

- [x] 2.1 Register the new browser test and add its page scope to interaction evidence; verify the generated coverage index marks the page as partially tested.
- [ ] 2.2 Run the page regression, full repository checks and strict OpenSpec validation; inspect local and published behavior, update the gap record, commit and push, then confirm CI and the deployed revision.
