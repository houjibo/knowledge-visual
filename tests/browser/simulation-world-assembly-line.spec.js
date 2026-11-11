const {test, expect} = require('@playwright/test');
const {resolve} = require('node:path');
const {pathToFileURL} = require('node:url');

const topic = process.env.KV_PUBLISHED_BASE_URL
  ? new URL('simulation-world/assembly-line.html', process.env.KV_PUBLISHED_BASE_URL.replace(/\/?$/, '/')).href
  : '/simulation-world/assembly-line.html';

async function step(page, count = 1) {
  for (let i = 0; i < count; i++) await page.locator('#step-button').click();
}
async function elapsed(page, time) {
  await expect(page.locator('#elapsed-time')).toHaveText(String(time));
  await expect(page.locator('#assembly-scene')).toHaveAttribute('data-time', String(time));
}
async function conserved(page) {
  const ids = await page.locator('.part[data-item-id]').evaluateAll(parts => parts.map(p => Number(p.dataset.itemId)).sort((a, b) => a - b));
  expect(ids).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
}

test('首页和分类提供第三个工业场景且没有学段进度', async ({page}) => {
  const base = process.env.KV_PUBLISHED_BASE_URL || '/';
  await page.goto(base);
  const category = page.locator('[data-subject-category="simulation-world"]');
  await expect(category).toHaveAttribute('data-total', '3');
  await expect(category.locator('.subject-progress')).toHaveCount(0);
  await page.getByRole('combobox', {name:'学科', exact:true}).selectOption('simulation-world');
  await page.getByRole('searchbox', {name:'关键词'}).fill('流水线');
  await page.locator('#site-results a[href="simulation-world/assembly-line.html"]').click();
  await expect(page.getByRole('heading', {name:/工业流水线模拟/})).toBeVisible();
  await page.getByRole('link', {name:'返回模拟世界', exact:true}).click();
  await expect(page.locator('.topic-card')).toHaveCount(3);
});

test('默认暂停且八件编号唯一，单步能观察队列和同秒转站', async ({page}) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(topic);
  await expect(page.locator('#run-button')).toHaveAttribute('aria-pressed', 'false');
  await elapsed(page, 0);
  await expect(page.locator('#pending-count')).toHaveText('7');
  await expect(page.locator('#wip-count')).toHaveText('1');
  await expect(page.locator('#cut-workpiece .part')).toHaveAttribute('data-item-id', '1');
  await conserved(page);
  await step(page, 2);
  await elapsed(page, 2);
  await expect(page.locator('#cut-workpiece .part')).toHaveAttribute('data-item-id', '2');
  await expect(page.locator('#assembly-workpiece .part')).toHaveAttribute('data-item-id', '1');
  await expect(page.locator('#completed-count')).toHaveText('0/8');
  await step(page, 2);
  await expect(page.locator('#assembly-queue .part')).toHaveAttribute('data-item-id', '2');
  await expect(page.locator('#queued-count')).toHaveText('1');
  await expect(page.locator('#wip-count')).toHaveText('3');
  await conserved(page);
  expect(errors).toEqual([]);
});

test('默认瓶颈首件第9秒完成，整批44秒且结束后不会继续推进', async ({page}) => {
  await page.clock.install();
  await page.goto(topic);
  await expect(page.locator('#bottleneck-names')).toContainText('装配');
  expect(parseFloat(await page.locator('#theoretical-rate').innerText())).toBe(12);
  await page.locator('#run-button').click();
  await page.clock.runFor(4000);
  await elapsed(page, 8);
  await expect(page.locator('#completed-count')).toHaveText('0/8');
  await page.clock.runFor(500);
  await expect(page.locator('#completed-count')).toHaveText('1/8');
  await expect(page.locator('#first-completion')).toContainText('9');
  await page.clock.runFor(17500);
  await elapsed(page, 44);
  await expect(page.locator('#completed-count')).toHaveText('8/8');
  await expect(page.locator('#wip-count')).toHaveText('0');
  await expect(page.locator('#pending-count')).toHaveText('0');
  await expect(page.locator('#batch-duration')).toContainText('44');
  await expect(page.locator('#run-button')).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('#run-button')).toBeDisabled();
  await expect(page.locator('#step-button')).toBeDisabled();
  await conserved(page);
  expect(await page.locator('#finished-items .part').evaluateAll(parts => parts.map(p => Number(p.dataset.itemId)))).toEqual([1,2,3,4,5,6,7,8]);
  await page.clock.runFor(10000);
  await elapsed(page, 44);
});

