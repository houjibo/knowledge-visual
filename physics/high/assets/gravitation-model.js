(function exposeGravitationModel(root, factory) {
  const model = factory();
  if (typeof module === 'object' && module.exports) module.exports = model;
  if (root) root.GravitationModel = model;
})(typeof globalThis === 'object' ? globalThis : this, function createGravitationModel() {
  const EARTH_RADIUS_KM = 6371;
  const EARTH_MU_KM3_S2 = 398600;
  const LAUNCH_ALTITUDE_KM = 100;
  const VELOCITY_ROUNDING_TOLERANCE_KM_S = 0.0051;

  function finiteNumber(value, label) {
    const number = Number(value);
    if (!Number.isFinite(number)) throw new TypeError(`${label} must be finite`);
    return number;
  }

  function radiusAtAltitude(altitudeKm = 0) {
    const altitude = finiteNumber(altitudeKm, 'altitudeKm');
    if (altitude < 0) throw new RangeError('altitudeKm must not be negative');
    return EARTH_RADIUS_KM + altitude;
  }

  function speedForCircularOrbit(altitudeKm = 0) {
    return Math.sqrt(EARTH_MU_KM3_S2 / radiusAtAltitude(altitudeKm));
  }

  function speedForEscape(altitudeKm = 0) {
    return Math.sqrt(2 * EARTH_MU_KM3_S2 / radiusAtAltitude(altitudeKm));
  }

  function radiusOf(state) {
    return Math.hypot(state.xKm, state.yKm);
  }

  function speedOf(state) {
    return Math.hypot(state.vxKmPerSec, state.vyKmPerSec);
  }

  function specificEnergy(state) {
    const radiusKm = radiusOf(state);
    if (radiusKm === 0) throw new RangeError('state must not be at the Earth center');
    return (speedOf(state) ** 2) / 2 - EARTH_MU_KM3_S2 / radiusKm;
  }

  function eccentricity(state) {
    const radiusKm = radiusOf(state);
    if (radiusKm === 0) throw new RangeError('state must not be at the Earth center');
    const speedSquared = speedOf(state) ** 2;
    const radialVelocity = state.xKm * state.vxKmPerSec + state.yKm * state.vyKmPerSec;
    const factor = speedSquared - EARTH_MU_KM3_S2 / radiusKm;
    const ex = (factor * state.xKm - radialVelocity * state.vxKmPerSec) / EARTH_MU_KM3_S2;
    const ey = (factor * state.yKm - radialVelocity * state.vyKmPerSec) / EARTH_MU_KM3_S2;
    return Math.hypot(ex, ey);
  }

  function classifyLaunch(speedKmPerSec, altitudeKm = LAUNCH_ALTITUDE_KM) {
    const speed = finiteNumber(speedKmPerSec, 'speedKmPerSec');
    if (speed < 0) throw new RangeError('speedKmPerSec must not be negative');
    const circularSpeedKmPerSec = speedForCircularOrbit(altitudeKm);
    const escapeSpeedKmPerSec = speedForEscape(altitudeKm);
    const initialState = createLaunchState(speed, altitudeKm);
    const energyKm2PerSec2 = specificEnergy(initialState);
    let kind;

    if (Math.abs(speed - circularSpeedKmPerSec) <= VELOCITY_ROUNDING_TOLERANCE_KM_S) {
      kind = 'circular';
    } else if (speed < circularSpeedKmPerSec) {
      kind = 'impact';
    } else if (Math.abs(speed - escapeSpeedKmPerSec) <= VELOCITY_ROUNDING_TOLERANCE_KM_S) {
      kind = 'parabolic';
    } else if (energyKm2PerSec2 < 0) {
      kind = 'elliptic';
    } else {
      kind = 'hyperbolic';
    }

    return {
      kind,
      altitudeKm: Number(altitudeKm),
      initialRadiusKm: radiusAtAltitude(altitudeKm),
      circularSpeedKmPerSec,
      escapeSpeedKmPerSec,
      specificEnergyKm2PerSec2: energyKm2PerSec2,
      eccentricity: eccentricity(initialState),
    };
  }

  function createLaunchState(speedKmPerSec, altitudeKm = LAUNCH_ALTITUDE_KM) {
    const speed = finiteNumber(speedKmPerSec, 'speedKmPerSec');
    if (speed < 0) throw new RangeError('speedKmPerSec must not be negative');
    const radiusKm = radiusAtAltitude(altitudeKm);
    return {
      xKm: 0,
      yKm: -radiusKm,
      vxKmPerSec: speed,
      vyKmPerSec: 0,
      timeSeconds: 0,
    };
  }

  function acceleration(state) {
    const radiusKm = radiusOf(state);
    if (radiusKm === 0) throw new RangeError('state must not be at the Earth center');
    const scale = -EARTH_MU_KM3_S2 / (radiusKm ** 3);
    return {axKmPerSec2: scale * state.xKm, ayKmPerSec2: scale * state.yKm};
  }

  function step(state, deltaSeconds = 1) {
    const dt = finiteNumber(deltaSeconds, 'deltaSeconds');
    if (dt <= 0) throw new RangeError('deltaSeconds must be positive');
    const before = acceleration(state);
    const halfDtSquared = (dt ** 2) / 2;
    const nextPosition = {
      xKm: state.xKm + state.vxKmPerSec * dt + before.axKmPerSec2 * halfDtSquared,
      yKm: state.yKm + state.vyKmPerSec * dt + before.ayKmPerSec2 * halfDtSquared,
    };
    const after = acceleration(nextPosition);
    return {
      xKm: nextPosition.xKm,
      yKm: nextPosition.yKm,
      vxKmPerSec: state.vxKmPerSec + (before.axKmPerSec2 + after.axKmPerSec2) * dt / 2,
      vyKmPerSec: state.vyKmPerSec + (before.ayKmPerSec2 + after.ayKmPerSec2) * dt / 2,
      timeSeconds: (state.timeSeconds || 0) + dt,
    };
  }

  function surfaceIntersection(before, after, surfaceRadiusKm = EARTH_RADIUS_KM) {
    const surfaceRadius = finiteNumber(surfaceRadiusKm, 'surfaceRadiusKm');
    if (radiusOf(before) <= surfaceRadius) return {...before};
    if (radiusOf(after) > surfaceRadius) throw new RangeError('after state must cross the surface');
    let low = 0;
    let high = 1;
    for (let index = 0; index < 48; index++) {
      const fraction = (low + high) / 2;
      const radiusKm = Math.hypot(
        before.xKm + (after.xKm - before.xKm) * fraction,
        before.yKm + (after.yKm - before.yKm) * fraction,
      );
      if (radiusKm > surfaceRadius) low = fraction;
      else high = fraction;
    }
    const fraction = (low + high) / 2;
    return {
      xKm: before.xKm + (after.xKm - before.xKm) * fraction,
      yKm: before.yKm + (after.yKm - before.yKm) * fraction,
      vxKmPerSec: before.vxKmPerSec + (after.vxKmPerSec - before.vxKmPerSec) * fraction,
      vyKmPerSec: before.vyKmPerSec + (after.vyKmPerSec - before.vyKmPerSec) * fraction,
      timeSeconds: before.timeSeconds + (after.timeSeconds - before.timeSeconds) * fraction,
    };
  }

  function orbitParameters(altitudeKm) {
    const radiusKm = radiusAtAltitude(altitudeKm);
    const speedKmPerSec = Math.sqrt(EARTH_MU_KM3_S2 / radiusKm);
    const periodSeconds = 2 * Math.PI * Math.sqrt((radiusKm ** 3) / EARTH_MU_KM3_S2);
    const accelerationMetersPerSec2 = EARTH_MU_KM3_S2 / (radiusKm ** 2) * 1000;
    return {altitudeKm: Number(altitudeKm), radiusKm, speedKmPerSec, periodSeconds, accelerationMetersPerSec2};
  }

  return Object.freeze({
    EARTH_RADIUS_KM,
    EARTH_MU_KM3_S2,
    LAUNCH_ALTITUDE_KM,
    radiusAtAltitude,
    speedForCircularOrbit,
    speedForEscape,
    radiusOf,
    speedOf,
    specificEnergy,
    eccentricity,
    classifyLaunch,
    createLaunchState,
    acceleration,
    step,
    surfaceIntersection,
    orbitParameters,
  });
});
