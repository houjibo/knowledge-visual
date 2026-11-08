const assert = require('node:assert/strict');
const gravity = require('../physics/high/assets/gravitation-model.js');

function close(actual, expected, tolerance, label) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${label}: ${actual} is not within ${tolerance} of ${expected}`);
}

assert.equal(gravity.EARTH_RADIUS_KM, 6371);
assert.equal(gravity.EARTH_MU_KM3_S2, 398600);
close(gravity.speedForCircularOrbit(100), 7.85, 0.02, 'near-Earth circular speed');
close(gravity.speedForEscape(100), 11.10, 0.02, 'near-Earth escape speed');

const circular = gravity.speedForCircularOrbit(100);
const escape = gravity.speedForEscape(100);
assert.equal(gravity.classifyLaunch(circular - 0.2, 100).kind, 'impact');
assert.equal(gravity.classifyLaunch(circular, 100).kind, 'circular');
assert.equal(gravity.classifyLaunch(circular + 0.5, 100).kind, 'elliptic');
assert.equal(gravity.classifyLaunch(escape, 100).kind, 'parabolic');
assert.equal(gravity.classifyLaunch(escape + 0.2, 100).kind, 'hyperbolic');

const launch = gravity.createLaunchState(7, 100);
const atEarthSurface = {...launch, yKm: -gravity.EARTH_RADIUS_KM};
const atTwiceRadius = {...launch, yKm: -gravity.EARTH_RADIUS_KM * 2};
const surfaceAcceleration = Math.hypot(...Object.values(gravity.acceleration(atEarthSurface)));
const doubleRadiusAcceleration = Math.hypot(...Object.values(gravity.acceleration(atTwiceRadius)));
close(surfaceAcceleration / doubleRadiusAcceleration, 4, 1e-12, 'inverse-square acceleration');

let orbit = gravity.createLaunchState(circular, 100);
const initialEnergy = gravity.specificEnergy(orbit);
const period = gravity.orbitParameters(100).periodSeconds;
for (let second = 0; second < Math.round(period); second++) orbit = gravity.step(orbit, 1);
const energyDrift = Math.abs(gravity.specificEnergy(orbit) - initialEnergy) / Math.abs(initialEnergy);
assert.ok(energyDrift < 1e-6, `circular-orbit relative energy drift ${energyDrift} exceeds 1e-6`);
close(gravity.radiusOf(orbit), gravity.radiusAtAltitude(100), 0.01, 'circular-orbit radius after one period');

let falling = gravity.createLaunchState(7, 100);
let previous = falling;
for (let second = 0; second < 1000 && gravity.radiusOf(falling) > gravity.EARTH_RADIUS_KM; second++) {
  previous = falling;
  falling = gravity.step(falling, 1);
}
assert.ok(gravity.radiusOf(falling) <= gravity.EARTH_RADIUS_KM, 'sub-circular trajectory should intersect Earth');
const impact = gravity.surfaceIntersection(previous, falling);
close(gravity.radiusOf(impact), gravity.EARTH_RADIUS_KM, 1e-9, 'interpolated impact radius');

const leo = gravity.orbitParameters(400);
close(leo.speedKmPerSec, 7.67, 0.02, '400 km orbit speed');
close(leo.periodSeconds, 5550, 25, '400 km orbit period');
const moonAltitudeKm = 384400 - gravity.EARTH_RADIUS_KM;
const lunarOrbit = gravity.orbitParameters(moonAltitudeKm);
assert.equal(lunarOrbit.radiusKm, 384400, 'moon preset uses center-to-center radius');
close(lunarOrbit.periodSeconds / 86400, 27.45, 0.05, 'lunar-distance Earth point-mass period');

console.log('Gravitation model scenarios passed: thresholds, inverse-square acceleration, Verlet energy, collision and orbital parameters');
