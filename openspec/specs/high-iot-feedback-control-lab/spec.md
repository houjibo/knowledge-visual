# high-iot-feedback-control-lab Specification

## Purpose
为普通高中信息科技必修 2 的物联系统学习提供一个可操作的局部证据：让学习者观察反馈如何根据状态变化调节系统，比较受限的部署路径，并准确说明离线行为与自主可控能力之间的边界。

## Requirements

### Requirement: Compare scheduled and feedback control

The page MUST compare a fixed scheduled controller and a sensor-feedback controller under the same bounded initial conditions and disturbance sequence.

#### Scenario: Predict before revealing the comparison
- **WHEN** the learner selects a disturbance scenario and a target, then chooses which controller will finish closer to target
- **THEN** the page records the prediction before showing either trace
- **AND** the learner can reveal the systems one step at a time

#### Scenario: Show the feedback loop
- **WHEN** one comparison step is revealed
- **THEN** the page identifies the simulated sensor reading, controller decision, actuator action, disturbance, and resulting system state
- **AND** a visible diagram and a text equivalent show the sensor-to-controller-to-actuator-to-system loop

#### Scenario: Explain the limited comparison metric
- **WHEN** the comparison finishes
- **THEN** the page reports the target deviation for both runs and the sum of deviations for this input
- **AND** labels the metric as a comparison of this fixed model, not real runtime, energy efficiency, or proof that feedback is always better

### Requirement: Explain deployment and offline behavior

The page MUST let learners compare a local decision loop with a cloud-dependent decision path for a bounded network-disconnection scenario.

#### Scenario: Local path during disconnection
- **WHEN** the learner selects the local controller and simulates a network outage
- **THEN** the preconfigured local rule continues in this model
- **AND** the page states that offline continuation alone does not establish device, software, update, data, or supply-chain autonomy

#### Scenario: Cloud path during disconnection
- **WHEN** the learner selects the cloud-dependent controller and simulates a network outage
- **THEN** the page shows the configured fallback and identifies the unavailable remote command path
- **AND** states that fallback behavior is a design choice, not a universal property of cloud systems

### Requirement: Record bounded learning completion

The page MUST save completion locally only after the learner completes the required prediction, trace and deployment-boundary tasks.

#### Scenario: Completion prerequisites
- **WHEN** a task is skipped or its prediction is incorrect
- **THEN** the relevant task remains incomplete and can be retried
- **AND** a successful local progress write reports completion accurately

#### Scenario: Storage failure and recovery
- **WHEN** local storage is unavailable or rejects the write
- **THEN** the page preserves the completed work in the current session, reports that progress was not saved, and offers a retry

### Requirement: Preserve static-site accessibility and model limits

The page MUST remain operable as a static page and expose equivalent text for its visual states.

#### Scenario: Keyboard and narrow viewport
- **WHEN** a learner uses only a keyboard at a 320 CSS-pixel viewport
- **THEN** all tasks remain operable without horizontal page overflow
- **AND** visual path states and results remain available in text

#### Scenario: Direct and published paths
- **WHEN** the page is opened directly as a local file or under the GitHub Pages project subpath
- **THEN** its model and controller load without external runtime services

#### Scenario: No hardware or product certification
- **WHEN** the page describes offline operation and autonomous controllability
- **THEN** the page identifies all numeric behavior as a fixed teaching model
- **AND** does not claim to access real devices, measure real efficiency, or certify an actual system's security or autonomous controllability