test('改善装配后整批20秒，对照保留完整条件并省24秒', async ({page}) => {
  await page.clock.install();
  await page.goto(topic);
  await page.locator('#run-button').click();
  await page.clock.runFor(22000);
  await page.locator('#balanced-preset').click();
  await elapsed(page, 0);
  await expect(page.locator('#cut-time')).toHaveValue('2');
  await expect(page.locator('#assembly-time')).toHaveValue('2');
  await expect(page.locator('#quality-time')).toHaveValue('2');
  await expect(page.locator('#bottleneck-names')).toContainText('切割');
  await expect(page.locator('#bottleneck-names')).toContainText('装配');
  await expect(page.locator('#bottleneck-names')).toContainText('质检');
  await page.locator('#run-button').click();
  await page.clock.runFor(10000);
  await elapsed(page, 20);
  await expect(page.locator('#previous-completed-time')).toContainText('44');
  await expect(page.locator('#last-completed-time')).toContainText('20');
  await expect(page.locator('#comparison-result')).toContainText('24');
  const earlierConditions = await page.locator('#previous-completed-times').innerText();
  const recentConditions = await page.locator('#last-completed-times').innerText();
  expect(earlierConditions).toMatch(/2\s*\/\s*5\s*\/\s*2/);
  expect(recentConditions).toMatch(/2\s*\/\s*2\s*\/\s*2/);
  expect(parseFloat(await page.locator('#theoretical-rate').innerText())).toBe(30);
  expect(parseFloat(await page.locator('#batch-rate').innerText())).toBe(24);
  await page.locator('#assembly-time').selectOption('6');
  await step(page, 3);
  await page.locator('#rerun-button').click();
  await expect(page.locator('#last-completed-time')).toContainText('20');
  await expect(page.locator('#previous-completed-time')).toContainText('44');
  await expect(page.locator('#previous-completed-times')).toHaveText(earlierConditions);
  await expect(page.locator('#last-completed-times')).toHaveText(recentConditions);
});

test('所有1秒工位不会同秒跨越两站，首件3秒及整批10秒', async ({page}) => {
  await page.goto(topic);
  for (const selector of ['#cut-time','#assembly-time','#quality-time']) await page.locator(selector).selectOption('1');
  await step(page, 1);
  await expect(page.locator('#assembly-workpiece .part')).toHaveAttribute('data-item-id', '1');
  await expect(page.locator('#quality-workpiece .part')).toHaveCount(0);
  await expect(page.locator('#completed-count')).toHaveText('0/8');
  await step(page, 1);
  await expect(page.locator('#quality-workpiece .part')).toHaveAttribute('data-item-id', '1');
  await expect(page.locator('#completed-count')).toHaveText('0/8');
  await step(page, 1);
  await expect(page.locator('#completed-count')).toHaveText('1/8');
  await step(page, 7);
  await elapsed(page, 10);
  await expect(page.locator('#completed-count')).toHaveText('8/8');
  await conserved(page);
});

test('瓶颈可移到切割或质检，各控件绑定正确工位且下游排队可见', async ({page}) => {
  await page.clock.install();
  await page.goto(topic);
  await page.locator('#cut-time').selectOption('6');
  await page.locator('#assembly-time').selectOption('2');
  await page.locator('#quality-time').selectOption('1');
  await expect(page.locator('#bottleneck-names')).toHaveText(/切割/);
  await expect(page.locator('#bottleneck-names')).not.toContainText('质检');
  await page.locator('#run-button').click();
  await page.clock.runFor(25500);
  await elapsed(page, 51);
  await expect(page.locator('#completed-count')).toHaveText('8/8');
  await page.locator('#cut-time').selectOption('1');
  await page.locator('#quality-time').selectOption('6');
  await expect(page.locator('#bottleneck-names')).toContainText('质检');
  await expect(page.locator('#bottleneck-names')).not.toContainText('切割');
  await page.locator('#run-button').click();
  await page.clock.runFor(2500);
  await expect(page.locator('#quality-queue .part')).toHaveAttribute('data-item-id', '2');
  await conserved(page);
  await page.clock.runFor(23000);
  await elapsed(page, 51);
  await expect(page.locator('#completed-count')).toHaveText('8/8');
});

test('暂停恢复和手动步进不会产生重叠计时器', async ({page}) => {
  await page.clock.install();
  await page.goto(topic);
  const run = page.locator('#run-button');
  await run.click();
  await page.clock.runFor(1000);
  await elapsed(page, 2);
  await run.click();
  await page.clock.runFor(3000);
  await elapsed(page, 2);
  await step(page);
  await elapsed(page, 3);
  await run.click();
  await page.clock.runFor(1000);
  await elapsed(page, 5);
  await run.click();
  await page.clock.runFor(1000);
  await elapsed(page, 5);
});

