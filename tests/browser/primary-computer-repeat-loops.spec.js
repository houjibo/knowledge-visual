const {test, expect} = require('@playwright/test');
const {resolve} = require('node:path');
const {pathToFileURL} = require('node:url');

const topic = process.env.KV_PUBLISHED_BASE_URL
  ? new URL('computer/primary/repeat-loops.html', process.env.KV_PUBLISHED_BASE_URL.replace(/\/?$/, '/')).href
  : '/computer/primary/repeat-loops.html';
const progressKey = 'kv-computer-primary-progress';

async function execute(page, count) {
  for (let i = 0; i < count; i++) await page.locator('#step-button').click();
}

async function expectPosition(page, column, row) {
  await expect(page.locator('#robot-grid')).toHaveAttribute('data-column', String(column));
  await expect(page.locator('#robot-grid')).toHaveAttribute('data-row', String(row));
}

test('循环展开与每一步坐标、轮次和两种程序标记一致', async ({page}) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(topic);
  expect(await page.locator('#repeat-count option').evaluateAll(options => options.map(option => option.value))).toEqual(['1', '2', '3', '4']);
  await expect(page.locator('#body-first')).toHaveValue('right');
  await expect(page.locator('#body-second')).toHaveValue('up');
  await expect(page.locator('#expanded-commands li')).toHaveCount(4);
  await expect(page.locator('[aria-current="step"]')).toHaveCount(0);
  await page.locator('#repeat-count').selectOption('3');
  await expect(page.locator('#loop-body li')).toHaveCount(2);
  await expect(page.locator('#expanded-commands li')).toHaveCount(6);
  await expect(page.locator('#loop-summary')).toContainText('6');
  await expect(page.locator('#comparison-note')).toBeVisible();
  const positions = [[2,5], [2,4], [3,4], [3,3], [4,3], [4,2]];
  for (const [index, [column, row]] of positions.entries()) {
    const expanded = page.locator('#expanded-commands li').nth(index);
    await expect(expanded).toContainText(index % 2 ? '向上' : '向右');
    await page.locator('#step-button').click();
    await expectPosition(page, column, row);
    await expect(page.locator('#execution-count')).toHaveText(`${index + 1}/6`);
    await expect(expanded).toHaveAttribute('aria-current', 'step');
    await expect(page.locator('#expanded-commands [aria-current="step"]')).toHaveCount(1);
    await expect(page.locator('#loop-body [aria-current="step"]')).toHaveAttribute('data-body-index', String(index % 2 + 1));
    await expect(page.locator('#round-status')).toContainText(`第 ${Math.floor(index / 2) + 1}/3 轮`);
    await expect(page.locator('#round-status')).toContainText(`轮内位置 ${index % 2 + 1}/2`);
  }
  await expect(page.locator('#run-status')).toHaveClass(/success/);
  await expect(page.locator('#step-button')).toBeDisabled();
  await expect(page.locator('#run-button')).toBeDisabled();
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), progressKey)).toEqual({'repeat-loops': true});
  expect(errors).toEqual([]);
});

test('两次未抵达，四次经过目标时也不会提前完成', async ({page}) => {
  await page.goto(topic);
  await execute(page, 4);
  await expectPosition(page, 3, 3);
  await expect(page.locator('#execution-count')).toHaveText('4/4');
  await expect(page.locator('#run-status')).toHaveClass(/error/);
  expect(await page.evaluate(key => localStorage.getItem(key), progressKey)).toBeNull();

  await page.locator('#repeat-count').selectOption('4');
  await execute(page, 6);
  await expectPosition(page, 4, 2);
  await expect(page.locator('#execution-count')).toHaveText('6/8');
  await expect(page.locator('#step-button')).toBeEnabled();
  expect(await page.evaluate(key => localStorage.getItem(key), progressKey)).toBeNull();
  await execute(page, 2);
  await expectPosition(page, 5, 1);
  await expect(page.locator('#execution-count')).toHaveText('8/8');
  await expect(page.locator('#run-status')).toHaveClass(/error/);
  expect(await page.evaluate(key => localStorage.getItem(key), progressKey)).toBeNull();
});

