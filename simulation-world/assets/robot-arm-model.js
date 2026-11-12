(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.RobotArmModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const defaults = Object.freeze({l1: 90, l2: 60, shoulder: 35, elbow: -70, targetX: 120, targetY: 40});
  const ranges = Object.freeze({
    l1: [60, 110], l2: [40, 90], shoulder: [-180, 180], elbow: [-180, 180],
    targetX: [-200, 200], targetY: [-200, 200]
  });
  const radians = degrees => degrees * Math.PI / 180;
  const degrees = angle => angle * 180 / Math.PI;
  function validate(parameters) {
    if (!parameters || typeof parameters !== 'object') throw new TypeError('parameters are required');
    const result = {};
    for (const [key, [minimum, maximum]] of Object.entries(ranges)) {
      const value = parameters[key];
      if (typeof value !== 'number' || !Number.isFinite(value) || value < minimum || value > maximum) {
        throw new RangeError(`${key} must be a finite number from ${minimum} to ${maximum}`);
      }
      result[key] = value;
    }
    return result;
  }
  function pose(parameters) {
    const values = validate(parameters);
    const shoulder = radians(values.shoulder), second = radians(values.shoulder + values.elbow);
    const elbowX = values.l1 * Math.cos(shoulder), elbowY = values.l1 * Math.sin(shoulder);
    const x = elbowX + values.l2 * Math.cos(second), y = elbowY + values.l2 * Math.sin(second);
    return {elbowX, elbowY, x, y, radius: Math.hypot(x, y)};
  }
  function reachability(parameters) {
    const values = validate(parameters);
    const distance = Math.hypot(values.targetX, values.targetY);
    const inner = Math.abs(values.l1 - values.l2), outer = values.l1 + values.l2;
    return {distance, inner, outer, reachable: distance >= inner - 1e-9 && distance <= outer + 1e-9};
  }
  function normalize(angle) {
    let value = ((angle + 180) % 360 + 360) % 360 - 180;
    if (Math.abs(value + 180) < 1e-10 && angle > 0) value = 180;
    return value;
  }
  function solve(parameters, branch) {
    const values = validate(parameters);
    if (branch !== 1 && branch !== -1) throw new RangeError('branch must be 1 or -1');
    const reach = reachability(values);
    if (!reach.reachable) return null;
    const squared = reach.distance * reach.distance;
    const cosine = Math.max(-1, Math.min(1, (squared - values.l1 ** 2 - values.l2 ** 2) / (2 * values.l1 * values.l2)));
    const elbow = branch * Math.acos(cosine);
    const shoulder = Math.atan2(values.targetY, values.targetX) -
      Math.atan2(values.l2 * Math.sin(elbow), values.l1 + values.l2 * Math.cos(elbow));
    return {shoulder: normalize(degrees(shoulder)), elbow: normalize(degrees(elbow))};
  }
  return Object.freeze({defaults, ranges, validate, pose, reachability, solve});
});
