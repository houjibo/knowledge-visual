(function (root, factory) {
  const model = factory();
  if (typeof module === 'object' && module.exports) module.exports = model;
  if (root) root.ElectrostaticModel = model;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const COULOMB_CONSTANT = 8.9875517923e9;
  const MICROCOULOMB = 1e-6;

  function finite(value, name) {
    if (!Number.isFinite(value)) throw new TypeError(`${name} must be finite`);
  }

  function coulombForceMagnitude(q1MicroC, q2MicroC, distanceMeters) {
    finite(q1MicroC, 'q1MicroC');
    finite(q2MicroC, 'q2MicroC');
    finite(distanceMeters, 'distanceMeters');
    if (distanceMeters <= 0) throw new RangeError('distanceMeters must be greater than zero');
    return COULOMB_CONSTANT * Math.abs(q1MicroC * q2MicroC) * MICROCOULOMB ** 2 /
      (distanceMeters ** 2);
  }

  function forceType(q1MicroC, q2MicroC) {
    finite(q1MicroC, 'q1MicroC');
    finite(q2MicroC, 'q2MicroC');
    if (q1MicroC === 0 || q2MicroC === 0) return 'none';
    return Math.sign(q1MicroC) === Math.sign(q2MicroC) ? 'repulsive' : 'attractive';
  }

  function validateSources(charges, point, minimumRadiusMeters) {
    if (!Array.isArray(charges)) throw new TypeError('charges must be an array');
    if (!point || typeof point !== 'object') throw new TypeError('point must be an object');
    finite(point.x, 'point.x');
    finite(point.y, 'point.y');
    finite(minimumRadiusMeters, 'minimumRadiusMeters');
    if (minimumRadiusMeters < 0) throw new RangeError('minimumRadiusMeters cannot be negative');
    charges.forEach((charge, index) => {
      if (!charge || typeof charge !== 'object') throw new TypeError(`charges[${index}] must be an object`);
      finite(charge.x, `charges[${index}].x`);
      finite(charge.y, `charges[${index}].y`);
      finite(charge.qMicroC, `charges[${index}].qMicroC`);
    });
  }

  function electricFieldAt(charges, point, minimumRadiusMeters = 0) {
    validateSources(charges, point, minimumRadiusMeters);
    let x = 0;
    let y = 0;
    charges.forEach(charge => {
      if (charge.qMicroC === 0) return;
      const dx = point.x - charge.x;
      const dy = point.y - charge.y;
      const actualRadius = Math.hypot(dx, dy);
      if (actualRadius === 0 && minimumRadiusMeters === 0) {
        throw new RangeError('field is undefined at an ideal point charge');
      }
      const radius = Math.max(actualRadius, minimumRadiusMeters);
      if (radius === 0) return;
      const scale = COULOMB_CONSTANT * charge.qMicroC * MICROCOULOMB / (radius ** 3);
      x += scale * dx;
      y += scale * dy;
    });
    return {x, y, magnitude: Math.hypot(x, y)};
  }

  function electricPotentialAt(charges, point, minimumRadiusMeters = 0) {
    validateSources(charges, point, minimumRadiusMeters);
    return charges.reduce((potential, charge) => {
      if (charge.qMicroC === 0) return potential;
      const radius = Math.max(Math.hypot(point.x - charge.x, point.y - charge.y), minimumRadiusMeters);
      if (radius === 0) throw new RangeError('potential is undefined at an ideal point charge');
      return potential + COULOMB_CONSTANT * charge.qMicroC * MICROCOULOMB / radius;
    }, 0);
  }

  return Object.freeze({
    COULOMB_CONSTANT,
    coulombForceMagnitude,
    forceType,
    electricFieldAt,
    electricPotentialAt,
  });
});
