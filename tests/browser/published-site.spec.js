const {test, expect} = require('@playwright/test');
const {startReleaseServer} = require('./release-server');
const {execFileSync} = require('node:child_process');

let release, base;
async function gotoPublished(page, url) {
  return page.goto(url, {waitUntil: 'domcontentloaded'});
}
async function waitForPublishedDocument(page) {
  await page.waitForLoadState('domcontentloaded');
}

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
test.beforeEach(async ({page}) => {
  await page.setExtraHTTPHeaders({'Cache-Control': 'no-cache'});
});

test('发布包子路径的首页搜索和六学科学习交互', async ({page}) => {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('response', response => { if (response.url().startsWith(base) && response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  await gotoPublished(page, base);
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
  // URL assertion only detects navigation start. Wait for the page scripts that bind the mode buttons.
  await waitForPublishedDocument(page);
  await page.getByRole('button', {name: '✏️ 练习'}).click();
  await expect(page.locator('#mode-practice')).toHaveClass(/active/);
  await expect(page.locator('#practice-problem')).toBeVisible();
  await gotoPublished(page, base);
  await page.getByRole('link', {name: /物理 初中/}).click();
  await waitForPublishedDocument(page);
  await page.getByRole('link', {name: /初中物理/}).click();
  await waitForPublishedDocument(page);
  await page.getByRole('link', {name: /机械运动/}).click();
  await waitForPublishedDocument(page);
  await page.locator('#btnStart').click();
  await expect.poll(async () => parseFloat(await page.locator('#dispDist').textContent())).toBeGreaterThan(0);
  await gotoPublished(page, base);
  await page.getByRole('link', {name: /化学 初中/}).click();
  await waitForPublishedDocument(page);
  await page.getByRole('link', {name: /高中化学/}).click();
  await waitForPublishedDocument(page);
  await page.getByRole('link', {name: /物质的量/}).click();
  await waitForPublishedDocument(page);
  await page.getByRole('button', {name: 'CO₂ (44)'}).click();
  await expect(page.getByText('88.0 g')).toBeVisible();
  await gotoPublished(page, base);
  await page.getByRole('link', {name: /科学 小学科学/}).click();
  await waitForPublishedDocument(page);
  await page.getByRole('link', {name: /沉与浮/}).click();
  await waitForPublishedDocument(page);
  await page.getByRole('button', {name: '🔩 铁块'}).click();
  await expect(page.locator('#infoState')).toContainText('下沉');
  await gotoPublished(page, base);
  await page.getByRole('combobox', {name: '学科', exact: true}).selectOption('computer');
  await page.getByRole('combobox', {name: '学段', exact: true}).selectOption('primary');
  await page.getByRole('searchbox', {name: '关键词'}).fill('算法');
  await page.locator('#site-results a[href="computer/primary/robot-algorithms.html"]').click();
  await waitForPublishedDocument(page);
  await page.getByRole('button', {name: '运行指令'}).click();
  await expect(page.locator('#robot-status')).toContainText('抵达目标');
  await gotoPublished(page, base);
  await page.getByRole('combobox', {name: '学科', exact: true}).selectOption('computer');
  await page.getByRole('combobox', {name: '学段', exact: true}).selectOption('primary');
  await page.getByRole('searchbox', {name: '关键词'}).fill('循环');
  await page.locator('#site-results a[href="computer/primary/repeat-loops.html"]').click();
  await expect(page).toHaveURL(new URL('computer/primary/repeat-loops.html', base).href);
  await waitForPublishedDocument(page);
  await page.locator('#repeat-count').selectOption('3');
  for (let i = 0; i < 6; i++) await page.locator('#step-button').click();
  await expect(page.locator('#execution-count')).toHaveText('6/6');
  await expect(page.locator('#robot-grid')).toHaveAttribute('data-column', '4');
  await expect(page.locator('#robot-grid')).toHaveAttribute('data-row', '2');
  await expect(page.locator('#run-status')).toContainText('到达目标');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('kv-computer-primary-progress'))))
    .toEqual({'robot-algorithms': true, 'repeat-loops': true});
  await gotoPublished(page, base);
  await page.getByRole('combobox', {name: '学科', exact: true}).selectOption('computer');
  await page.getByRole('combobox', {name: '学段', exact: true}).selectOption('primary');
  await page.getByRole('searchbox', {name: '关键词'}).fill('条件分支');
  await page.locator('#site-results a[href="computer/primary/conditional-robot.html"]').click();
  await expect(page).toHaveURL(new URL('computer/primary/conditional-robot.html', base).href);
  await waitForPublishedDocument(page);
  for (let i = 0; i < 6; i++) await page.locator('#step-button').click();
  await expect(page.locator('#robot-grid')).toHaveAttribute('data-column', '5');
  await expect(page.locator('#robot-grid')).toHaveAttribute('data-row', '1');
  await expect(page.locator('#snapshot-condition')).toHaveAttribute('data-condition', 'false');
  await expect(page.locator('#run-status')).toHaveClass(/success/);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('kv-computer-primary-progress'))))
    .toEqual({'robot-algorithms': true, 'repeat-loops': true, 'conditional-robot': true});
  await gotoPublished(page, base);
  await page.getByRole('combobox', {name: '学科', exact: true}).selectOption('ai');
  await page.getByRole('combobox', {name: '学段', exact: true}).selectOption('high');
  await page.getByRole('searchbox', {name: '关键词'}).fill('分类边界');
  await page.locator('#site-results a[href="ai/high/classifier-lab.html"]').click();
  await waitForPublishedDocument(page);
  const threshold = page.locator('#threshold');
  await threshold.focus();
  for (let i = 0; i < 4; i++) await threshold.press('ArrowLeft');
  await page.getByRole('button', {name: '重新评估样本'}).click();
  await expect(page.locator('#accuracy-output')).toHaveText('87.5%');
  await gotoPublished(page, base);
  await page.getByRole('combobox', {name: '学科', exact: true}).selectOption('ai');
  await page.getByRole('combobox', {name: '学段', exact: true}).selectOption('high');
  await page.getByRole('searchbox', {name: '关键词'}).fill('训练集');
  await page.locator('#site-results a[href="ai/high/train-test-generalization.html"]').click();
  await waitForPublishedDocument(page);
  await page.getByRole('button', {name: '查看留出测试结果'}).click();
  await expect(page.locator('#test-accuracy')).toHaveText('50%');
  await page.getByRole('slider', {name: /分类阈值/}).focus();
  await page.getByRole('slider', {name: /分类阈值/}).press('ArrowLeft');
  await expect(page.locator('#test-accuracy')).toHaveText('75%');
  await expect(page.locator('#test-warning')).toBeVisible();
  await gotoPublished(page, base);
  await page.getByRole('combobox', {name: '学科', exact: true}).selectOption('ai');
  await page.getByRole('combobox', {name: '学段', exact: true}).selectOption('primary');
  await page.getByRole('searchbox', {name: '关键词'}).fill('线索分类');
  await page.locator('#site-results a[href="ai/primary/feature-classification-lab.html"]').click();
  await waitForPublishedDocument(page);
  await page.getByRole('button', {name: '查看真实标签'}).click();
  await expect(page.locator('#test-summary')).toContainText('预测正确 2/4');
  await page.locator('#feature-color').focus();
  await page.locator('#feature-color').press('ArrowRight');
  await expect(page.locator('#test-summary')).toContainText('预测正确 4/4');
  await expect(page.locator('#seen-warning')).toBeVisible();
  await gotoPublished(page, base);
  await page.getByRole('combobox', {name: '学科', exact: true}).selectOption('ai');
  await page.getByRole('combobox', {name: '学段', exact: true}).selectOption('middle');
  await page.getByRole('searchbox', {name: '关键词'}).fill('数据标签');
  await page.locator('#site-results a[href="ai/middle/data-label-quality.html"]').click();
  await waitForPublishedDocument(page);
  await expect(page.locator('#group-a-prediction')).toHaveText('暂时无法判断');
  await page.getByRole('radio', {name: /按合成复核记录更正为/}).check();
  await expect(page.locator('#group-a-prediction')).toHaveText('预测类别甲');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('kv-ai-middle-progress'))))
    .toEqual({'data-label-quality': true});
  await gotoPublished(page, base);
  await page.getByRole('combobox', {name: '学科', exact: true}).selectOption('ai');
  await page.getByRole('combobox', {name: '学段', exact: true}).selectOption('middle');
  await page.getByRole('searchbox', {name: '关键词'}).fill('数据来源');
  await page.locator('#site-results a[href="ai/middle/data-source-coverage.html"]').click();
  await waitForPublishedDocument(page);
  await expect(page.locator('#coverage-total')).toHaveText('本演示集合已覆盖 2 / 4 个条件组合。');
  await page.getByRole('button', {name: '明暗各取样，仍选 4 条'}).click();
  await expect(page.locator('#coverage-total')).toHaveText('本演示集合已覆盖 4 / 4 个条件组合。');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('kv-ai-middle-progress'))))
    .toEqual({'data-label-quality': true, 'data-source-coverage': true});
  await gotoPublished(page, base);
  await page.getByRole('combobox', {name: '学科', exact: true}).selectOption('ai');
  await page.getByRole('combobox', {name: '学段', exact: true}).selectOption('middle');
  await page.getByRole('searchbox', {name: '关键词'}).fill('个人信息');
  await page.locator('#site-results a[href="ai/middle/data-minimization.html"]').click();
  await waitForPublishedDocument(page);
  await expect(page.locator('#recommendation-output')).toHaveText('11–13 岁 · 图文探索读物《太阳系观察手册》');
  const dataFields = page.locator('#extra-fields input[type="checkbox"]');
  for (const input of await dataFields.all()) await input.uncheck();
  await expect(page.locator('#field-count')).toHaveText('当前计划收集 2 项：2 项用于推荐，0 项不会改变推荐结果。');
  await expect(page.locator('#recommendation-output')).toHaveText('11–13 岁 · 图文探索读物《太阳系观察手册》');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('kv-ai-middle-progress'))['data-minimization']))
    .toBe(true);
  await page.goto(new URL('computer-ai/primary/robot-algorithms.html', base).href);
  await expect(page).toHaveURL(new URL('computer/primary/robot-algorithms.html', base).href);
  expect((await page.request.get(base + 'README.md')).status()).toBe(404);
  expect(errors).toEqual([]);
});