test('碰墙和越界计为已执行但不移动，并给出可读原因', async ({page}) => {
  await page.goto(topic);
  await page.locator('#body-first').selectOption('up');
  await page.locator('#step-button').click();
  await expectPosition(page, 1, 5);
  await expect(page.locator('#execution-count')).toHaveText('1/4');
  await expect(page.locator('#run-status')).toContainText('墙');
  await page.locator('#repeat-count').selectOption('1');
  await page.locator('#body-first').selectOption('down');
  await page.locator('#body-second').selectOption('left');
  await page.locator('#step-button').click();
  await expectPosition(page, 1, 5);
  await expect(page.locator('#execution-count')).toHaveText('1/2');
  await expect(page.locator('#run-status')).toContainText('边界');
  await page.locator('#step-button').click();
  await expectPosition(page, 1, 5);
  await expect(page.locator('#execution-count')).toHaveText('2/2');
  await expect(page.locator('#run-status')).toHaveClass(/error/);
  expect(await page.evaluate(key => localStorage.getItem(key), progressKey)).toBeNull();
});

test('连续运行可暂停和恢复，同一时间只有一条执行流', async ({page}) => {
  await page.goto(topic);
  await page.locator('#repeat-count').selectOption('4');
  await expect(page.locator('#pause-button')).toBeDisabled();
  await page.locator('#run-button').click();
  await expect(page.locator('#run-button')).toBeDisabled();
  await expect(page.locator('#step-button')).toBeDisabled();
  await expect.poll(async () => parseInt(await page.locator('#execution-count').textContent(), 10)).toBeGreaterThan(0);
  await page.locator('#pause-button').click();
  const pausedCount = await page.locator('#execution-count').textContent();
  const pausedPosition = await page.locator('#robot-grid').getAttribute('aria-label');
  await page.waitForTimeout(800);
  await expect(page.locator('#execution-count')).toHaveText(pausedCount);
  await expect(page.locator('#robot-grid')).toHaveAttribute('aria-label', pausedPosition);
  await expect(page.locator('#run-button')).toBeEnabled();
  await page.locator('#run-button').click();
  await expect(page.locator('#execution-count')).toHaveText('8/8', {timeout: 10000});
  await expectPosition(page, 5, 1);
  await expect(page.locator('#pause-button')).toBeDisabled();
  expect(await page.evaluate(key => localStorage.getItem(key), progressKey)).toBeNull();
});

test('三个程序参数在运行中修改均停止旧计时器并回到起点', async ({page}) => {
  await page.goto(topic);
  for (const [selector, value, total] of [
    ['#repeat-count', '3', 6],
    ['#body-first', 'left', 4],
    ['#body-second', 'down', 4],
  ]) {
    await page.locator('#example-button').click();
    await page.locator('#run-button').click();
    await expect.poll(async () => parseInt(await page.locator('#execution-count').textContent(), 10)).toBeGreaterThan(0);
    await page.locator(selector).selectOption(value);
    await expectPosition(page, 1, 5);
    await expect(page.locator('#execution-count')).toHaveText(`0/${total}`);
    await expect(page.locator('#expanded-commands li')).toHaveCount(total);
    await expect(page.locator('#pause-button')).toBeDisabled();
    await expect(page.locator('#run-button')).toBeEnabled();
    await page.waitForTimeout(800);
    await expect(page.locator('#execution-count')).toHaveText(`0/${total}`);
  }
});

test('离开并返回页面不会让旧计时器在后台继续执行', async ({page}) => {
  await page.goto(topic);
  await page.locator('#repeat-count').selectOption('4');
  await page.locator('#run-button').click();
  await expect.poll(async () => parseInt(await page.locator('#execution-count').textContent(), 10)).toBeGreaterThan(0);
  await page.locator('.footer-nav a[href="index.html"]').click();
  await page.goBack();
  await expect(page.locator('#pause-button')).toBeDisabled();
  await expect(page.locator('#run-button')).toBeEnabled();
  const returnedCount = await page.locator('#execution-count').textContent();
  await page.waitForTimeout(800);
  await expect(page.locator('#execution-count')).toHaveText(returnedCount);
  await expect(page.locator('#run-status')).not.toContainText('连续运行中');
});

test('回到起点保留编辑参数，恢复示例还原程序，历史完成保留', async ({page}) => {
  const previous = {'robot-algorithms': true, 'repeat-loops': true};
  await page.addInitScript(({key, value}) => localStorage.setItem(key, JSON.stringify(value)), {key: progressKey, value: previous});
  await page.goto(topic);
  await page.locator('#repeat-count').selectOption('3');
  await page.locator('#body-first').selectOption('down');
  await page.locator('#step-button').click();
  await page.locator('#reset-button').click();
  await expect(page.locator('#repeat-count')).toHaveValue('3');
  await expect(page.locator('#body-first')).toHaveValue('down');
  await expect(page.locator('#execution-count')).toHaveText('0/6');
  await expectPosition(page, 1, 5);
  await page.locator('#example-button').click();
  await expect(page.locator('#repeat-count')).toHaveValue('2');
  await expect(page.locator('#body-first')).toHaveValue('right');
  await expect(page.locator('#body-second')).toHaveValue('up');
  await expect(page.locator('#execution-count')).toHaveText('0/4');
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), progressKey)).toEqual(previous);
});

