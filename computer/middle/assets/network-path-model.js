(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.NetworkPathModel = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  const EDGES = Object.freeze([
    Object.freeze({id: 'SA', from: 'S', to: 'A', cost: 3}),
    Object.freeze({id: 'AD', from: 'A', to: 'D', cost: 5}),
    Object.freeze({id: 'SB', from: 'S', to: 'B', cost: 1}),
    Object.freeze({id: 'BC', from: 'B', to: 'C', cost: 1}),
    Object.freeze({id: 'CD', from: 'C', to: 'D', cost: 2}),
    Object.freeze({id: 'AC', from: 'A', to: 'C', cost: 2})
  ]);
  const SCENARIOS = Object.freeze({
    normal: Object.freeze([]),
    bc: Object.freeze(['BC']),
    'bc-ac': Object.freeze(['BC', 'AC']),
    exits: Object.freeze(['AD', 'CD'])
  });
  const RULES = Object.freeze(['cost', 'hops']);

  function compare(a, b, rule) {
    const primary = rule === 'cost' ? a.cost - b.cost : a.hops - b.hops;
    const secondary = rule === 'cost' ? a.hops - b.hops : a.cost - b.cost;
    return primary || secondary || a.nodes.join('').localeCompare(b.nodes.join(''), 'en');
  }

  function findPath(disabled = [], rule = 'cost') {
    if (!Array.isArray(disabled) || !RULES.includes(rule)) throw new RangeError('Unsupported route conditions');
    const ids = EDGES.map(edge => edge.id);
    if (new Set(disabled).size !== disabled.length || disabled.some(id => !ids.includes(id))) {
      throw new RangeError('Unsupported disabled link');
    }
    const blocked = new Set(disabled);
    const start = {node: 'S', nodes: ['S'], edges: [], cost: 0, hops: 0};
    const best = new Map([['S', start]]);
    const frontier = [start];
    while (frontier.length) {
      frontier.sort((a, b) => compare(a, b, rule));
      const current = frontier.shift();
      if (best.get(current.node) !== current) continue;
      if (current.node === 'D') {
        return {
          nodes: current.nodes,
          edges: current.edges,
          cost: current.cost,
          hops: current.hops,
          firstHop: current.nodes[1]
        };
      }
      for (const edge of EDGES) {
        if (blocked.has(edge.id)) continue;
        const nextNode = edge.from === current.node ? edge.to : edge.to === current.node ? edge.from : null;
        if (!nextNode) continue;
        const next = {
          node: nextNode,
          nodes: [...current.nodes, nextNode],
          edges: [...current.edges, edge.id],
          cost: current.cost + edge.cost,
          hops: current.hops + 1
        };
        if (!best.has(nextNode) || compare(next, best.get(nextNode), rule) < 0) {
          best.set(nextNode, next);
          frontier.push(next);
        }
      }
    }
    return null;
  }

  return {EDGES, SCENARIOS, RULES, findPath};
});
