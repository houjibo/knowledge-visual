(function (root, factory) {
  const model = factory();
  if (typeof module === 'object' && module.exports) module.exports = model;
  else root.IotSensorFeedbackModel = model;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const THRESHOLD = 40;
  const PUMP_GAIN = 20;
  const IDLE_LOSS = 5;
  const SCENARIOS = Object.freeze({
    dry: Object.freeze({label: '干燥后的两轮反馈', start: 25, previousPump: false, deliveries: Object.freeze([true, true])}),
    wet: Object.freeze({label: '湿润时停止水泵', start: 55, previousPump: false, deliveries: Object.freeze([true])}),
    lost: Object.freeze({label: '消息丢失与旧命令', start: 45, previousPump: true, deliveries: Object.freeze([false])})
  });

  function computeRound(reading, previousPump, delivered) {
    if (!Number.isInteger(reading) || reading < 0 || reading > 100 ||
        typeof previousPump !== 'boolean' || typeof delivered !== 'boolean') {
      throw new Error('invalid virtual sensor state');
    }
    const command = delivered ? reading < THRESHOLD : previousPump;
    const next = Math.max(0, Math.min(100, reading + (command ? PUMP_GAIN : -IDLE_LOSS)));
    return Object.freeze({reading, previousPump, delivered, command, next});
  }

  function runScenario(key) {
    if (!Object.prototype.hasOwnProperty.call(SCENARIOS, key)) throw new Error('unknown scenario');
    const scenario = SCENARIOS[key];
    let reading = scenario.start;
    let previousPump = scenario.previousPump;
    return scenario.deliveries.map(delivered => {
      const round = computeRound(reading, previousPump, delivered);
      reading = round.next;
      previousPump = round.command;
      return round;
    });
  }

  return {THRESHOLD, PUMP_GAIN, IDLE_LOSS, SCENARIOS, computeRound, runScenario};
});
