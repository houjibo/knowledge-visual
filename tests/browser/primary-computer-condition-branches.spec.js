const {test, expect} = require('@playwright/test');
const {resolve} = require('node:path');
const {pathToFileURL} = require('node:url');

const topic = process.env.KV_PUBLISHED_BASE_URL
  ? new URL('computer/primary/conditional-robot.html', process.env.KV_PUBLISHED_BASE_URL.replace(/\/?$/, '/')).href
  : '/computer/primary/conditional-robot.html';
const progressKey = 'kv-computer-primary-progress';

async function execute(page, count = 1) {
  for (let i = 0; i < count; i++) await page.locator('#step-button').click();
}
async function position(page, column, row) {
  await expect(page.locator('#robot-grid')).toHaveAttribute('data-column', String(column));
  await expect(page.locator('#robot-grid')).toHaveAttribute('data-row', String(row));
}
async function coordinateText(page, selector, column, row) {
  expect((await page.locator(selector).innerText()).match(/-?\d+/g)?.map(Number)).toEqual([column, row]);
}
async function judgement(page, {before, checked, kind, truth, after, step}) {
  await coordinateText(page, '#snapshot-before', ...before);
  await coordinateText(page, '#snapshot-check', ...checked);
  await coordinateText(page, '#snapshot-after', ...after);
  await expect(page.locator('#snapshot-kind')).toContainText(kind);
  await expect(page.locator('#snapshot-condition')).toHaveText(truth ? /真|true|条件成立/ : /假|false|不成立/);
  const selected = truth ? '#if-branch' : '#else-branch';
  const other = truth ? '#else-branch' : '#if-branch';
  await expect(page.locator(selected)).toHaveAttribute('aria-current', 'step');
  await expect(page.locator(other)).not.toHaveAttribute('aria-current', 'step');
  await expect(page.locator('#if-branch[aria-current="step"],#else-branch[aria-current="step"]')).toHaveCount(1);
  await expect(page.locator('#judgement-count')).toHaveText(String(step));
  await position(page, ...after);
}

test('默认六次判断的旧位置、检查、分支与动作后位置一一对应', async ({page}) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(topic);
  await expect(page.locator('#check-direction')).toHaveValue('right');
  await expect(page.locator('#true-action')).toHaveValue('up');
  await expect(page.locator('#false-action')).toHaveValue('right');
  await expect(page.locator('#judgement-count')).toHaveText('0');
  await expect(page.locator('[aria-current="step"]')).toHaveCount(0);
  await expect(page.locator('#last-snapshot')).toContainText('尚未判断');
  const route = [
    {before:[1,3], checked:[2,3], kind:'畅通', truth:false, after:[2,3]},
    {before:[2,3], checked:[3,3], kind:'墙', truth:true, after:[2,2]},
    {before:[2,2], checked:[3,2], kind:'畅通', truth:false, after:[3,2]},
    {before:[3,2], checked:[4,2], kind:'畅通', truth:false, after:[4,2]},
    {before:[4,2], checked:[5,2], kind:'墙', truth:true, after:[4,1]},
    {before:[4,1], checked:[5,1], kind:'畅通', truth:false, after:[5,1]},
  ];
  for (const [index, expected] of route.entries()) {
    await execute(page);
    await judgement(page, {...expected, step:index + 1});
  }
  await expect(page.locator('#true-count')).toHaveText('2');
  await expect(page.locator('#false-count')).toHaveText('4');
  await expect(page.locator('#collision-count')).toHaveText('0');
  await expect(page.locator('#run-status')).toHaveClass(/success/);
  await expect(page.locator('#step-button')).toBeDisabled();
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), progressKey)).toEqual({'conditional-robot':true});
  expect(errors).toEqual([]);
});

