const assert = require('node:assert/strict');
const test = require('node:test');
const Model = require('../computer/middle/assets/message-transfer-model.js');

test('real UTF-8 bytes are split without corrupting the original message', () => {
  assert.deepEqual(Model.encode('ascii'), {
    message: 'AI!', bytes: [0x41, 0x49, 0x21],
    packets: [{number: 1, bytes: [0x41, 0x49]}, {number: 2, bytes: [0x21]}],
  });
  assert.deepEqual(Model.encode('chinese'), {
    message: '你好', bytes: [0xE4, 0xBD, 0xA0, 0xE5, 0xA5, 0xBD],
    packets: [
      {number: 1, bytes: [0xE4, 0xBD]},
      {number: 2, bytes: [0xA0, 0xE5]},
      {number: 3, bytes: [0xA5, 0xBD]},
    ],
  });
});

test('order, reverse order, missing second block and retry have distinct outcomes', () => {
  for (const key of Object.keys(Model.MESSAGES)) {
    const {message, packets} = Model.encode(key);
    for (const mode of ['ordered', 'reversed']) {
      const arrivals = Model.deliveryOrder(mode, packets.length);
      assert.equal(Model.receive(packets, arrivals.slice(0, -1)).complete, false);
      assert.deepEqual(Model.receive(packets, arrivals), {complete: true, missing: [], text: message});
    }
    const initial = Model.deliveryOrder('missing', packets.length);
    assert.deepEqual(Model.receive(packets, initial), {complete: false, missing: [2], text: null});
    assert.equal(Model.receive(packets, [...initial, 2]).text, message);
  }
});

test('invalid blocks, arrivals and modes are rejected', () => {
  const {packets} = Model.encode('ascii');
  assert.throws(() => Model.encode('unknown'));
  assert.throws(() => Model.deliveryOrder('unknown', 2));
  assert.throws(() => Model.receive(packets, [1, 1]));
  assert.throws(() => Model.receive(packets, [3]));
  assert.throws(() => Model.receive([packets[1], packets[0]], [1, 2]));
});
