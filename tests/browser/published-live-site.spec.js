const {test, expect} = require('@playwright/test');

const baseValue = process.env.KV_PUBLISHED_BASE_URL;
const expectedRevision = process.env.GITHUB_SHA;

test('公网发布版本、万有引力及计算机和人工智能交互可用', async ({page}) => {
  expect(baseValue, '发布验收需指定 KV_PUBLISHED_BASE_URL').toBeTruthy();
  expect(expectedRevision, '发布验收需指定 GITHUB_SHA').toMatch(/^[a-f0-9]{40}$/);

  const base = new URL(baseValue);
  const loopbackHttp = base.protocol === 'http:' && ['127.0.0.1', 'localhost', '[::1]'].includes(base.hostname);
  expect(loopbackHttp || base.protocol === 'https:').toBe(true);
  expect(base.username || base.password || base.search || base.hash).toBeFalsy();
  base.pathname = base.pathname.replace(/\/*$/, '/')

  const failures = [];
  page.on('pageerror', error => failures.push(`未捕获异常：${error.message}`));
  page.on('response', response => {
    if (response.url().startsWith(base.href) && response.status() >= 400)
      failures.push(`HTTP ${response.status()}: ${response.url()}`);
  });

  const manifestUrl = new URL('release-version.json', base);
  const manifestResponse = await page.request.get(manifestUrl.href, {
    headers: {'Cache-Control': 'no-cache'},
    timeout: 20000,
  });
  expect(manifestResponse.status()).toBe(200);
  expect(await manifestResponse.json()).toEqual({
    schema_version: 1,
    revision: expectedRevision,
    site_files_modified: false,
  });

  const topicUrl = new URL('physics/high/gravitation.html', base);
  topicUrl.searchParams.set('verify', expectedRevision);
  await page.goto(topicUrl.href, {waitUntil: 'domcontentloaded', timeout: 30000});
  await expect(page).toHaveTitle(/万有引力/);
  await expect(page.getByRole('tab')).toHaveCount(4);
  await expect(page.locator('#cvLaw')).toBeVisible();

  await page.getByRole('tab', {name: '卫星轨道'}).click();
  await page.locator('#orbitPresetMoon').click();
  await expect(page.locator('#sH')).toHaveValue('378029');
  await expect(page.locator('#orbitDistanceInfo')).toContainText('384,400 km');

  await page.getByRole('tab', {name: '宇宙速度'}).click();
  const velocity = page.locator('#sVel');
  await velocity.evaluate(input => {
    input.value = '7.70';
    input.dispatchEvent(new Event('input', {bubbles: true}));
  });
  await expect(page.locator('#velInfo')).toHaveAttribute('data-trajectory', 'impact');

  await page.goto(new URL('', base).href, {waitUntil: 'domcontentloaded'});
  await page.getByRole('combobox', {name: '学科', exact: true}).selectOption('computer');
  await page.getByRole('combobox', {name: '学段', exact: true}).selectOption('primary');
  await page.getByRole('searchbox', {name: '关键词'}).fill('算法');
  await page.locator('#site-results a[href="computer/primary/robot-algorithms.html"]').click();
  await expect(page).toHaveURL(/computer\/primary\/robot-algorithms\.html/);
  await page.getByRole('button', {name: '运行指令'}).click();
  await expect(page.locator('#robot-status')).toContainText('抵达目标', {timeout: 5000});
  await page.goto(new URL('', base).href, {waitUntil: 'domcontentloaded'});
  await page.getByRole('combobox', {name: '学科', exact: true}).selectOption('ai');
  await page.getByRole('combobox', {name: '学段', exact: true}).selectOption('high');
  await page.getByRole('searchbox', {name: '关键词'}).fill('分类边界');
  await page.locator('#site-results a[href="ai/high/classifier-lab.html"]').click();
  await expect(page).toHaveURL(/ai\/high\/classifier-lab\.html/);
  const threshold = page.locator('#threshold');
  await threshold.focus();
  for (let i = 0; i < 4; i++) await threshold.press('ArrowLeft');
  await page.getByRole('button', {name: '重新评估样本'}).click();
  await expect(page.locator('#accuracy-output')).toHaveText('87.5%');
  await page.goto(new URL('', base).href, {waitUntil: 'domcontentloaded'});
  await page.getByRole('combobox', {name: '学科', exact: true}).selectOption('ai');
  await page.getByRole('combobox', {name: '学段', exact: true}).selectOption('high');
  await page.getByRole('searchbox', {name: '关键词'}).fill('训练集');
  await page.locator('#site-results a[href="ai/high/train-test-generalization.html"]').click();
  await expect(page).toHaveURL(/ai\/high\/train-test-generalization\.html/);
  await page.getByRole('button', {name: '查看留出测试结果'}).click();
  await expect(page.locator('#test-accuracy')).toHaveText('50%');
  await page.getByRole('slider', {name: /分类阈值/}).focus();
  await page.getByRole('slider', {name: /分类阈值/}).press('ArrowLeft');
  await expect(page.locator('#test-accuracy')).toHaveText('75%');
  await expect(page.locator('#test-warning')).toBeVisible();
  await page.goto(new URL('', base).href, {waitUntil: 'domcontentloaded'});
  await page.getByRole('combobox', {name: '学科', exact: true}).selectOption('ai');
  await page.getByRole('combobox', {name: '学段', exact: true}).selectOption('primary');
  await page.getByRole('searchbox', {name: '关键词'}).fill('线索分类');
  await page.locator('#site-results a[href="ai/primary/feature-classification-lab.html"]').click();
  await expect(page).toHaveURL(/ai\/primary\/feature-classification-lab\.html/);
  await page.getByRole('button', {name: '查看真实标签'}).click();
  await expect(page.locator('#test-summary')).toContainText('预测正确 2/4');
  await page.locator('#feature-color').focus();
  await page.locator('#feature-color').press('ArrowRight');
  await expect(page.locator('#test-summary')).toContainText('预测正确 4/4');
  await expect(page.locator('#seen-warning')).toBeVisible();
  expect(failures).toEqual([]);
});