test('每个工位参数和示例变更均清零暂停，重跑保留当前参数', async ({page}) => {
  await page.clock.install();
  await page.goto(topic);
  for (const selector of ['#cut-time','#assembly-time','#quality-time']) {
    await page.locator('#run-button').click();
    await page.clock.runFor(1000);
    await page.locator(selector).selectOption('6');
    await elapsed(page, 0);
    await expect(page.locator('#run-button')).toHaveAttribute('aria-pressed','false');
    await page.clock.runFor(2000);
    await elapsed(page, 0);
  }
  await step(page, 3);
  await page.locator('#rerun-button').click();
  await elapsed(page, 0);
  for (const selector of ['#cut-time','#assembly-time','#quality-time']) await expect(page.locator(selector)).toHaveValue('6');
  await page.locator('#run-button').click();
  await page.clock.runFor(500);
  await page.locator('#balanced-preset').click();
  await page.clock.runFor(2000);
  await elapsed(page, 0);
  await page.locator('#default-preset').click();
  await expect(page.locator('#assembly-time')).toHaveValue('5');
  await conserved(page);
});

test('减少动态偏好初始静止，键盘可单步且动态开启时暂停', async ({page}) => {
  await page.clock.install();
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto(topic);
  await page.clock.runFor(2000);
  await elapsed(page, 0);
  await page.locator('#step-button').focus();
  await page.keyboard.press('Enter');
  await elapsed(page, 1);
  await page.locator('#run-button').focus();
  await page.keyboard.press('Space');
  await page.clock.runFor(500);
  await elapsed(page, 2);
  await page.emulateMedia({reducedMotion:'no-preference'});
  await expect(page.locator('#motion-note')).toContainText('页面默认暂停');
  await page.emulateMedia({reducedMotion:'reduce'});
  await expect(page.locator('#run-button')).toHaveAttribute('aria-pressed','false');
  await page.clock.runFor(2000);
  await elapsed(page, 2);
});

test('页面隐藏与离开时停止旧批次，恢复可见不自动启动', async ({page}) => {
  await page.clock.install();
  await page.goto(topic);
  await page.locator('#run-button').click();
  await page.clock.runFor(1000);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', {configurable:true, value:true});
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(page.locator('#run-button')).toHaveAttribute('aria-pressed','false');
  await page.clock.runFor(1500);
  await elapsed(page, 2);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', {configurable:true, value:false});
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.clock.runFor(1000);
  await elapsed(page, 2);
  await page.locator('#run-button').click();
  await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));
  await expect(page.locator('#run-button')).toHaveAttribute('aria-pressed','false');
  await page.clock.runFor(1500);
  await elapsed(page, 2);
});

test('320px可读可操作，模型边界和概念依据可查看', async ({page}) => {
  await page.setViewportSize({width:320,height:844});
  await page.goto(topic);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  for (const id of ['#cut-time','#assembly-time','#quality-time','#step-button','#run-button']) await expect(page.locator(id)).toBeVisible();
  await page.locator('#assembly-time').focus();
  await page.keyboard.press('4');
  await page.keyboard.press('Tab');
  await expect(page.locator('#assembly-time')).toHaveValue('4');
  await page.getByText('模型假设、逐秒规则与概念依据', {exact:true}).click();
  await expect(page.locator('details.notes')).toContainText('不包含运输耗时');
  await expect(page.locator('a[href="https://www.lean.org/lexicon-terms/cycle-time/"]')).toBeVisible();
  await step(page, 4);
  await conserved(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});

test('直接打开静态文件可推进完整批次，不依赖网络或写入学科进度', async ({page}) => {
  const errors = [];
  page.on('pageerror',e => errors.push(e.message));
  await page.route(/^https?:\/\//, route => route.abort());
  await page.clock.install();
  await page.goto(pathToFileURL(resolve(__dirname, '../../simulation-world/assembly-line.html')).href);
  await page.locator('#balanced-preset').click();
  await page.locator('#run-button').click();
  await page.clock.runFor(10000);
  await elapsed(page, 20);
  await expect(page.locator('#completed-count')).toHaveText('8/8');
  await conserved(page);
  expect(await page.evaluate(() => Object.keys(localStorage).filter(k => /kv-(math|computer|ai).*progress/.test(k)))).toEqual([]);
  expect(errors).toEqual([]);
});