test('另一条规则经上边界判断也能成功，不限定必须使用默认规则', async ({page}) => {
  await page.goto(topic);
  await page.locator('#check-direction').selectOption('up');
  await page.locator('#true-action').selectOption('right');
  await page.locator('#false-action').selectOption('up');
  const positions = [[1,2],[1,1],[2,1],[3,1],[4,1],[5,1]];
  for (const [i, expected] of positions.entries()) {
    await execute(page);
    await position(page, ...expected);
    if (i >= 2) {
      await expect(page.locator('#snapshot-kind')).toContainText('边界');
      await expect(page.locator('#if-branch')).toHaveAttribute('aria-current','step');
    }
  }
  await expect(page.locator('#true-count')).toHaveText('4');
  await expect(page.locator('#false-count')).toHaveText('2');
  await expect(page.locator('#run-status')).toHaveClass(/success/);
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), progressKey)).toEqual({'conditional-robot':true});
});

test('条件成立仍可能选到撞墙动作，而且绝不补执行另一分支', async ({page}) => {
  await page.goto(topic);
  await page.locator('#true-action').selectOption('right');
  await execute(page, 2);
  await judgement(page, {before:[2,3], checked:[3,3], kind:'墙', truth:true, after:[2,3], step:2});
  await coordinateText(page, '#snapshot-target', 3, 3);
  await expect(page.locator('#snapshot-movement')).toContainText('墙');
  await expect(page.locator('#collision-count')).toHaveText('1');
  await expect(page.locator('#run-status')).toContainText('墙');
  await execute(page);
  await position(page, 2, 3);
  await expect(page.locator('#collision-count')).toHaveText('2');
  expect(await page.evaluate(key => localStorage.getItem(key), progressKey)).toBeNull();
});

test('边界也算障碍，选中越界动作不移动且快照保留边界外坐标', async ({page}) => {
  await page.goto(topic);
  await page.locator('#check-direction').selectOption('up');
  await page.locator('#false-action').selectOption('up');
  await execute(page, 3);
  await judgement(page, {before:[1,1], checked:[1,0], kind:'边界', truth:true, after:[1,1], step:3});
  await coordinateText(page, '#snapshot-target', 1, 0);
  await expect(page.locator('#snapshot-movement')).toContainText('边界');
  await expect(page.locator('#collision-count')).toHaveText('1');
  expect(await page.evaluate(key => localStorage.getItem(key), progressKey)).toBeNull();
});

test('任一规则编辑都清空旧位置、快照和统计，不混用两套规则', async ({page}) => {
  await page.goto(topic);
  for (const [selector, value] of [['#check-direction','up'],['#true-action','right'],['#false-action','up']]) {
    await execute(page);
    await page.locator(selector).selectOption(value);
    await position(page, 1, 3);
    for (const id of ['#judgement-count','#true-count','#false-count','#collision-count']) await expect(page.locator(id)).toHaveText('0');
    await expect(page.locator('[aria-current="step"]')).toHaveCount(0);
    await expect(page.locator('#last-snapshot')).toContainText('尚未判断');
    expect(await page.evaluate(key => localStorage.getItem(key), progressKey)).toBeNull();
  }
});

test('回到起点保留当前规则，恢复示例回到默认规则', async ({page}) => {
  await page.goto(topic);
  await page.locator('#check-direction').selectOption('up');
  await page.locator('#true-action').selectOption('right');
  await page.locator('#false-action').selectOption('up');
  await execute(page, 3);
  await page.locator('#reset-button').click();
  await expect(page.locator('#check-direction')).toHaveValue('up');
  await expect(page.locator('#true-action')).toHaveValue('right');
  await expect(page.locator('#false-action')).toHaveValue('up');
  await position(page, 1, 3);
  await expect(page.locator('#judgement-count')).toHaveText('0');
  await page.locator('#example-button').click();
  await expect(page.locator('#check-direction')).toHaveValue('right');
  await expect(page.locator('#true-action')).toHaveValue('up');
  await expect(page.locator('#false-action')).toHaveValue('right');
  await expect(page.locator('#last-snapshot')).toContainText('尚未判断');
});

