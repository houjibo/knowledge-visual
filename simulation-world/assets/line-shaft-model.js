(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.LineShaftModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const shaftSpeeds = Object.freeze([30, 60, 90]);
  const drivenDiameters = Object.freeze([10, 20, 40]);
  const driverDiameter = 20;
  const maxSeconds = 12;
  const stepSeconds = 0.25;
  const defaults = Object.freeze({shaftRpm: 60, aDiameter: 20, bDiameter: 40, aEngaged: true, bEngaged: false});

  function validate(config) {
    if (!config || typeof config !== 'object') throw new TypeError('configuration is required');
    if (!shaftSpeeds.includes(config.shaftRpm)) throw new RangeError('unsupported shaft speed');
    if (!drivenDiameters.includes(config.aDiameter) || !drivenDiameters.includes(config.bDiameter)) {
      throw new RangeError('unsupported driven diameter');
    }
    if (typeof config.aEngaged !== 'boolean' || typeof config.bEngaged !== 'boolean') {
      throw new TypeError('engagement must be boolean');
    }
    return {
      shaftRpm: config.shaftRpm,
      aDiameter: config.aDiameter,
      bDiameter: config.bDiameter,
      aEngaged: config.aEngaged,
      bEngaged: config.bEngaged,
    };
  }

  function calculate(config) {
    const values = validate(config);
    const aRpm = values.aEngaged ? values.shaftRpm * driverDiameter / values.aDiameter : 0;
    const bRpm = values.bEngaged ? values.shaftRpm * driverDiameter / values.bDiameter : 0;
    const bRelation = bRpm === 0 ? 'stopped' : bRpm < values.shaftRpm ? 'slower' : bRpm > values.shaftRpm ? 'faster' : 'same';
    return {...values, driverDiameter, aRpm, bRpm, bRelation};
  }

  function at(config, seconds) {
    if (!Number.isFinite(seconds) || seconds < 0 || seconds > maxSeconds) {
      throw new RangeError('time must be within the finite demonstration');
    }
    const state = calculate(config);
    return {
      ...state,
      seconds,
      shaftAngle: (state.shaftRpm * 6 * seconds) % 360,
      aAngle: (state.aRpm * 6 * seconds) % 360,
      bAngle: (state.bRpm * 6 * seconds) % 360,
      finished: seconds === maxSeconds,
    };
  }

  return Object.freeze({shaftSpeeds, drivenDiameters, driverDiameter, maxSeconds, stepSeconds, defaults, validate, calculate, at});
});
