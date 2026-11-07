const {test, expect} = require('@playwright/test');
const {startReleaseServer} = require('./release-server');
const {execFileSync} = require('node:child_process');

let release, base;
test.beforeAll(async () => {
  if (process.env.KV_PUBLISHED_BASE_URL) {
    const url = new URL(process.env.KV_PUBLISHED_BASE_URL);
    const localHttp = url.protocol === 'http:' && ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname);
    if ((!localHttp && url.protocol !== 'https:') || url.username || url.password || url.search || url.hash)
      throw new Error('Published site URL must use HTTPS or loopback HTTP, without credentials, query or fragment');
    base = url.href.replace(/\/*$/, '/');
  } else {
    release = await startReleaseServer();
    base = release.base;
  }
});
test.afterAll(async () => { if (release) await release.close(); });

test('发布包子路径的首页搜索和四学科学习交互', async ({page}) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('response', response => { if (response.url().startsWith(base) && response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  await page.goto(base);
  const versionResponse = await page.request.get(base + 'release-version.json');
  expect(versionResponse.status()).toBe(200);
  const version = await versionResponse.json();
  expect(version).toEqual({
    schema_version: 1,
    revision: execFileSync('git', ['rev-parse', 'HEAD'], {encoding: 'utf8'}).trim(),
    site_files_modified: process.env.KV_PUBLISHED_BASE_URL ? false : expect.any(Boolean),
  });
  await page.getByRole('searchbox', {name: '关键词'}).fill('加法');
  await page.locator('#site-results a[href="math/topics/addition/index.html"]').click();
  await expect(page).toHaveURL(new URL('math/topics/addition/index.html', base).href);
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

test('发布站子路径的面积到体积路线可连续学习', async ({page}) => {
  const errors=[];
  page.on('pageerror', e => errors.push(e.message));
  page.on('response', response => { if (response.url().startsWith(base) && response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  await page.goto(base);
  await page.getByRole('link',{name:/数学 小学/}).click();
  await page.locator('#area-volume-path ol').getByRole('link',{name:/认识面积/}).click();
  for (const slug of ['understanding-area','area-and-perimeter','solid-shapes','surface-area','volume']) {
    await expect(page).toHaveURL(new URL(`math/topics/${slug}/index.html`,base).href);
    const nav=page.getByRole('navigation',{name:'从面积到体积学习路线'});
    if(slug !== 'volume') await nav.getByRole('link',{name:/下一步/}).click();
  }
  await page.locator('button[data-mode="explore"]').click();
  await page.locator('#layer-next').click(); await expect(page.locator('#layer-status')).toContainText('1 / 2 层');
  await page.getByRole('navigation',{name:'从面积到体积学习路线'}).getByRole('link',{name:'返回学习路线'}).click();
  await expect(page).toHaveURL(new URL('math/index.html#area-volume-path',base).href);
  await expect(page.locator('#area-volume-path')).toBeVisible();
  expect(errors).toEqual([]);
});
