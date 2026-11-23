(function (root, factory) {
  const model = factory();
  if (typeof module === 'object' && module.exports) module.exports = model;
  root.ReactionEquilibriumModel = model;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const K_FORWARD = 0.5;
  const K_REVERSE = 0.2;
  const SIMPLE_EQUILIBRIUM_A = K_REVERSE / (K_FORWARD + K_REVERSE);
  const AMMONIA_INITIAL = Object.freeze({n2: 8, h2: 24, nh3: 12});

  function simpleState(mode, time) {
    const initialA = {forward: 1, reverse: 0, both: 0.5}[mode];
    if (initialA === undefined || !Number.isFinite(time) || time < 0) {
      throw new RangeError('invalid reversible-reaction state');
    }
    const a = SIMPLE_EQUILIBRIUM_A + (initialA - SIMPLE_EQUILIBRIUM_A)
      * Math.exp(-(K_FORWARD + K_REVERSE) * time);
    const b = 1 - a;
    const forwardRate = K_FORWARD * a;
    const reverseRate = K_REVERSE * b;
    return {time, a, b, forwardRate, reverseRate};
  }

  function ammoniaQuotient(amounts, pressure) {
    const total = amounts.n2 + amounts.h2 + amounts.nh3;
    if (!Number.isFinite(total) || total <= 0 || !Number.isFinite(pressure) || pressure <= 0
      || [amounts.n2, amounts.h2, amounts.nh3].some(x => !Number.isFinite(x) || x < 0)) {
      throw new RangeError('invalid ammonia amounts or pressure');
    }
    if (amounts.n2 === 0 || amounts.h2 === 0) return Infinity;
    if (amounts.nh3 === 0) return 0;
    const pN2 = amounts.n2 / total * pressure;
    const pH2 = amounts.h2 / total * pressure;
    const pNH3 = amounts.nh3 / total * pressure;
    return pNH3 ** 2 / (pN2 * pH2 ** 3);
  }

  const AMMONIA_BASE_K = ammoniaQuotient(AMMONIA_INITIAL, 1);

  function ammoniaK(temperature) {
    const factors = {normal: 1, high: 0.25, low: 4};
    if (!(temperature in factors)) throw new RangeError('invalid temperature plan');
    return AMMONIA_BASE_K * factors[temperature];
  }

  function initialAmmoniaState() {
    return {
      ...AMMONIA_INITIAL, pressure: 1, temperature: 'normal',
      preRatio: 1, postRatio: 1, extent: 0, action: null
    };
  }

  function ammoniaAtExtent(amounts, extent) {
    return {
      n2: amounts.n2 - extent,
      h2: amounts.h2 - 3 * extent,
      nh3: amounts.nh3 + 2 * extent
    };
  }

  function solveAmmoniaExtent(amounts, pressure, targetK) {
    let low = -amounts.nh3 / 2;
    let high = Math.min(amounts.n2, amounts.h2 / 3);
    for (let i = 0; i < 100; i++) {
      const mid = (low + high) / 2;
      if (ammoniaQuotient(ammoniaAtExtent(amounts, mid), pressure) < targetK) low = mid;
      else high = mid;
    }
    return (low + high) / 2;
  }

  function perturbAmmonia(previous, action) {
    const amounts = {n2: previous.n2, h2: previous.h2, nh3: previous.nh3};
    let pressure = previous.pressure;
    let temperature = previous.temperature;
    switch (action) {
      case 'tempUp': temperature = 'high'; break;
      case 'tempDown': temperature = 'low'; break;
      case 'pressUp': pressure = 2; break;
      case 'pressDown': pressure = 0.5; break;
      case 'addN2': amounts.n2 += 5; break;
      case 'addNH3': amounts.nh3 += 6; break;
      default: throw new RangeError('invalid equilibrium disturbance');
    }
    const targetK = ammoniaK(temperature);
    const preRatio = ammoniaQuotient(amounts, pressure) / targetK;
    const extent = solveAmmoniaExtent(amounts, pressure, targetK);
    const after = ammoniaAtExtent(amounts, extent);
    return {
      ...after, pressure, temperature, preRatio,
      postRatio: ammoniaQuotient(after, pressure) / targetK,
      extent, action
    };
  }

  return {
    K_FORWARD, K_REVERSE, SIMPLE_EQUILIBRIUM_A, AMMONIA_BASE_K,
    simpleState, ammoniaQuotient, ammoniaK, initialAmmoniaState,
    ammoniaAtExtent, solveAmmoniaExtent, perturbAmmonia
  };
});
