## ADDED Requirements
### Requirement: Pages deployment uses one verified static publisher
The project SHALL use exactly one automatic GitHub Pages deployment workflow, and that workflow SHALL publish only a static artifact built after project checks and verified against its source revision.

#### Scenario: Main branch update is published
- **WHEN** a current `main` commit passes the project checks and release provenance validation
- **THEN** the sole Pages workflow SHALL deploy the generated static artifact and verify the deployed revision and representative learning paths

#### Scenario: A second Pages publisher is introduced
- **WHEN** another workflow is configured to deploy to GitHub Pages
- **THEN** the static validation SHALL fail before the repository accepts that configuration