test('成功但写入失败可恢复重试，无需重新执行', async ({page}) => {
  await page.addInitScript(key => {
    window.rejectLoopSave = true;
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (name, value) {
      if (name === key && window.rejectLoopSave) throw new Error('storage denied');
      return original.call(this, name, value);
    };
  }, progressKey);
  await page.goto(topic);
  await page.locator('#repeat-count').selectOption('3');
  await execute(page, 6);
  await expect(page.locator('#run-status')).toHaveClass(/success/);
  await expect(page.locator('#progress-status')).toContainText('未能保存');
  await expect(page.locator('#retry-save')).toBeVisible();
  expect(await page.evaluate(key => localStorage.getItem(key), progressKey)).toBeNull();
  await page.evaluate(() => { window.rejectLoopSave = false; });
  await page.locator('#retry-save').click();
  await expect(page.locator('#progress-status')).toContainText('已保存');
  await expect(page.locator('#retry-save')).toBeHidden();
  await expect(page.locator('#execution-count')).toHaveText('6/6');
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), progressKey)).toEqual({'repeat-loops': true});
});

test('损坏存储保留原文且不阻止正确完成', async ({page}) => {
  await page.addInitScript(key => localStorage.setItem(key, '{broken'), progressKey);
  await page.goto(topic);
  await expect(page.locator('#progress-status')).toContainText('暂不可用');
  await page.locator('#repeat-count').selectOption('3');
  await execute(page, 6);
  await expect(page.locator('#run-status')).toHaveClass(/success/);
  await expect(page.locator('#progress-status')).toContainText('未能保存');
  await page.locator('#retry-save').click();
  expect(await page.evaluate(key => localStorage.getItem(key), progressKey)).toBe('{broken');
  await page.locator('#reset-button').click();
  await expect(page.locator('#step-button')).toBeEnabled();
  expect(await page.evaluate(key => localStorage.getItem(key), progressKey)).toBe('{broken');
});

test('先前成功但未保存的完成可在重试新路线后保存，当前结果仍如实显示', async ({page}) => {
  await page.addInitScript(key => {
    window.rejectLoopSave = true;
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (name, value) {
      if (name === key && window.rejectLoopSave) throw new Error('storage denied');
      return original.call(this, name, value);
    };
  }, progressKey);
  await page.goto(topic);
  await page.locator('#repeat-count').selectOption('3');
  await execute(page, 6);
  await page.locator('#repeat-count').selectOption('4');
  await execute(page, 8);
  await expect(page.locator('#run-status')).toHaveClass(/error/);
  await expect(page.locator('#progress-status')).toContainText('先前已完成目标');
  await page.evaluate(() => { window.rejectLoopSave = false; });
  await page.locator('#retry-save').click();
  await expect(page.locator('#progress-status')).toContainText('已保存');
  await expect(page.locator('#run-status')).toHaveClass(/error/);
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), progressKey)).toEqual({'repeat-loops': true});
});

