## Context

Motivation and observable behavior are in [proposal.md](proposal.md) and [spec.md](specs/high-ai-system-dialogue-lab/spec.md). Existing high-school information-system and AI pages use independent, fixed local models; shared progress is maintained through `SubjectProgress`, and public topic metadata is generated from the page inventory.

HS25 2.6 is a new mandatory requirement in the reviewed 2025 standard copy (印刷页 15). The selected People’s Education Press / China Map Publishing Group mandatory Book 2 directory provides information-system context, but its published contents do not identify a generative-AI section; the old textbook directory is an example locator, not proof that the 2025 requirement is covered. See the [publisher directory](https://www.ditu.cn/dtkczy/dtsxxkj/202303/20/1562676311596883737.html), the [HS25 source audit](../../../../docs/assessments/high-information-technology-hs25-2026-11-15.md), and the [official Ministry lesson catalogue](https://www.moe.gov.cn/jyb_xxgk/s5743/s5744/202404/W020240402490580211463.pdf) for the adjacent, optional 人教中图版 AI textbook example.

## Goals / Non-Goals

**Goals:**

- Keep one small information-system task and one shared data fixture behind both interaction views, so the comparison isolates the interaction path.
- Make the system-of-record evidence inspectable before the learner decides whether the generated-style answer is safe to act on.
- Keep the simulation deterministic and usable as a file-opened page without services or build-time dependencies.

**Non-Goals:**

- Reproduce a language model, call a real model, accept arbitrary prompts, or benchmark response quality.
- Submit, reserve, borrow, renew, or mutate any real information-system record.
- Claim full coverage of HS25 2.6, the full PEP textbook, or any live classroom outcome.

## Decisions

1. **One fixed library consultation, two views.** Use a synthetic loan record with a remaining renewal credit and one queued reservation, plus the explicit rule that an active reservation blocks renewal. The form view exposes the fields a learner must inspect; the conversational view presents a scripted summary that incorrectly says renewal is allowed. Both views read the same model fixture. A library scenario fits the existing information-system workbench and keeps the source of truth concrete. A general chatbot demo was rejected because it would not show how AI output interacts with underlying system rules.
2. **Scripted output instead of a real AI service.** Use a clearly labeled local response template and a seeded conflict. This provides predictable questioning and a testable verification task while honoring the project's local-data/no-external-AI constraint. Arbitrary prompt input and network-backed model calls were rejected for this increment; therefore the crosswalk can move only to `partial`.
3. **Evidence gate before completion.** Initially show the conversational claim with the prediction controls, then reveal the underlying record and policy when the learner opens the evidence. The correct choice must explicitly reject immediate renewal. A second status statement shows that no transaction occurred. This distinguishes generated language, retrieved system facts, and a committed business action.
4. **Keep navigation in high-school computing.** The new page maps once to the high-school information-technology requirement in `computer/high/`; it may discuss AI but must not create a second official requirement or inflate the AI subject denominator. Register the card, page inventory, search catalog, and release verifier from the repository's existing generators/checks.
5. **Reuse the local progress contract.** Store completion under the computer/high subject-progress namespace only after correct source verification. Read/write failures must not block retry or reveal content; avoid putting prompt or record data in storage.

## Risks / Trade-offs

- [A fixed script can be mistaken for live model behavior] → Label it as a scripted learning demonstration beside the answer and in the model boundary; use no “AI-generated” provenance claim.
- [The incorrect answer can teach an overgeneralized failure story] → Present it as one deliberately seeded counterexample, show the exact conflicting source and policy, and state that real models/systems vary.
- [One-step conversational UI can imply universal efficiency] → Count visible steps only for this scenario and explicitly prohibit general speed/performance conclusions.
- [A local demo may not satisfy full experiential wording] → Update HS25 2.6 only from `missing` to `partial`; list live model/system experience and learner-designed application as remaining work.

## Migration Plan

No existing URL or progress schema is removed. Add the page and model, register it through current inventory/catalog generation, update the single HS25 crosswalk entry and evidence record, run unit/browser/static checks, push the feature commit, verify Pages and public resources, then archive this change. Rollback consists of reverting the feature commit; no external state or user data is migrated.
