const test = require('node:test');
const assert = require('node:assert/strict');
const Model = require('../simulation-world/assets/robot-arm-model.js');

function close(actual, expected, tolerance = 1e-8) {
  assert.ok(Math.abs(actual - expected) < tolerance, `${actual} differs from ${expected}`);
}

test('landmarks and independently measured link lengths match the SVG coordinate contract', () => {
  const base = {...Model.defaults, l1: 90, l2: 60, shoulder: 0};
  const extended = Model.pose({...base, elbow: 0});
  close(extended.elbowX, 90); close(extended.elbowY, 0);
  close(extended.x, 150); close(extended.y, 0);
  const bent = Model.pose({...base, elbow: 90});
  close(bent.x, 90); close(bent.y, 60);
  const folded = Model.pose({...base, elbow: 180});
  close(folded.x, 30); close(folded.y, 0);

  for (let l1 = 60; l1 <= 110; l1 += 10) {
    for (let l2 = 40; l2 <= 90; l2 += 10) {
      for (let shoulder = -180; shoulder <= 180; shoulder += 15) {
        for (let elbow = -180; elbow <= 180; elbow += 30) {
          const p = Model.pose({...base, l1, l2, shoulder, elbow});
          close(Math.hypot(p.elbowX, p.elbowY), l1);
          close(Math.hypot(p.x - p.elbowX, p.y - p.elbowY), l2);
          assert.ok(p.radius >= Math.abs(l1 - l2) - 1e-8);
          assert.ok(p.radius <= l1 + l2 + 1e-8);
        }
      }
    }
  }
});

test('inner and outer boundaries are inclusive; impossible targets do not fabricate solutions', () => {
  const base = {...Model.defaults, l1: 90, l2: 60};
  assert.deepEqual(Model.reachability({...base, targetX: 30, targetY: 0}),
    {distance: 30, inner: 30, outer: 150, reachable: true});
  assert.equal(Model.reachability({...base, targetX: 29, targetY: 0}).reachable, false);
  assert.equal(Model.reachability({...base, targetX: 150, targetY: 0}).reachable, true);
  assert.equal(Model.reachability({...base, targetX: 151, targetY: 0}).reachable, false);
  assert.equal(Model.solve({...base, targetX: 180, targetY: 0}, 1), null);
  assert.equal(Model.reachability({...base, l1: 110, l2: 80, targetX: 180, targetY: 0}).reachable, true);
  assert.equal(Model.reachability({...base, l1: 60, l2: 60, targetX: 0, targetY: 0}).reachable, true);
});

test('both inverse branches return distinct valid angles and the target within display precision', () => {
  const base = {...Model.defaults};
  for (const [l1, l2, x, y] of [[90, 60, 120, 40], [110, 80, 180, 0], [60, 60, 0, 10], [90, 60, 30, 0], [90, 60, 150, 0]]) {
    const input = {...base, l1, l2, targetX: x, targetY: y};
    for (const branch of [1, -1]) {
      const answer = Model.solve(input, branch);
      assert.ok(answer);
      assert.ok(answer.shoulder >= -180 && answer.shoulder <= 180);
      assert.ok(answer.elbow >= -180 && answer.elbow <= 180);
      const p = Model.pose({...input, ...answer});
      close(p.x, x); close(p.y, y);
      const rounded = Model.pose({...input, shoulder: Math.round(answer.shoulder * 10) / 10,
        elbow: Math.round(answer.elbow * 10) / 10});
      assert.ok(Math.hypot(rounded.x - x, rounded.y - y) < 1);
    }
  }
  const positive = Model.solve(base, 1), negative = Model.solve(base, -1);
  assert.ok(Math.abs(positive.elbow - negative.elbow) > 1);
});

test('inverse solutions cover reachable targets in every quadrant without changing impossible inputs', () => {
  for (const [l1, l2] of [[60,60], [90,60], [110,90]]) {
    for (let x = -180; x <= 180; x += 20) {
      for (let y = -180; y <= 180; y += 20) {
        const input = {...Model.defaults, l1, l2, targetX: x, targetY: y};
        const reachable = Math.hypot(x,y) >= Math.abs(l1-l2) - 1e-8 && Math.hypot(x,y) <= l1+l2 + 1e-8;
        assert.equal(Model.reachability(input).reachable, reachable);
        for (const branch of [1,-1]) {
          const solution = Model.solve(input, branch);
          if (!reachable) { assert.equal(solution, null); continue; }
          const actual = Model.pose({...input, ...solution});
          close(actual.x, x, 1e-7);
          close(actual.y, y, 1e-7);
        }
      }
    }
  }
});

test('validation rejects missing or nonfinite inputs without mutating the caller', () => {
  const initial = {...Model.defaults};
  assert.deepEqual(Model.validate(initial), initial);
  Model.pose(initial); Model.reachability(initial); Model.solve(initial, 1);
  assert.deepEqual(initial, Model.defaults);
  for (const bad of [null, {}, {...initial, l1: 59}, {...initial, l2: Infinity},
    {...initial, shoulder: 181}, {...initial, elbow: -181}, {...initial, targetX: NaN},
    {...initial, targetY: 201}]) {
    assert.throws(() => Model.pose(bad));
  }
  assert.throws(() => Model.solve(initial, 0));
});