test('完成保留其他主题记录，刷新与重新探索不删除历史完成', async ({page}) => {
  await page.addInitScript(key => {
    if (localStorage.getItem(key) === null) localStorage.setItem(key, JSON.stringify({'robot-algorithms':true,'repeat-loops':true}));
  }, progressKey);
  await page.goto(topic);
  await execute(page, 6);
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), progressKey)).toEqual({'robot-algorithms':true,'repeat-loops':true,'conditional-robot':true});
  await page.reload();
  await position(page, 1, 3);
  await expect(page.locator('#judgement-count')).toHaveText('0');
  await expect(page.locator('#progress-status')).toContainText('已');
  await page.locator('#true-action').selectOption('right');
  await execute(page, 2);
  await expect(page.locator('#collision-count')).toHaveText('1');
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), progressKey)).toEqual({'robot-algorithms':true,'repeat-loops':true,'conditional-robot':true});
});

async function rejectWrites(page) {
  await page.addInitScript(key => {
    window.rejectConditionSave = true;
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function(name, value) {
      if (name === key && window.rejectConditionSave) throw new Error('storage denied');
      return original.call(this, name, value);
    };
  }, progressKey);
}

test('写入拒绝仍显示成功路线，恢复后可保存同一完成资格', async ({page}) => {
  await rejectWrites(page);
  await page.goto(topic);
  await execute(page, 6);
  await expect(page.locator('#run-status')).toHaveClass(/success/);
  await expect(page.locator('#progress-status')).toContainText('未能保存');
  await expect(page.locator('#retry-save')).toBeVisible();
  expect(await page.evaluate(key => localStorage.getItem(key), progressKey)).toBeNull();
  await page.evaluate(() => {window.rejectConditionSave = false;});
  await page.locator('#retry-save').click();
  await expect(page.locator('#progress-status')).toContainText('已保存');
  await expect(page.locator('#retry-save')).toBeHidden();
  await position(page, 5, 1);
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), progressKey)).toEqual({'conditional-robot':true});
});

test('先前赢得但未保存的资格跨规则编辑保留，重试不把当前碰撞说成成功', async ({page}) => {
  await rejectWrites(page);
  await page.goto(topic);
  await execute(page, 6);
  await page.locator('#true-action').selectOption('right');
  await execute(page, 2);
  await expect(page.locator('#collision-count')).toHaveText('1');
  const currentStatus = await page.locator('#run-status').innerText();
  await expect(page.locator('#progress-status')).toHaveText(/此前|先前/);
  await page.evaluate(() => {window.rejectConditionSave = false;});
  await page.locator('#retry-save').click();
  await expect(page.locator('#run-status')).toHaveText(currentStatus);
  await position(page, 2, 3);
  await expect(page.locator('#judgement-count')).toHaveText('2');
  await expect(page.locator('#progress-status')).toContainText('已保存');
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), progressKey)).toEqual({'conditional-robot':true});
});

test('损坏进度原文保留，完成、重试和重置都不自动覆盖修复', async ({page}) => {
  await page.addInitScript(key => localStorage.setItem(key, '{broken'), progressKey);
  await page.goto(topic);
  await expect(page.locator('#progress-status')).toContainText('暂不可用');
  await execute(page, 6);
  await expect(page.locator('#run-status')).toHaveClass(/success/);
  await expect(page.locator('#progress-status')).toContainText('未能保存');
  await page.locator('#retry-save').click();
  await page.locator('#reset-button').click();
  await page.locator('#retry-save').click();
  expect(await page.evaluate(key => localStorage.getItem(key), progressKey)).toBe('{broken');
  await expect(page.locator('#judgement-count')).toHaveText('0');
});

test('没有自动循环，等待或页面离开不会执行额外判断', async ({page}) => {
  await page.clock.install();
  await page.goto(topic);
  await page.clock.runFor(5000);
  await expect(page.locator('#judgement-count')).toHaveText('0');
  await execute(page, 2);
  await page.clock.runFor(5000);
  await expect(page.locator('#judgement-count')).toHaveText('2');
  await position(page, 2, 2);
  await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));
  await page.clock.runFor(5000);
  await expect(page.locator('#judgement-count')).toHaveText('2');
});