test('320px 与减少动态效果下可用键盘完成且初始静止', async ({page}) => {
  await page.emulateMedia({reducedMotion: 'reduce'});
  await page.setViewportSize({width: 320, height: 844});
  await page.goto(topic);
  await page.waitForTimeout(800);
  await expect(page.locator('#execution-count')).toHaveText('0/4');
  const repeats = page.locator('#repeat-count');
  await repeats.focus();
  await repeats.press('3');
  await expect(repeats).toHaveValue('3');
  await page.keyboard.press('Tab');
  await expect(page.locator('#body-first')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#body-second')).toBeFocused();
  await page.keyboard.press('Tab');
  const step = page.locator('#step-button');
  await expect(step).toBeFocused();
  await expect(step).toHaveCSS('outline-style', 'solid');
  for (let i = 0; i < 6; i++) await step.press(i % 2 ? 'Enter' : 'Space');
  await expect(page.locator('#run-status')).toHaveClass(/success/);
  await expect(page.locator('#robot-grid')).toHaveAttribute('aria-label', /第 4 列第 2 行/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});

test('桌面操作区同时呈现地图、两种程序表示和当前执行反馈', async ({page}) => {
  await page.setViewportSize({width: 1280, height: 720});
  await page.goto(topic);
  await page.locator('#repeat-count').selectOption('4');
  await execute(page, 6);
  await page.locator('.workspace').scrollIntoViewIfNeeded();
  for (const selector of ['#robot-grid', '#loop-body', '#expanded-commands', '#step-button', '#execution-count', '#round-status', '#run-status']) {
    const bounds = await page.locator(selector).boundingBox();
    expect(bounds, selector).not.toBeNull();
    expect(bounds.y, selector).toBeGreaterThanOrEqual(0);
    expect(bounds.y + bounds.height, selector).toBeLessThanOrEqual(720);
  }
  const map = await page.locator('#robot-grid').boundingBox();
  const loop = await page.locator('#loop-body').boundingBox();
  const expanded = await page.locator('#expanded-commands').boundingBox();
  expect(map.x + map.width).toBeLessThan(loop.x);
  expect(loop.x + loop.width).toBeLessThan(expanded.x);
});

test('首页、学科和小学目录可发现循环，进度计数按目录更新', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '公网发现路径由发布包和公网专项验证');
  await page.goto('/');
  await expect(page.locator('[data-subject="computer"]')).toHaveAttribute('data-total', '12');
  await page.locator('.subject-card[href="computer/index.html"]').click();
  await page.locator('a[href="primary/index.html"]').click();
  await expect(page.locator('#stage-progress')).toContainText('0/5');
  await page.locator('a[href="repeat-loops.html"]').click();
  await page.locator('#repeat-count').selectOption('3');
  await execute(page, 6);
  await page.locator('.footer-nav a[href="index.html"]').click();
  await expect(page.locator('#stage-progress')).toContainText('1/5');
  await expect(page.locator('[data-topic-slug="repeat-loops"] [data-completion]')).toContainText('已完成');
  await page.goto('/');
  await expect(page.locator('[data-subject="computer"] .sp-label')).toContainText('已学 1/12');
  await page.getByRole('combobox', {name: '学科', exact: true}).selectOption('computer');
  await page.getByRole('combobox', {name: '学段', exact: true}).selectOption('primary');
  await page.getByRole('searchbox', {name: '关键词'}).fill('循环');
  await page.locator('#site-results a[href="computer/primary/repeat-loops.html"]').click();
  await expect(page.getByRole('heading', {level: 1})).toContainText('循环指令工坊');
});

test('小学目录响应其他标签页进度变化，忽略未知主题并清除旧徽标', async ({page, context}) => {
  const stageUrl = process.env.KV_PUBLISHED_BASE_URL
    ? new URL('index.html', topic).href : '/computer/primary/index.html';
  await page.goto(stageUrl);
  const other = await context.newPage();
  await other.goto(stageUrl);
  await other.evaluate(key => localStorage.setItem(key, JSON.stringify({'robot-algorithms': true, 'repeat-loops': true, ghost: true})), progressKey);
  await expect(page.locator('#stage-progress')).toContainText('2/5');
  await expect(page.locator('[data-completion]')).toHaveText(['✓ 已完成', '✓ 已完成', '', '', '']);
  await other.evaluate(key => localStorage.setItem(key, JSON.stringify({'robot-algorithms': false, ghost: true})), progressKey);
  await expect(page.locator('#stage-progress')).toContainText('0/5');
  await expect(page.locator('[data-completion]')).toHaveText(['', '', '', '', '']);
  await other.evaluate(key => localStorage.setItem(key, '{broken'), progressKey);
  await expect(page.locator('#stage-progress')).toContainText('暂不可用');
  await expect(page.locator('[data-completion]')).toHaveText(['', '', '', '', '']);
  expect(await other.evaluate(key => localStorage.getItem(key), progressKey)).toBe('{broken');
  await other.close();
});

test('直接文件模式的学习操作无外部请求和脚本错误', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '公网专项只检查已发布站点');
  const externalRequests = [], errors = [];
  page.on('request', request => { if (/^https?:/.test(request.url())) externalRequests.push(request.url()); });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(pathToFileURL(resolve(__dirname, '../../computer/primary/repeat-loops.html')).href);
  await page.locator('#repeat-count').selectOption('3');
  await execute(page, 6);
  await expect(page.locator('#run-status')).toHaveClass(/success/);
  expect(externalRequests).toEqual([]);
  expect(errors).toEqual([]);
});
