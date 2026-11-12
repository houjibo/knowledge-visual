const assert = require('node:assert/strict');
const {once} = require('node:events');
const net = require('node:net');
const {test} = require('node:test');
const {startReleaseServer} = require('./browser/release-server');

test('temporary release server closes a partially active browser connection', async () => {
  const release = await startReleaseServer();
  const socket = net.connect(Number(new URL(release.origin).port), '127.0.0.1');
  socket.on('error', () => {});
  let closing;
  try {
    await once(socket, 'connect');
    socket.write('GET /knowledge-visual/index.html HTTP/1.1\r\nHost: localhost\r\n');
    await new Promise(resolve => setTimeout(resolve, 20));
    closing = release.close();
    let timeout;
    const closedPromptly = await Promise.race([
      closing.then(() => true),
      new Promise(resolve => { timeout = setTimeout(() => resolve(false), 2000); }),
    ]);
    clearTimeout(timeout);
    socket.destroy();
    await closing;
    assert.equal(closedPromptly, true, 'server.close() waited for an active request');
  } finally {
    socket.destroy();
    if (!closing) await release.close();
  }
});
