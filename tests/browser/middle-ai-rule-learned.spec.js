const {test, expect} = require('@playwright/test');
const {resolve} = require('node:path');
const {pathToFileURL} = require('node:url');
const {startReleaseServer} = require('./release-server');
const topic = process.env.KV_PUBLISHED_BASE_URL
  ? new URL('ai/middle/rule-learned-comparison.html', process.env.KV_PUBLISHED_BASE_URL.replace(/\/?$/, '/')).href
  : '/ai/middle/rule-learned-comparison.html';
const key = 'kv-ai-middle-progress';
async function trainAndTest(page) { await page.locator('#train-button').click(); await page.locator('#test-button').click(); }

test('真实训练枚举阈值并在同一留出集显示不同错误', async ({page}) => {
  await page.goto(topic);
  await expect(page.locator('#test-button')).toBeDisabled();
  await expect(page.locator('#test-rows tr')).toHaveCount(0);
  await page.locator('#train-button').click();
  await expect(page.locator('#training-summary')).toContainText('阈值 3、4 并列最少');
  await expect(page.locator('#training-summary')).toContainText('72 次训练样本判断');
  await expect(page.locator('#loss-grid .loss')).toHaveCount(12);
  await expect(page.locator('#loss-grid .chosen')).toContainText('阈值 3：错 0/6');
  await page.locator('#test-button').click();
  await expect(page.locator('#test-summary')).toContainText('手写阈值 6 正确 4/5；训练阈值 3 正确 4/5');
  await expect(page.locator('#test-rows tr').nth(1)).toContainText('A（对）');
  await expect(page.locator('#test-rows tr').nth(1)).toContainText('B（错）');
  await expect(page.locator('#test-rows tr').nth(2)).toContainText('A（错）');
  await expect(page.locator('#test-rows tr').nth(2)).toContainText('B（对）');
  await expect(page.locator('#progress-status')).toContainText('已记录');
});

test('改变训练样本重新计算，测试参与选择后持续提示', async ({page}) => {
  await page.goto(topic); await trainAndTest(page);
  await page.locator('#train-samples input[value="t2"]').uncheck();
  await expect(page.locator('#test-results')).toBeHidden();
  await expect(page.locator('#test-feedback')).toContainText('已参与后续选择');
  await expect(page.locator('#test-button')).toBeDisabled();
  await page.locator('#train-button').click();
  await expect(page.locator('#training-summary')).toContainText('阈值 1、2、3、4 并列最少');
  await page.locator('#test-button').click();
  await expect(page.locator('#test-summary')).toContainText('训练阈值 1 正确 3/5');
  await expect(page.locator('#test-feedback')).toContainText('不能作为独立最终评估');
  await page.locator('#manual-threshold').fill('5');
  await expect(page.locator('#test-results')).toBeHidden();
  await expect(page.locator('#test-feedback')).toContainText('已参与后续选择');
  await page.locator('#test-button').click();
  await expect(page.locator('#test-summary')).toContainText('手写阈值 5 正确 5/5');
  await expect(page.locator('#test-feedback')).toContainText('不能作为独立最终评估');
});

test('样本必须包含两类，训练前调整手写规则不伪称测试已参与', async ({page}) => {
  await page.goto(topic);
  await page.locator('#manual-threshold').fill('5');
  await expect(page.locator('#test-feedback')).not.toContainText('已参与后续选择');
  await page.locator('#train-samples input[value="t0"]').uncheck();
  await page.locator('#train-samples input[value="t2"]').uncheck();
  await page.locator('#train-button').click();
  await expect(page.locator('#train-feedback')).toContainText('至少选择一张 A 和一张 B');
  await expect(page.locator('#test-button')).toBeDisabled();
  await page.locator('#select-all').click();
  await trainAndTest(page);
  await expect(page.locator('#test-summary')).toContainText('手写阈值 5 正确 5/5');
});

test('本机进度需本轮训练并对照，刷新、目录和首页数量一致', async ({page}) => {
  await page.goto(topic); await trainAndTest(page);
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), key)).toEqual({'rule-learned-comparison':true});
  await page.reload();
  await expect(page.locator('#progress-status')).toContainText('此前已记录');
  await expect(page.locator('#test-button')).toBeDisabled();
  await page.getByRole('link',{name:'← 返回初中人工智能'}).click();
  await expect(page.locator('[data-topic-slug="rule-learned-comparison"] [data-completion]')).toContainText('已完成');
  await expect(page.locator('#stage-progress')).toContainText('1/5');
  await page.getByRole('link',{name:'首页',exact:true}).click();
  await expect(page.locator('[data-subject="ai"]')).toHaveAttribute('data-total','10');
});

test('存储损坏时保留数据且可重试', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '仅本机注入存储故障');
  await page.addInitScript(key => { localStorage.setItem(key,'{broken'); }, key);
  await page.goto(topic); await trainAndTest(page);
  await expect(page.locator('#progress-status')).toContainText('未保存');
  expect(await page.evaluate(key => localStorage.getItem(key), key)).toBe('{broken');
  await page.evaluate(key => localStorage.setItem(key,'{}'), key);
  await page.locator('#retry-save').click();
  await expect(page.locator('#progress-status')).toContainText('已记录');
});

test('320px 键盘、文件直开和发布子路径', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '仅本机文件和发布包');
  await page.setViewportSize({width:320,height:740});
  await page.goto(pathToFileURL(resolve(__dirname,'../../ai/middle/rule-learned-comparison.html')).href);
  await page.locator('#train-button').focus(); await page.keyboard.press('Enter');
  await expect(page.locator('#training-summary')).toContainText('阈值 3、4');
  await page.locator('#test-button').focus(); await page.keyboard.press('Enter');
  await expect(page.locator('#test-results')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  const release = await startReleaseServer();
  try {
    await page.goto(new URL('ai/middle/rule-learned-comparison.html',release.base).href);
    await trainAndTest(page);
    await expect(page.locator('#test-summary')).toContainText('训练阈值 3 正确 4/5');
  } finally { await release.close(); }
});

test('无外部请求，模型未加载时显示错误', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '仅本机拦截与请求检查');
  const external=[];
  page.on('request', request => { if (!request.url().startsWith('http://127.0.0.1:4183/')) external.push(request.url()); });
  await page.goto(topic); await trainAndTest(page);
  expect(external).toEqual([]);
  await page.route('**/ai/middle/assets/rule-learned-model.js', route => route.abort());
  await page.reload();
  await expect(page.locator('#train-samples')).toContainText('加载失败');
  await expect(page.locator('#train-button')).toBeDisabled();
});

test('写入拒绝时可以重试而不谎报保存', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '仅本机注入写入故障');
  await page.addInitScript(key => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function(name,value) { if (name === key) throw new Error('denied'); return original.call(this,name,value); };
    window.restoreWrites = () => { Storage.prototype.setItem = original; };
  }, key);
  await page.goto(topic); await trainAndTest(page);
  await expect(page.locator('#progress-status')).toContainText('未保存');
  await page.evaluate(() => window.restoreWrites());
  await page.locator('#retry-save').click();
  await expect(page.locator('#progress-status')).toContainText('已记录');
});