test('320px减少动态下可键盘逐步完成且有地图文字替代', async ({page}) => {
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.setViewportSize({width:320,height:844});
  await page.goto(topic);
  const check = page.locator('#check-direction');
  await check.focus();
  await page.keyboard.press('Tab');
  await expect(page.locator('#true-action')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#false-action')).toBeFocused();
  await page.keyboard.press('Tab');
  const step = page.locator('#step-button');
  await expect(step).toBeFocused();
  await expect(step).toHaveCSS('outline-style','solid');
  for (let i = 0; i < 6; i++) await step.press(i % 2 ? 'Enter' : 'Space');
  await expect(page.locator('#run-status')).toHaveClass(/success/);
  await expect(page.locator('#robot-grid')).toHaveAttribute('aria-label', /机器人当前位置：第\s*5\s*列[，,\s]*第\s*1\s*行/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});

test('桌面能在同一操作区比较地图、规则与最近判断快照', async ({page}) => {
  await page.setViewportSize({width:1280,height:720});
  await page.goto(topic);
  await execute(page, 2);
  await page.locator('.workspace').scrollIntoViewIfNeeded();
  for (const selector of ['#robot-grid','#if-branch','#else-branch','#last-snapshot','#step-button','#judgement-count','#run-status']) {
    const box = await page.locator(selector).boundingBox();
    expect(box, selector).not.toBeNull();
    expect(box.y, selector).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height, selector).toBeLessThanOrEqual(720);
  }
  const map = await page.locator('#robot-grid').boundingBox();
  const rule = await page.locator('#if-branch').boundingBox();
  const snapshot = await page.locator('#last-snapshot').boundingBox();
  expect(map.x + map.width).toBeLessThan(rule.x);
  expect(rule.x + rule.width).toBeLessThan(snapshot.x);
});

test('首页、小学目录及搜索可发现分支主题并汇总实际完成', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '公网发现由发布子路径回归核查');
  await page.goto('/');
  await expect(page.locator('[data-subject="computer"]')).toHaveAttribute('data-total','8');
  await page.locator('.subject-card[href="computer/index.html"]').click();
  await page.locator('a[href="primary/index.html"]').click();
  await expect(page.locator('#stage-progress')).toContainText('0/5');
  await page.locator('a[href="conditional-robot.html"]').click();
  await execute(page, 6);
  await page.locator('.footer-nav a[href="index.html"]').click();
  await expect(page.locator('#stage-progress')).toContainText('1/5');
  await expect(page.locator('[data-topic-slug="conditional-robot"] [data-completion]')).toContainText('已完成');
  await page.goto('/');
  await expect(page.locator('[data-subject="computer"] .sp-label')).toContainText('已学 1/8');
  await page.getByRole('combobox',{name:'学科',exact:true}).selectOption('computer');
  await page.getByRole('combobox',{name:'学段',exact:true}).selectOption('primary');
  await page.getByRole('searchbox',{name:'关键词'}).fill('条件分支');
  await page.locator('#site-results a[href="computer/primary/conditional-robot.html"]').click();
  await expect(page.getByRole('heading',{level:1})).toContainText('条件分支机器人');
});

test('文件模式可离线判断并完成，没有外部请求或脚本错误', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '公开专项不检查本地文件');
  const errors = [], externalRequests = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => {if (/^https?:/.test(request.url())) externalRequests.push(request.url());});
  await page.goto(pathToFileURL(resolve(__dirname,'../../computer/primary/conditional-robot.html')).href);
  await execute(page, 6);
  await expect(page.locator('#run-status')).toHaveClass(/success/);
  await position(page, 5, 1);
  expect(errors).toEqual([]);
  expect(externalRequests).toEqual([]);
});
