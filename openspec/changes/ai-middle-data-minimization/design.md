## Context

See [proposal.md](proposal.md) for motivation and [specs](specs/) for the observable contract. The AI middle directory currently has three topics and uses `SubjectProgress` for locally stored completion. The homepage catalog is generated from tracked page titles and directory navigation. Static pages are served both from the repository root and the GitHub Pages subpath.

## Goals / Non-Goals

**Goals:**

- Make the link between a specific purpose and required inputs visible through one reproducible recommendation rule.
- Let learners compare a hypothetical form that collects seven fields with the same form after removing five unused identity fields.
- Keep the lesson local, keyboard usable, responsive, searchable, and covered by the published-site checks.

**Non-Goals:**

- Determine what information is legally required for any real service or make a compliance claim.
- Accept real names, birthdays, school names, addresses, phone numbers, or other free-form personal data.
- Call an AI model, send form values, or store field selections.

## Decisions

1. **Use a purpose-bound synthetic reading recommendation.** The rule reads only an age band and a topic interest to choose reading level and subject. Name, exact birthday, school, home address, and telephone are visible only as hypothetical field labels. This makes the output dependency inspectable. A general privacy checklist was considered, but it would not let learners observe whether removing a field changes a concrete result.
2. **Start with all five extra fields selected.** Checkboxes represent what a hypothetical form plans to collect, not actual data values. As each is removed, the page updates the count and reports whether the recommendation changed. A “privacy score” was rejected because it would imply a universal measurement across different purposes.
3. **Store only the ordinary completion flag.** Use the existing `SubjectProgress` API after all five unnecessary fields are removed. Do not persist selections or recommendation inputs; browser storage failure must not block the exercise.
4. **Keep sources in an explanatory note.** Link to Article 6 of the official PIPL text and UNICEF's child online privacy checklist. Paraphrase the purpose/minimum-scope idea, state that necessity depends on the specific task, and avoid presenting the page as legal advice.
5. **Reuse the static site pipeline.** Add one HTML page and one browser spec, then regenerate the catalog, inventory, and interaction evidence. No build dependency or runtime CDN is needed.

## Risks / Trade-offs

- [Risk] Learners may infer that the five fields are never needed → State that they are unnecessary only for this recommendation task and that another purpose may require a different assessment.
- [Risk] The age band and interest are also information about a learner → Use synthetic choices, explain that they are the two inputs of this demonstration rule, and do not ask for a real profile.
- [Risk] A locally stored completion flag could be confused with storing form data → Explicitly say that only the completion marker is stored and test that field selections are not persisted or transmitted.
- [Risk] Recommendation copy could imply a trained AI model → Label the rule as a fixed teaching example, not a live or trained AI recommendation system.

## Migration Plan

Add the topic while preserving existing progress keys. Increase the AI topic total and middle-stage total, run the page and repository checks, push the feature with the OpenSpec change active, and verify the published revision and interaction. Archive the OpenSpec change and record release evidence in a follow-up documentation commit.
