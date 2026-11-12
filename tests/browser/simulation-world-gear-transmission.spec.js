const {test, expect} = require('@playwright/test');

test('首页与模拟目录可发现齿轮场景，分类不带学段进度', async ({page}) => {
  await page.goto('/');
  const category = page.locator('a.subject-card[data-subject-category="simulation-world"]');
  await expect(category).toHaveAttribute('href', 'simulation-world/index.html');
  await expect(category).toHaveAttribute('data-total', '5');
  await expect(category.locator('.subject-badge')).toHaveText('5 个模拟');
  await expect(category.locator('.subject-progress')).toHaveCount(0);

  await page.getByRole('combobox', {name: '学科', exact: true}).selectOption('simulation-world');
  await page.getByRole('searchbox', {name: '关键词'}).fill('齿轮');
  const result = page.locator('#site-results a[href="simulation-world/gear-transmission.html"]');
  await expect(result).toBeVisible();
  await expect(result).toContainText('齿轮传动模拟');
  await expect(result).toContainText('模拟世界');
  await page.getByRole('combobox', {name: '学段', exact: true}).selectOption('high');
  await expect(page.locator('#site-search-status')).toContainText('没有找到');

  await page.goto('/simulation-world/index.html');
  await expect(page.getByRole('heading', {name: '模拟世界'})).toBeVisible();
  await expect(page.locator('.topic-card')).toHaveCount(5);
  await expect(page.locator('.topic-card[href="gear-transmission.html"]')).toContainText('机械传动 · 工业应用');
  await expect(page.locator('.topic-card[href="gear-transmission.html"]')).toHaveAttribute('href', 'gear-transmission.html');
});

test('齿数比、转矩、效率与功率结果遵循同一传动模型', async ({page}) => {
  await page.goto('/simulation-world/gear-transmission.html');
  await expect(page.getByRole('heading', {name: '齿轮传动模拟'})).toBeVisible();
  await expect(page.locator('#output-rpm')).toHaveText('60.0');
  await expect(page.locator('#output-torque')).toHaveText('9.00');
  await expect(page.locator('#gear-canvas')).toHaveAttribute('aria-label', /输入齿轮 24 齿.*输出齿轮 24 齿/);

  await page.locator('#input-teeth').fill('12');
  await page.locator('#output-teeth').fill('48');
  await expect(page.locator('#output-rpm')).toHaveText('15.0');
  await expect(page.locator('#output-torque')).toHaveText('36.00');
  await expect(page.locator('#gear-canvas')).toHaveAttribute('aria-label', /输入齿轮 12 齿.*输出齿轮 48 齿/);

  await page.locator('#input-teeth').fill('48');
  await page.locator('#output-teeth').fill('12');
  await expect(page.locator('#output-rpm')).toHaveText('240.0');
  await expect(page.locator('#output-torque')).toHaveText('2.25');
  await page.locator('#efficiency').fill('50');
  await expect(page.locator('#output-torque')).toHaveText('1.25');

  const powers = await page.evaluate(() => ({
    input: Number(document.querySelector('#input-power').textContent),
    output: Number(document.querySelector('#output-power').textContent)
  }));
  expect(powers.input).toBe(62.8);
  expect(powers.output).toBe(31.4);
  expect(powers.output).toBeLessThanOrEqual(powers.input);
  await page.locator('#efficiency').fill('100');
  await expect(page.locator('#output-power')).toHaveText('62.8');
  await expect(page.locator('#output-power')).toHaveText(await page.locator('#input-power').textContent());
});

test('模拟可用按钮和键盘暂停、启动、处理零转速并重置', async ({page}) => {
  await page.goto('/simulation-world/gear-transmission.html');
  const toggle = page.locator('#toggle-motion');
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('#runtime-status')).toContainText('模拟已暂停');
  await toggle.focus();
  await page.keyboard.press('Enter');
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');

  await page.locator('#input-rpm').fill('0');
  await expect(page.locator('#output-rpm')).toHaveText('0.0');
  await expect(page.locator('#input-power')).toHaveText('0.0');
  await expect(page.locator('#output-power')).toHaveText('0.0');
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('#runtime-status')).toContainText('输入转速为 0');

  await page.locator('#input-rpm').fill('30');
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await toggle.focus();
  await page.keyboard.press('Space');
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#reset-model').click();
  await expect(page.locator('#input-rpm')).toHaveValue('60');
  await expect(page.locator('#input-teeth')).toHaveValue('24');
  await expect(page.locator('#output-teeth')).toHaveValue('24');
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
});

test('减少动态效果时默认暂停，仍可用键盘探索参数并主动启动', async ({page}) => {
  await page.emulateMedia({reducedMotion: 'reduce'});
  await page.goto('/simulation-world/gear-transmission.html');
  const toggle = page.locator('#toggle-motion');
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('#runtime-status')).toContainText('减少动态效果');
  const rpm = page.locator('#input-rpm');
  await rpm.focus();
  await page.keyboard.press('ArrowRight');
  await expect(rpm).toHaveValue('65');
  await expect(page.locator('#output-rpm')).toHaveText('65.0');
  await toggle.focus();
  await page.keyboard.press('Enter');
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
});

test('320px 视口保留控制、说明和画布文字替代且无横向溢出', async ({page}) => {
  await page.setViewportSize({width: 320, height: 844});
  await page.goto('/simulation-world/gear-transmission.html');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await expect(page.locator('#input-teeth')).toBeVisible();
  await expect(page.locator('#efficiency')).toBeVisible();
  await expect(page.locator('#toggle-motion')).toBeVisible();
  await expect(page.locator('#model-notes summary')).toBeVisible();
  await expect(page.locator('#gear-canvas')).toHaveAttribute('role', 'img');
  await page.locator('#model-notes summary').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#model-notes')).toHaveAttribute('open', '');
  await expect(page.locator('#model-notes')).toContainText('本模型不计算齿面接触');
});

test('二维画布不可用时结果和输入仍可用，不产生脚本错误', async ({page}) => {
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.addInitScript(() => {
    HTMLCanvasElement.prototype.getContext = function() { return null; };
  });
  await page.goto('/simulation-world/gear-transmission.html');
  await expect(page.locator('#runtime-status')).toContainText('二维画布不可用');
  await page.locator('#input-teeth').fill('12');
  await page.locator('#output-teeth').fill('48');
  await expect(page.locator('#output-rpm')).toHaveText('15.0');
  await expect(page.locator('#output-torque')).toHaveText('36.00');
  await page.locator('#toggle-motion').click();
  expect(pageErrors).toEqual([]);
});
