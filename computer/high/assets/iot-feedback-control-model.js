(function (root, factory) {
  const model = factory();
  if (typeof module === 'object' && module.exports) module.exports = model;
  else root.HighIotFeedbackControlModel = model;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const MIN_TEMPERATURE = 10;
  const MAX_TEMPERATURE = 45;
  const INITIAL_TEMPERATURE = 32;
  const ACTUATOR_DELTA = Object.freeze({fan: -3, heater: 3, idle: 0});
  const SCHEDULED_ACTIONS = Object.freeze(['fan', 'fan', 'idle', 'idle', 'idle']);
  const SCENARIOS = Object.freeze({
    calm: Object.freeze({label: '环境稳定', disturbances: Object.freeze([0, 0, 0, 0, 0])}),
    heatPulse: Object.freeze({label: '第 3 轮热量增加', disturbances: Object.freeze([0, 0, 5, 0, 0])})
  });

  function assertTemperature(value, name) {
    if (!Number.isSafeInteger(value) || value < MIN_TEMPERATURE || value > MAX_TEMPERATURE) {
      throw new RangeError(`${name} must be an integer from ${MIN_TEMPERATURE} to ${MAX_TEMPERATURE}`);
    }
  }

  function assertTarget(target) {
    if (!Number.isSafeInteger(target) || target < 20 || target > 28) {
      throw new RangeError('target must be an integer from 20 to 28');
    }
  }

  function clampTemperature(value) {
    return Math.max(MIN_TEMPERATURE, Math.min(MAX_TEMPERATURE, value));
  }

  function chooseFeedbackAction(measured, target) {
    if (measured > target + 1) return 'fan';
    if (measured < target - 1) return 'heater';
    return 'idle';
  }

  function runStrategy(target, disturbances, actionsForRound, strategy) {
    let temperature = INITIAL_TEMPERATURE;
    let totalDeviation = 0;
    const trace = disturbances.map((disturbance, index) => {
      const before = temperature;
      const measured = clampTemperature(before + disturbance);
      const action = actionsForRound(measured, index);
      const after = clampTemperature(measured + ACTUATOR_DELTA[action]);
      const deviation = Math.abs(after - target);
      totalDeviation += deviation;
      temperature = after;
      return Object.freeze({
        round: index + 1,
        before,
        disturbance,
        measured,
        target,
        action,
        after,
        deviation
      });
    });
    return Object.freeze({strategy, trace: Object.freeze(trace), finalTemperature: temperature, totalDeviation});
  }

  function runComparison({target = 24, scenario = 'heatPulse'} = {}) {
    assertTarget(target);
    if (!Object.prototype.hasOwnProperty.call(SCENARIOS, scenario)) throw new RangeError('unknown disturbance scenario');
    const {disturbances} = SCENARIOS[scenario];
    const scheduled = runStrategy(target, disturbances, (_measured, index) => SCHEDULED_ACTIONS[index], 'scheduled');
    const feedback = runStrategy(target, disturbances, (measured) => chooseFeedbackAction(measured, target), 'feedback');
    return Object.freeze({
      scenario,
      scenarioLabel: SCENARIOS[scenario].label,
      target,
      initialTemperature: INITIAL_TEMPERATURE,
      scheduled,
      feedback,
      fixedModel: true
    });
  }

  function runDeploymentTrial({architecture = 'local', networkAvailable = false, temperature = INITIAL_TEMPERATURE, target = 24} = {}) {
    if (architecture !== 'local' && architecture !== 'cloud') throw new RangeError('unknown controller architecture');
    if (typeof networkAvailable !== 'boolean') throw new TypeError('networkAvailable must be boolean');
    assertTemperature(temperature, 'temperature');
    assertTarget(target);
    const decisionIssued = architecture === 'local' || networkAvailable;
    const action = decisionIssued ? chooseFeedbackAction(temperature, target) : 'idle';
    return Object.freeze({
      architecture,
      networkAvailable,
      temperature,
      target,
      decisionIssued,
      decisionSource: decisionIssued ? (architecture === 'local' ? 'local' : 'cloud') : 'fallback',
      action,
      after: clampTemperature(temperature + ACTUATOR_DELTA[action]),
      fixedFallback: !decisionIssued
    });
  }

  return Object.freeze({
    MIN_TEMPERATURE,
    MAX_TEMPERATURE,
    INITIAL_TEMPERATURE,
    ACTUATOR_DELTA,
    SCHEDULED_ACTIONS,
    SCENARIOS,
    chooseFeedbackAction,
    runComparison,
    runDeploymentTrial
  });
});
