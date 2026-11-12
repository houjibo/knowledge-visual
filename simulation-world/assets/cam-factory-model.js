(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.CamFactoryModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const speeds = Object.freeze([20, 30, 40, 60]);
  const dwellAngles = Object.freeze([60, 90, 120, 150]);
  const feedTimes = Object.freeze([0.3, 0.4, 0.5, 0.8]);
  const batchSize = 6;
  const maxDegrees = batchSize * 360;
  const defaults = Object.freeze({rpm: 30, dwellDegrees: 90, feedSeconds: 0.4});

  function validate(config) {
    if (!config || typeof config !== 'object') throw new TypeError('configuration is required');
    if (!speeds.includes(config.rpm)) throw new RangeError('unsupported cam speed');
    if (!dwellAngles.includes(config.dwellDegrees)) throw new RangeError('unsupported high dwell angle');
    if (!feedTimes.includes(config.feedSeconds)) throw new RangeError('unsupported feed duration');
    return {rpm: config.rpm, dwellDegrees: config.dwellDegrees, feedSeconds: config.feedSeconds};
  }

  function calculate(config) {
    const values = validate(config);
    const cycleSeconds = 60 / values.rpm;
    const dwellSeconds = cycleSeconds * values.dwellDegrees / 360;
    return {
      ...values,
      cycleSeconds,
      dwellSeconds,
      lowDwellDegrees: 180 - values.dwellDegrees,
      windowEnough: dwellSeconds + 1e-10 >= values.feedSeconds,
    };
  }

  function at(config, totalDegrees) {
    const result = calculate(config);
    if (!Number.isFinite(totalDegrees) || totalDegrees < 0 || totalDegrees > maxDegrees) {
      throw new RangeError('phase must be a finite angle within the six-cycle demonstration');
    }
    const angle = totalDegrees % 360;
    let phase;
    let height;
    if (angle < 90) {
      phase = 'rise';
      height = (1 - Math.cos(Math.PI * angle / 90)) / 2;
    } else if (angle < 90 + result.dwellDegrees) {
      phase = 'high-dwell';
      height = 1;
    } else if (angle < 180 + result.dwellDegrees) {
      phase = 'fall';
      height = (1 + Math.cos(Math.PI * (angle - 90 - result.dwellDegrees) / 90)) / 2;
    } else {
      phase = 'low-dwell';
      height = 0;
    }
    const attemptedCycles = Math.floor(totalDegrees / 360);
    const completedCount = result.windowEnough ? attemptedCycles : 0;
    return {
      ...result,
      totalDegrees,
      angle,
      phase,
      height,
      attemptedCycles,
      completedCount,
      remainingCount: batchSize - completedCount,
      finished: totalDegrees === maxDegrees,
    };
  }

  return Object.freeze({speeds, dwellAngles, feedTimes, batchSize, maxDegrees, defaults,
    validate, calculate, at});
});
