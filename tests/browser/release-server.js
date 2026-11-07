const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const {execFileSync} = require('node:child_process');

async function startReleaseServer() {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'kv-publish-'));
  const root = path.join(temporary, 'knowledge-visual');
  let server;
  try {
    execFileSync('python3', ['scripts/build_site.py', '--output', root], {cwd: path.resolve(__dirname, '../..')});
    server = http.createServer((req, res) => {
      let pathname;
      try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); }
      catch { res.writeHead(400).end(); return; }
      if (!pathname.startsWith('/knowledge-visual/')) { res.writeHead(404).end(); return; }
      let file = path.resolve(root, '.' + pathname.slice('/knowledge-visual'.length));
      if (file !== root && !file.startsWith(root + path.sep)) { res.writeHead(404).end(); return; }
      try {
        if (fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
        const ext = path.extname(file);
        res.setHeader('Content-Type', {'.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.ico': 'image/x-icon'}[ext] || 'application/octet-stream');
        res.end(fs.readFileSync(file));
      } catch { res.writeHead(404).end(); }
    });
    await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
    const origin = `http://127.0.0.1:${server.address().port}`;
    return {base: `${origin}/knowledge-visual/`, origin, async close() {
      await new Promise(resolve => server.close(resolve));
      fs.rmSync(temporary, {recursive: true, force: true});
    }};
  } catch (error) {
    if (server && server.listening) await new Promise(resolve => server.close(resolve));
    fs.rmSync(temporary, {recursive: true, force: true});
    throw error;
  }
}
module.exports = {startReleaseServer};
