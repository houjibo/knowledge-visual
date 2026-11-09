## 1. Regression Baseline

- [x] 1.1 Add fixed-random desktop and mobile browser coverage; confirm seed 0 fails to load before the fix.
- [x] 1.2 Verify all three rounding and all three application question types have four distinct options and one correct answer.
- [x] 1.3 Verify correct-answer feedback, score updates, next-question generation, and 320px exercise-option bounds.

## 2. Finite Option Generation

- [x] 2.1 Replace the three rounding-question retry loops with finite nearby candidates.
- [x] 2.2 Replace the three application-question retry loops with finite nearby candidates.
- [x] 2.3 Confirm boundary values and constant random values cannot prevent startup or next-question generation.

## 3. Site Integration and Release

- [x] 3.1 Register the browser test and refresh interaction evidence, coverage, risk, and gap indexes.
- [x] 3.2 Run targeted desktop/mobile tests, static validation, and the full project check.
- [ ] 3.3 Commit, push, verify Actions and Pages, and inspect the local and public page.
