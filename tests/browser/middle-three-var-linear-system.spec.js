const {test, expect} = require('@playwright/test');
const {resolve} = require('node:path');
const {pathToFileURL} = require('node:url');
const {startReleaseServer} = require('./release-server');

const publishedBase = process.env.KV_PUBLISHED_BASE_URL?.replace(/\/?$/, '/') || '';
const siteRoot = publishedBase || '/';
const topic = publishedBase
  ? new URL('math/middle/three-var-linear-system.html', publishedBase).href
  : '/math/middle/three-var-linear-system.html';

test('学习模式展示消元步骤并标注选学', async ({page}) => {
  await page.goto(topic);
  await expect(page).toHaveTitle(/三元一次方程组/);
  await expect(page.locator('.optional-badge')).toContainText('选学');
  await expect(page.locator('#learn-steps li')).toHaveCount(3);
  await expect(page.locator('#learn-steps')).toContainText('消元');
  await expect(page.locator('a[href="linear-equations-2var.html"]')).toBeVisible();
});

test('求解模式校验整数解并拒绝错误和非法输入', async ({page}) => {
  await page.goto(topic);
  await page.getByRole('button', {name: '🧪 求解'}).click();
  await expect(page.locator('.practice-item')).toHaveCount(3);

  // wrong answer
  await page.fill('#case-1-x', '9'); await page.fill('#case-1-y', '2'); await page.fill('#case-1-z', '3');
  await page.click('[data-check="case-1"]');
  await expect(page.locator('#fb-case-1')).toHaveClass(/wrong/);

  // invalid (empty / non-integer)
  await page.fill('#case-1-x', '');
  await page.click('[data-check="case-1"]');
  await expect(page.locator('#fb-case-1')).toHaveClass(/invalid/);
  await expect(page.locator('#fb-case-1')).toContainText('整数');

  // all three cases correct
  const solutions = {
    'case-1': {x: '1', y: '2', z: '3'},
    'case-2': {x: '2', y: '-1', z: '1'},
    'case-3': {x: '3', y: '1', z: '2'}
  };
  for (const [id, sol] of Object.entries(solutions)) {
    await page.fill(`#${id}-x`, sol.x);
    await page.fill(`#${id}-y`, sol.y);
    await page.fill(`#${id}-z`, sol.z);
    await page.click(`[data-check="${id}"]`);
    await expect(page.locator(`#fb-${id}`)).toHaveClass(/correct/);
  }
});

test('测验模式可作答并给出反馈', async ({page}) => {
  await page.goto(topic);
  await page.getByRole('button', {name: '🎯 测验'}).click();
  await page.click('#quizStart');
  await expect(page.locator('#quizQ')).toBeVisible();
  await expect(page.locator('.quiz-opt')).toHaveCount(4);
  await page.locator('.quiz-opt').first().click();
  await expect(page.locator('#quizFb')).toContainText(/正确|不正确/);
  await expect(page.locator('#quizNext')).toBeEnabled();
});

test('320px 键盘求解无横向溢出', async ({page}) => {
  await page.setViewportSize({width: 320, height: 760});
  await page.emulateMedia({reducedMotion: 'reduce'});
  await page.goto(topic);
  await page.getByRole('button', {name: '🧪 求解'}).click();
  await page.locator('#case-1-x').focus();
  await page.keyboard.type('1');
  await expect(page.locator('#case-1-x')).toHaveValue('1');
  expect(await page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(await page.evaluate(() => document.documentElement.clientWidth));
});

test('直接文件与发布子路径均可离线加载', async ({page}) => {
  test.skip(!!publishedBase, '公网专项不打开本机文件或临时发布服务器');
  const remoteRequests = [], errors = [];
  page.on('request', request => {
    if (!/^https?:/.test(request.url())) return;
    const host = new URL(request.url()).hostname;
    if (!['127.0.0.1', 'localhost', '::1'].includes(host)) remoteRequests.push(request.url());
  });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(pathToFileURL(resolve(__dirname, '../../math/middle/three-var-linear-system.html')).href);
  await expect(page.getByRole('heading', {name: '三元一次方程组'})).toBeVisible();
  expect(remoteRequests).toEqual([]);

  const release = await startReleaseServer();
  try {
    const response = await page.goto(new URL('math/middle/three-var-linear-system.html', release.base).href);
    expect(response.status()).toBe(200);
  } finally { await release.close(); }
  expect(errors).toEqual([]);
});
