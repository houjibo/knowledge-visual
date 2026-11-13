(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.SteamEngineModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const crankX = 670;
  const crankY = 215;
  const radius = 65;
  const rodLength = 200;
  const pistonRodLength = 240;
  const leftDeadCenter = crankX - radius - rodLength - pistonRodLength;
  const maxAdvance = 720;
  const speeds = Object.freeze([15, 30]);

  function normalize(angle) {
    if (!Number.isFinite(angle)) throw new RangeError('angle must be finite');
    return ((angle % 360) + 360) % 360;
  }

  function at(angle, rpm) {
    if (!speeds.includes(rpm)) throw new RangeError('unsupported rpm');
    const degrees = normalize(angle);
    const radians = degrees * Math.PI / 180;
    const pinX = crankX - radius * Math.cos(radians);
    const pinY = crankY + radius * Math.sin(radians);
    const crossheadX = crankX - radius * Math.cos(radians)
      - Math.sqrt(rodLength ** 2 - (radius * Math.sin(radians)) ** 2);
    const pistonX = crossheadX - pistonRodLength;
    return Object.freeze({
      degrees, rpm, pinX, pinY, crossheadX, pistonX,
      displacement: pistonX - leftDeadCenter,
      intake: degrees < 180 ? 'left' : 'right',
      nextMotion: degrees < 180 ? '向右' : '向左',
      deadCenter: degrees === 0 || degrees === 180,
      periodSeconds: 60 / rpm,
      halfCycleSeconds: 30 / rpm,
    });
  }

  function elapsedSeconds(advancedDegrees, rpm) {
    if (!Number.isFinite(advancedDegrees) || advancedDegrees < 0 || advancedDegrees > maxAdvance) {
      throw new RangeError('advance must be within two turns');
    }
    if (!speeds.includes(rpm)) throw new RangeError('unsupported rpm');
    return advancedDegrees / (rpm * 6);
  }

  return Object.freeze({crankX, crankY, radius, rodLength, pistonRodLength, leftDeadCenter, maxAdvance, speeds, normalize, at, elapsedSeconds});
});
