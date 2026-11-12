const assert = require('node:assert/strict');
const test = require('node:test');
const Model = require('../computer/middle/assets/network-path-model.js');

function exhaustive(disabled, rule) {
  const paths = [];
  function visit(node, nodes, edges, cost) {
    if (node === 'D') {
      paths.push({nodes, edges, cost, hops: edges.length, firstHop: nodes[1]});
      return;
    }
    for (const edge of Model.EDGES) {
      if (disabled.includes(edge.id)) continue;
      const other = edge.from === node ? edge.to : edge.to === node ? edge.from : null;
      if (other && !nodes.includes(other)) visit(other, [...nodes, other], [...edges, edge.id], cost + edge.cost);
    }
  }
  visit('S', ['S'], [], 0);
  paths.sort((a, b) => {
    if (rule === 'cost') return a.cost - b.cost || a.hops - b.hops || a.nodes.join('').localeCompare(b.nodes.join(''), 'en');
    return a.hops - b.hops || a.cost - b.cost || a.nodes.join('').localeCompare(b.nodes.join(''), 'en');
  });
  return paths[0] || null;
}

test('named conditions distinguish low cost, fewer hops, alternate path and disconnection', () => {
  assert.deepEqual(Model.findPath(Model.SCENARIOS.normal, 'cost'), {nodes: ['S','B','C','D'], edges: ['SB','BC','CD'], cost: 4, hops: 3, firstHop: 'B'});
  assert.deepEqual(Model.findPath(Model.SCENARIOS.normal, 'hops'), {nodes: ['S','A','D'], edges: ['SA','AD'], cost: 8, hops: 2, firstHop: 'A'});
  assert.deepEqual(Model.findPath(Model.SCENARIOS.bc, 'cost'), {nodes: ['S','A','C','D'], edges: ['SA','AC','CD'], cost: 7, hops: 3, firstHop: 'A'});
  assert.deepEqual(Model.findPath(Model.SCENARIOS['bc-ac'], 'cost'), {nodes: ['S','A','D'], edges: ['SA','AD'], cost: 8, hops: 2, firstHop: 'A'});
  assert.equal(Model.findPath(Model.SCENARIOS.exits, 'cost'), null);
});

test('all 64 link combinations under both rules match independent simple-path enumeration', () => {
  const ids = Model.EDGES.map(edge => edge.id);
  for (let bits = 0; bits < 64; bits++) {
    const disabled = ids.filter((_, index) => bits & (1 << index));
    for (const rule of Model.RULES) assert.deepEqual(Model.findPath(disabled, rule), exhaustive(disabled, rule), `${bits} ${rule}`);
  }
});

test('invalid rules and links fail instead of silently changing the scenario', () => {
  assert.throws(() => Model.findPath('BC', 'cost'), RangeError);
  assert.throws(() => Model.findPath(['BC', 'BC'], 'cost'), RangeError);
  assert.throws(() => Model.findPath(['XY'], 'cost'), RangeError);
  assert.throws(() => Model.findPath([], 'latency'), RangeError);
  assert.deepEqual(Model.SCENARIOS.normal, []);
});
