const {test} = require('node:test');
const assert = require('node:assert/strict');
const Model = require('../computer/high/assets/network-assembly-model.js');

test('the starter topology identifies the broken WAN path without changing configuration', () => {
  const config = Model.defaultConfig();
  const before = structuredClone(config);
  const result = Model.inspect(config);
  assert.equal(result.allReachable, false);
  assert.equal(result.clients.desktop.failedLink, 'wan');
  assert.equal(result.clients.laptop.failedLink, 'wan');
  assert.deepEqual(config, before);
});

test('connected Wi-Fi topology predicts shared backbone and Wi-Fi bottlenecks', () => {
  const config = Model.defaultConfig();
  config.connected.wan = true;
  const result = Model.simulate(config);
  assert.equal(result.allReachable, true);
  assert.deepEqual(result.activeClients, ['desktop', 'laptop']);
  assert.equal(result.sharing.wan.shareMbps, 6);
  assert.equal(result.clients.desktop.throughputMbps, 6);
  assert.deepEqual(result.clients.desktop.bottlenecks, ['wan', 'core']);
  assert.equal(result.clients.laptop.throughputMbps, 4);
  assert.deepEqual(result.clients.laptop.bottlenecks, ['wifi']);
  assert.equal(result.clients.laptop.seconds, 24);
});

test('a wired laptop shares the same backbone and uses its own access link', () => {
  const config = Model.defaultConfig();
  config.connected.wan = true;
  config.laptopAccess = 'wired';
  const result = Model.simulate(config);
  assert.equal(result.clients.laptop.throughputMbps, 6);
  assert.deepEqual(result.clients.laptop.bottlenecks, ['wan', 'core']);
  assert.equal(result.clients.laptop.seconds, 16);
  assert.equal(result.sharing.ap.activeFlows, 0);
});

test('a disconnected access point makes Wi-Fi laptop inactive but leaves wired desktop active', () => {
  const config = Model.defaultConfig();
  config.connected.wan = true;
  config.connected.ap = false;
  const result = Model.simulate(config);
  assert.deepEqual(result.activeClients, ['desktop']);
  assert.equal(result.clients.laptop.reachable, false);
  assert.equal(result.clients.laptop.throughputMbps, null);
  assert.equal(result.sharing.wan.shareMbps, 12);
  assert.equal(result.clients.desktop.throughputMbps, 8);
});

test('link rate changes move the bottleneck and recompute throughput and transfer time', () => {
  const config = Model.defaultConfig();
  config.connected.wan = true;
  config.capacity.wifi = 2;
  const result = Model.simulate(config);
  assert.equal(result.clients.laptop.throughputMbps, 2);
  assert.deepEqual(result.clients.laptop.bottlenecks, ['wifi']);
  assert.equal(result.clients.laptop.seconds, 48);
});

test('unsupported connections, rates, access modes and file sizes are rejected', () => {
  const config = Model.defaultConfig();
  config.connected.wan = 'yes';
  assert.throws(() => Model.inspect(config), RangeError);
  config.connected.wan = true;
  config.capacity.wifi = 3;
  assert.throws(() => Model.simulate(config), RangeError);
  config.capacity.wifi = 4;
  config.laptopAccess = 'cellular';
  assert.throws(() => Model.inspect(config), RangeError);
  config.laptopAccess = 'wifi';
  assert.throws(() => Model.simulate(config, 0), RangeError);
  assert.throws(() => Model.simulate(config, 101), RangeError);
});
