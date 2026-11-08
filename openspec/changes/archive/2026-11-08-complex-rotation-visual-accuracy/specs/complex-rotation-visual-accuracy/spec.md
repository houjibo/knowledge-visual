## ADDED Requirements
### Requirement: Rotation and scaling animation follows the complex transformation
The complex rotation visualization SHALL calculate each animation frame by applying the corresponding fraction of the selected rotation angle and scale factor to the original complex number.

#### Scenario: Rotation and scale change together
- **WHEN** the animation is between its starting and ending frames with a non-zero input
- **THEN** the displayed point SHALL match the angle and scale at that frame, and its drawn path SHALL follow those intermediate positions

### Requirement: Rotation direction remains stable across the principal-angle boundary
The rotation visualization SHALL draw the angle arc using the selected rotation direction rather than inferring direction from wrapped start and end principal arguments.

#### Scenario: Positive rotation crosses the principal-angle boundary
- **WHEN** a positive rotation carries the point across either representation of the ±π boundary
- **THEN** the angle arc SHALL continue in the positive rotation direction

#### Scenario: Negative rotation crosses the principal-angle boundary
- **WHEN** a negative rotation carries the point across either representation of the ±π boundary
- **THEN** the angle arc SHALL continue in the negative rotation direction

### Requirement: The zero complex number has no displayed argument
The complex plane and rotation visualizations SHALL not draw an argument arc for the zero complex number and SHALL identify its argument as undefined.

#### Scenario: Zero complex number is displayed
- **WHEN** the selected complex number is zero
- **THEN** the visualization SHALL show the origin without an argument arc or a directional vector arrow and SHALL explain that its argument is undefined

### Requirement: Conjugate labels identify the reflected point
The complex plane visualization SHALL place the conjugate label by the point reflected across the real axis and format a negative imaginary component without a plus-minus sequence.

#### Scenario: A complex number with negative imaginary part is displayed
- **WHEN** the conjugate point and its label are rendered
- **THEN** the label SHALL be positioned by that reflected point and SHALL use a minus sign before the positive imaginary magnitude
