(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SliderCrankModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const defaults = Object.freeze({radius: 40, rodLength: 140, rpm: 30, angle: 0});

  function finiteNumber(value, name) {
    if (typeof value !== 'number' || !Number.isFinite(value)) throw new TypeError(`${name} must be a finite number.`);
  }
  function stepped(value, name, minimum, maximum, step) {
    finiteNumber(value, name);
    if (!Number.isInteger(value) || value < minimum || value > maximum || (value - minimum) % step !== 0) throw new RangeError(`${name} must be ${minimum}–${maximum} in steps of ${step}.`);
  }
  function validateAngle(angle) {
    finiteNumber(angle, 'angle');
    if (angle < 0 || angle > 360) throw new RangeError('angle must be between 0 and 360 degrees.');
  }
  function validateParameters(parameters) {
    if (!parameters || typeof parameters !== 'object' || Array.isArray(parameters)) throw new TypeError('A parameter object with radius, rodLength, and angle is required.');
    const {radius, rodLength, angle} = parameters;
    const rpm = Object.hasOwn(parameters, 'rpm') ? parameters.rpm : defaults.rpm;
    stepped(radius, 'radius', 20, 60, 10);
    stepped(rodLength, 'rodLength', 100, 200, 20);
    stepped(rpm, 'rpm', 10, 60, 10);
    validateAngle(angle);
    if (rodLength <= radius) throw new RangeError('rodLength must exceed radius.');
    return {radius, rodLength, angle, rpm};
  }
  function zero(value) { return Math.abs(value) < 1e-12 ? 0 : value; }

  function position(parameters) {
    const {radius, rodLength, angle} = validateParameters(parameters);
    const radians = (angle % 360) * Math.PI / 180;
    const crankX = zero(radius * Math.cos(radians));
    const crankY = zero(radius * Math.sin(radians));
    // Positive horizontal rod projection: the slider joint is to the right of the crank pin.
    const x = crankX + Math.sqrt(rodLength * rodLength - crankY * crankY);
    return {
      x, y: 0, crankX, crankY,
      displacement: zero(radius + rodLength - x),
      stroke: 2 * radius,
      travel: 4 * radius
    };
  }

  function advanceAngle(angle, rpm, seconds) {
    validateAngle(angle); stepped(rpm, 'rpm', 10, 60, 10); finiteNumber(seconds, 'seconds');
    if (seconds < 0) throw new RangeError('seconds must be nonnegative.');
    const total = angle + 6 * rpm * seconds;
    if (!Number.isFinite(total)) throw new RangeError('The elapsed time produces a non-finite angle.');
    return zero(total % 360);
  }

  return Object.freeze({defaults, validateParameters, position, advanceAngle});
});
