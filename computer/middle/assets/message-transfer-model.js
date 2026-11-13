(function (root, factory) {
  const model = factory();
  if (typeof module === 'object' && module.exports) module.exports = model;
  else root.MessageTransferModel = model;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const MESSAGES = Object.freeze({ascii: 'AI!', chinese: '你好'});
  const MODES = Object.freeze(['ordered', 'reversed', 'missing']);

  function encode(key) {
    if (!Object.prototype.hasOwnProperty.call(MESSAGES, key)) throw new Error('unknown message');
    const bytes = Array.from(new TextEncoder().encode(MESSAGES[key]));
    const packets = [];
    for (let offset = 0; offset < bytes.length; offset += 2) {
      packets.push({number: packets.length + 1, bytes: bytes.slice(offset, offset + 2)});
    }
    return {message: MESSAGES[key], bytes, packets};
  }

  function deliveryOrder(mode, count) {
    if (!MODES.includes(mode) || !Number.isInteger(count) || count < 2) throw new Error('invalid delivery');
    const ids = Array.from({length: count}, (_, i) => i + 1);
    if (mode === 'reversed') return ids.reverse();
    if (mode === 'missing') return ids.filter(id => id !== 2);
    return ids;
  }

  function receive(packets, arrivals) {
    if (!Array.isArray(packets) || !Array.isArray(arrivals)) throw new Error('invalid input');
    const byNumber = new Map(packets.map(packet => [packet.number, packet]));
    if (byNumber.size !== packets.length || packets.some((packet, index) => packet.number !== index + 1)) {
      throw new Error('invalid packets');
    }
    const received = new Set();
    for (const number of arrivals) {
      if (!byNumber.has(number) || received.has(number)) throw new Error('invalid arrival');
      received.add(number);
    }
    const missing = packets.map(packet => packet.number).filter(number => !received.has(number));
    if (missing.length) return {complete: false, missing, text: null};
    const bytes = Uint8Array.from(packets.flatMap(packet => packet.bytes));
    return {complete: true, missing: [], text: new TextDecoder('utf-8', {fatal: true}).decode(bytes)};
  }

  return {MESSAGES, MODES, encode, deliveryOrder, receive};
});
