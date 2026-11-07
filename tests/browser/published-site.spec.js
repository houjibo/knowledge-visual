const {test, expect} = require('@playwright/test');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const {execFileSync} = require('node:child_process');

let temporary, server, base;
test.beforeAll(async () => {
  temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'kv-publish-'));
  const root = path.join(temporary, 'knowledge-visual');
  execFileSync('python3', ['scripts/build_site.py', '--output', root], {cwd: path.resolve(__dirname, '../..')});
  server = http.createServer((req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (!pathname.startsWith('/knowledge-visual/')) { res.writeHead(404).end(); return; }
    let file = path.resolve(root, '.' + pathname.slice('/knowledge-visual'.length));
    if (file !== root && !file.startsWith(root + path.sep)) { res.writeHead(404).end(); return; }
    try {
      if (fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
      const ext = path.extname(file);
      res.setHeader('Content-Type', {'.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.ico': 'image/x-icon'}[ext] || 'application/octet-stream');
      res.end(fs.readFileSync(file));
    } catch { res.writeHead(404).end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}/knowledge-visual/`;
});
test.afterAll(async () => {
  if (server) await new Promise(resolve => server.close(resolve));
  if (temporary) fs.rmSync(temporary, {recursive: true, force: true});
});

test('发布包子路径的首页搜索和四学科学习交互', async ({page}) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('response', response => { if (response.url().startsWith(base) && response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  await page.goto(base);
  await page.getByRole('searchbox', {name: '关键词'}).fill('加法');
  await page.locator('#site-results a[href="math/topics/addition/index.html"]').click();
  await expect(page).toHaveURL(/knowledge-visual\/math\/topics\/addition\/index\.html$/);
  await page.getByRole('button', {name: '✏️ 练习'}).click();
  await expect(page.locator('#practice-problem')).toBeVisible();
  await page.goto(base);
  await page.getByRole('link', {name: /物理 初中/}).click();
  await page.getByRole('link', {name: /初中物理/}).click();
  await page.getByRole('link', {name: /机械运动/}).click();
  await page.locator('#btnStart').click();
  await expect.poll(async () => parseFloat(await page.locator('#dispDist').textContent())).toBeGreaterThan(0);
  await page.goto(base);
  await page.getByRole('link', {name: /化学 初中/}).click();
  await page.getByRole('link', {name: /高中化学/}).click();
  await page.getByRole('link', {name: /物质的量/}).click();
  await page.getByRole('button', {name: 'CO₂ (44)'}).click();
  await expect(page.getByText('88.0 g')).toBeVisible();
  await page.goto(base);
  await page.getByRole('link', {name: /科学 小学科学/}).click();
  await page.getByRole('link', {name: /沉与浮/}).click();
  await page.getByRole('button', {name: '🔩 铁块'}).click();
  await expect(page.locator('#infoState')).toContainText('下沉');
  expect((await page.request.get(base + 'README.md')).status()).toBe(404);
  expect(errors).toEqual([]);
});