test('发布站子路径的面积到体积路线可连续学习', async ({page}) => {
  const errors=[];
  page.on('pageerror', e => errors.push(e.message));
  page.on('response', response => { if (response.url().startsWith(base) && response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  await gotoPublished(page, base);
  await page.getByRole('link',{name:/数学 小学/}).click();
  await waitForPublishedDocument(page);
  await page.locator('#area-volume-path ol').getByRole('link',{name:/认识面积/}).click();
  await waitForPublishedDocument(page);
  for (const slug of ['understanding-area','area-and-perimeter','solid-shapes','surface-area','volume']) {
    await expect(page).toHaveURL(new URL(`math/topics/${slug}/index.html`,base).href);
    const nav=page.getByRole('navigation',{name:'从面积到体积学习路线'});
    if(slug !== 'volume') {
      await nav.getByRole('link',{name:/下一步/}).click();
      await waitForPublishedDocument(page);
    }
  }
  await page.locator('button[data-mode="explore"]').click();
  await page.locator('#layer-next').click(); await expect(page.locator('#layer-status')).toContainText('1 / 2 层');
  await page.getByRole('navigation',{name:'从面积到体积学习路线'}).getByRole('link',{name:'返回学习路线'}).click();
  await waitForPublishedDocument(page);
  await expect(page).toHaveURL(new URL('math/index.html#area-volume-path',base).href);
  await expect(page.locator('#area-volume-path')).toBeVisible();
  expect(errors).toEqual([]);
});

test('发布站各数学学段目录可加载进度脚本并显示完成标记', async ({page}) => {
  const failures=[];
  page.on('pageerror', e=>failures.push(e.message));
  page.on('response', response=>{if(response.url().startsWith(base)&&response.status()>=400) failures.push(`${response.status()} ${response.url()}`);});
  await gotoPublished(page, new URL('math/index.html',base).href);
  await page.evaluate(()=>localStorage.setItem('kv-math-progress-v2',JSON.stringify({'middle:linear-equation':1,'high:derivative':1,'uni:derivative':1})));
  for(const [stage,slug] of [['middle','linear-equation'],['high','derivative'],['uni','derivative']]) {
    await gotoPublished(page, new URL(`math/${stage}/index.html`,base).href);
    await expect(page.locator(`a[href="${slug}.html"] .progress-badge`)).toHaveCount(1);
    await expect(page.locator('#mathProgressNotice')).toBeHidden();
  }
  expect(failures).toEqual([]);
});

test('发布站子路径可查找并完整运行工业流水线', async ({page}) => {
  const failures = [];
  page.on('pageerror', e => failures.push(e.message));
  page.on('response', response => {
    if (response.url().startsWith(base) && response.status() >= 400)
      failures.push(`${response.status()} ${response.url()}`);
  });
  await page.clock.install();
  await gotoPublished(page, base);
  await page.getByRole('combobox', {name:'学科', exact:true}).selectOption('simulation-world');
  await page.getByRole('searchbox', {name:'关键词'}).fill('流水线');
  await page.locator('#site-results a[href="simulation-world/assembly-line.html"]').click();
  await expect(page).toHaveURL(new URL('simulation-world/assembly-line.html', base).href);
  await waitForPublishedDocument(page);
  await page.locator('#balanced-preset').click();
  await page.locator('#run-button').click();
  await page.clock.runFor(10000);
  await expect(page.locator('#elapsed-time')).toHaveText('20');
  await expect(page.locator('#completed-count')).toHaveText('8/8');
  await page.getByRole('link', {name:'返回模拟世界', exact:true}).click();
  await waitForPublishedDocument(page);
  await expect(page).toHaveURL(new URL('simulation-world/index.html', base).href);
  await expect(page.locator('.topic-card')).toHaveCount(3);
  expect(failures).toEqual([]);
});

test('发布站非金属元素与转化可键盘选择且文字说明同步', async ({page}) => {
  const failures=[];
  page.on('pageerror',error=>failures.push(error.message));
  page.on('response',response=>{
    if(response.url().startsWith(base)&&response.status()>=400) failures.push(`${response.status()} ${response.url()}`);
  });
  await gotoPublished(page,new URL('chemistry/high/nonmetals.html',base).href);
  const raw=await page.evaluate(()=>localStorage.getItem('kv-chemistry-high-progress'));
  await page.locator('#stage-elements').press('Tab');
  await expect(page.locator('.element-card[data-element="cl"]')).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.element-card[data-element="s"]')).toHaveAttribute('aria-checked','true');
  await expect(page.locator('#element-info .title')).toContainText('硫');
  await expect(page.locator('#canvas-elements')).toHaveAttribute('aria-label',/硫.*16.*2-8-6/);
  await page.locator('#tab-transforms').click();
  await page.locator('#series-nitrogen').press('Tab');
  await expect(page.locator('#transform-list .transform-item').first()).toBeFocused();
  await expect(page.locator('#transform-list [aria-checked="true"]')).toHaveCount(0);
  await page.keyboard.press('End');
  await expect(page.locator('#reaction-detail')).toContainText('N₂ + O₂ ⇌ 2NO');
  await expect(page.locator('#canvas-transforms')).toHaveAttribute('aria-label',/放电/);
  await page.locator('#series-sulfur').click();
  await expect(page.locator('#reaction-detail')).toContainText('尚未选择');
  await page.locator('#series-sulfur').press('Tab');
  await page.keyboard.press('Space');
  await expect(page.locator('#reaction-detail')).toContainText('S + O₂ → SO₂');
  expect(await page.evaluate(()=>localStorage.getItem('kv-chemistry-high-progress'))).toBe(raw);
  expect(failures).toEqual([]);
});
