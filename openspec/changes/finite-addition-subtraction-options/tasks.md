## 1. Regression Baseline

- [x] 1.1 Add fixed-random browser coverage and confirm seed 0 prevents page load before the fix.
- [x] 1.2 Independently verify choice and estimation answers, option uniqueness, the exact-value distractor, and answer bounds.
- [x] 1.3 Verify correct-answer scoring, next-question generation, desktop/mobile views, and 320px option bounds.

## 2. Finite Option Generation

- [x] 2.1 Replace the choice-challenge retry loop with a finite offset pool.
- [x] 2.2 Replace the estimation retry loop while preserving the exact-value distractor rule.
- [x] 2.3 Confirm repeated random values cannot block startup or next-question generation.

## 3. Site Integration and Release

- [x] 3.1 Register the browser test and refresh interaction evidence, coverage, risk, and gap indexes.
- [x] 3.2 Run targeted desktop/mobile tests, static validation, and the full project check.
- [ ] 3.3 Commit, push, verify Actions and Pages, and inspect the local and public page.
