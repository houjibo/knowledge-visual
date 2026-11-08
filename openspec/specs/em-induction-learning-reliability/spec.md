# em-induction-learning-reliability Specification

## Purpose
TBD - created by archiving change em-induction-interaction-reliability. Update Purpose after archive.

## Requirements

### Requirement: Topic navigation exposes the selected panel and keyboard controls
The page SHALL expose its four learning topics as an accessible tab set. Each tab SHALL identify its panel and selection state, and arrow keys plus Home/End SHALL move selection and focus.

#### Scenario: Navigate topics with the keyboard
- **WHEN** a learner focuses a topic tab and presses an arrow key, Home, or End
- **THEN** the corresponding tab becomes selected, its panel is shown and focused through the tab sequence, and the other panels are hidden

### Requirement: Simulation controls are named and keyboard-operable
Every range control SHALL have a programmatic label. The magnet's position SHALL be adjustable with its range control and SHALL be locked only while the automatic magnet motion is running.

#### Scenario: Set and restore magnet position
- **WHEN** a learner changes the magnet-position range control with the keyboard and switches to another topic and back
- **THEN** the magnet is drawn at the selected position and the position value is preserved

#### Scenario: Automatic motion locks manual positioning
- **WHEN** a learner starts or pauses magnet motion
- **THEN** the manual position control is disabled while running and enabled again when paused

### Requirement: Visible canvases are sized and redrawn
The page SHALL size each canvas after its panel becomes visible and after a viewport resize, and SHALL preserve simulation state while switching topics.

#### Scenario: Open a previously hidden topic
- **WHEN** a learner selects a topic whose canvas was hidden at page load
- **THEN** the canvas has non-zero CSS and backing dimensions and displays the retained model state

#### Scenario: Resize while viewing a topic
- **WHEN** the viewport width changes while a topic is selected
- **THEN** that topic's canvas is resized and redrawn without changing its model parameters

### Requirement: Animation pause and resume have one pending frame
The magnet and AC simulations SHALL have no more than one pending animation frame while running and no pending frame while paused.

#### Scenario: Pause and resume before the next frame
- **WHEN** a learner pauses a simulation and immediately resumes it before the pending frame runs
- **THEN** the paused request is cancelled and the resumed simulation has exactly one pending frame

### Requirement: Lenz-law visuals match pole motion and viewing side
Each Lenz-law control SHALL show the named pole at the moving end, use the direction determined by Lenz's law viewed from the magnet side, and provide equivalent readable text.

#### Scenario: North pole approaches or withdraws
- **WHEN** the learner selects north-pole insertion or withdrawal
- **THEN** the north pole is shown at the leading end and the feedback reports counterclockwise for approach or clockwise for withdrawal, viewed from the magnet side

#### Scenario: South pole approaches or withdraws
- **WHEN** the learner selects south-pole insertion or withdrawal
- **THEN** the south pole is shown at the leading end and the feedback reports clockwise for approach or counterclockwise for withdrawal, viewed from the magnet side

### Requirement: Relative electromagnetic readings reflect Faraday's law
The page SHALL identify normalized readings as relative values, calculate per-turn relative flux independently of coil turns, and apply coil turns once in the induced-emf relationship.

#### Scenario: Compare turns at the same flux-change rate
- **WHEN** the learner doubles the coil-turn setting while the per-turn flux-change rate is held constant
- **THEN** the displayed relative induced emf doubles and no physical unit is implied for normalized readings

### Requirement: Each quiz question contributes at most once
The quiz SHALL accept one answer per question, lock all options after selection, and count each distinct first-try correct answer at most once toward the three-question completion threshold.

#### Scenario: Repeat an answer after it has been accepted
- **WHEN** a learner selects an answer and attempts to select any option on that question again
- **THEN** the options remain disabled and the answer contributes no additional progress

#### Scenario: Complete three distinct questions correctly on first try
- **WHEN** a learner answers three distinct questions correctly on their first attempt
- **THEN** the electromagnetic-induction topic is marked complete
