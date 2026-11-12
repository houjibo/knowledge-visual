(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.BeltPulleyModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const diameters = Object.freeze([60, 80, 100, 120, 140, 160]);
  const speeds = Object.freeze([30, 40, 50, 60, 70, 80, 90, 100, 110, 120]);
  const defaults = Object.freeze({driverDiameter: 80, drivenDiameter: 160, inputRpm: 60,
    layout: 'open', slipObserved: false});
  const centers = Object.freeze({driver: Object.freeze({x: 250, y: 220}),
    driven: Object.freeze({x: 710, y: 220})});
  const scale = 0.72;

  function validate(config) {
    if (!config || typeof config !== 'object') throw new TypeError('configuration is required');
    if (!diameters.includes(config.driverDiameter)) throw new RangeError('invalid driver diameter');
    if (!diameters.includes(config.drivenDiameter)) throw new RangeError('invalid driven diameter');
    if (!speeds.includes(config.inputRpm)) throw new RangeError('invalid input rpm');
    if (config.layout !== 'open' && config.layout !== 'crossed') throw new RangeError('invalid layout');
    if (typeof config.slipObserved !== 'boolean') throw new TypeError('slipObserved must be boolean');
    return {...config};
  }

  function calculate(config) {
    const values = validate(config);
    const ratio = values.driverDiameter / values.drivenDiameter;
    const idealOutputRpm = values.inputRpm * ratio;
    const beltSpeedMps = Math.PI * values.driverDiameter / 1000 * values.inputRpm / 60;
    const direction = values.layout === 'open' ? 'same' : 'opposite';
    const speedTrend = ratio > 1 ? 'faster' : ratio < 1 ? 'slower' : 'same';
    return {
      ratio, idealOutputRpm, beltSpeedMps, direction, speedTrend,
      signedOutputDegreesPerDriverTurn: 360 * ratio * (direction === 'same' ? 1 : -1),
      actualOutputRpm: values.slipObserved ? null : idealOutputRpm,
      actualDirection: values.slipObserved ? null : direction,
    };
  }

  const point = (center, radius, normal, sign = 1) => ({
    x: center.x + sign * radius * normal.x,
    y: center.y + sign * radius * normal.y,
  });
  const coordinate = value => Number(value.toFixed(4));
  const pair = p => `${coordinate(p.x)} ${coordinate(p.y)}`;

  function geometry(config) {
    const values = validate(config);
    const r1 = values.driverDiameter * scale;
    const r2 = values.drivenDiameter * scale;
    const separation = centers.driven.x - centers.driver.x;
    const crossed = values.layout === 'crossed';
    const nx = (r1 + (crossed ? r2 : -r2)) / separation;
    const ny = Math.sqrt(1 - nx * nx);
    const upper = {x: nx, y: -ny}, lower = {x: nx, y: ny};
    const driverUpper = point(centers.driver, r1, upper);
    const driverLower = point(centers.driver, r1, lower);
    const drivenFirst = point(centers.driven, r2, upper, crossed ? -1 : 1);
    const drivenSecond = point(centers.driven, r2, lower, crossed ? -1 : 1);
    const first = [driverUpper, drivenFirst];
    const second = [driverLower, drivenSecond];
    const drivenLargeArc = crossed ? 1 : nx < 0 ? 1 : 0;
    const driverLargeArc = crossed ? 1 : nx > 0 ? 1 : 0;
    const drivenSweep = crossed ? 0 : 1;
    const path = `M ${pair(driverUpper)} L ${pair(drivenFirst)} ` +
      `A ${coordinate(r2)} ${coordinate(r2)} 0 ${drivenLargeArc} ${drivenSweep} ${pair(drivenSecond)} ` +
      `L ${pair(driverLower)} ` +
      `A ${coordinate(r1)} ${coordinate(r1)} 0 ${driverLargeArc} 1 ${pair(driverUpper)}`;
    return {centers, r1, r2, first, second, path};
  }

  return Object.freeze({diameters, speeds, defaults, validate, calculate, geometry});
});
