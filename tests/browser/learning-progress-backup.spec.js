const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

const backup = records => ({format: 'knowledge-visual-progress', version: 1, records});
const upload = (page, value) => page.locator('#progress-import-file').setInputFiles({name: 'progress.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(value))});

test('导出只包含学科完成记录，保留原始数据', async ({page}) => {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.setItem('kv-math-progress-v2', '{"primary:addition":123}');
    localStorage.setItem('kv-science-progress', '{broken');
    localStorage.setItem('kv-computer-primary-progress', '{"robot-algorithms":true}');
    localStorage.setItem('kv-computer-high-progress', '{"search-strategies":true}');
    localStorage.setItem('kv-computer-uni-progress', '{"stack-queue":true}');
    localStorage.setItem('kv-ai-high-progress', '{"classifier-lab":true}');
    localStorage.setItem('kv-computer-ai-primary-progress', '{"robot-algorithms":true}');
    localStorage.setItem('private-data', 'secret');
  });
  await page.getByText('备份或合并学习完成记录').click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', {name: '导出完成记录'}).click();
  const download = await downloadPromise;
  const contents = JSON.parse(fs.readFileSync(await download.path(), 'utf8'));
  expect(contents.format).toBe('knowledge-visual-progress');
  expect(contents.records['kv-math-progress-v2']).toBe('{"primary:addition":123}');
  expect(contents.records['kv-science-progress']).toBe('{broken');
  expect(contents.records['kv-computer-primary-progress']).toBe('{"robot-algorithms":true}');
  expect(contents.records['kv-computer-high-progress']).toBe('{"search-strategies":true}');
  expect(contents.records['kv-computer-uni-progress']).toBe('{"stack-queue":true}');
  expect(contents.records['kv-ai-high-progress']).toBe('{"classifier-lab":true}');
  expect(contents.records['kv-computer-ai-primary-progress']).toBe('{"robot-algorithms":true}');
  expect(contents.records['private-data']).toBeUndefined();
  await expect(page.locator('#progress-backup-status')).toContainText('已导出 7 类');
});

test('预览后合并并保留本机同名和清除标记', async ({page}) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('kv-math-progress-v2', JSON.stringify({'primary:addition': false, 'high:derivative': 500})));
  await page.getByText('备份或合并学习完成记录').click();
  await upload(page, backup({'kv-math-progress-v2': JSON.stringify({'primary:addition': 100, 'middle:linear-equation': 200}), 'kv-science-progress': JSON.stringify({'sink-float': 300})}));
  await expect(page.locator('#progress-backup-status')).toContainText('新增 2 条');
  expect(await page.evaluate(() => localStorage.getItem('kv-science-progress'))).toBeNull();
  await page.getByRole('button', {name: '合并导入'}).click();
  await expect(page.locator('#progress-backup-status')).toContainText('合并完成');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('kv-math-progress-v2')))).toEqual({'primary:addition': false, 'high:derivative': 500, 'middle:linear-equation': 200});
  await expect(page.locator('[data-subject="science"] .sp-label')).toHaveText('已学 1/17');
  await page.reload();
  await expect(page.locator('[data-subject="science"] .sp-label')).toHaveText('已学 1/17');
});

test('新旧计算机和人工智能进度键都可导入备份', async ({page}) => {
  await page.goto('/');
  await page.getByText('备份或合并学习完成记录').click();
  await upload(page, backup({
    'kv-computer-middle-progress': JSON.stringify({'binary-pixels': true}),
    'kv-computer-high-progress': JSON.stringify({'search-strategies': true}),
    'kv-computer-uni-progress': JSON.stringify({'stack-queue': true}),
    'kv-ai-uni-progress': JSON.stringify({'neuron-forward-pass': true}),
    'kv-computer-ai-high-progress': JSON.stringify({'classifier-lab': true}),
  }));
  await page.getByRole('button', {name: '合并导入'}).click();
  await expect(page.locator('#progress-backup-status')).toContainText('合并完成');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('kv-computer-middle-progress'))))
    .toEqual({'binary-pixels': true});
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('kv-computer-high-progress'))))
    .toEqual({'search-strategies': true});
  await expect(page.locator('[data-subject="computer"] .sp-label')).toContainText('已学 3/10');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('kv-computer-uni-progress'))))
    .toEqual({'stack-queue': true});
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('kv-ai-uni-progress'))))
    .toEqual({'neuron-forward-pass': true});
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('kv-computer-ai-high-progress'))))
    .toEqual({'classifier-lab': true});
});

test('异常文件或损坏的本机数据不会被覆盖', async ({page}) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('kv-science-progress', '{broken'));
  await page.getByText('备份或合并学习完成记录').click();
  await upload(page, backup({'kv-science-progress': '{"sound":1}'}));
  await expect(page.locator('#progress-backup-status')).toContainText('本机数据未修改');
  await expect(page.getByRole('button', {name: '合并导入'})).toBeDisabled();
  expect(await page.evaluate(() => localStorage.getItem('kv-science-progress'))).toBe('{broken');
  await upload(page, backup({'unrelated': '{}'}));
  await expect(page.locator('#progress-backup-status')).toContainText('不支持');
});

test('写入中途失败时恢复已写入的记录', async ({page}) => {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.setItem('kv-math-progress-v2', '{"primary:addition":123}');
    const original = Storage.prototype.setItem;
    let failed = false;
    Storage.prototype.setItem = function(key, value) {
      if (key === 'kv-science-progress' && !failed) { failed = true; throw new Error('denied'); }
      return original.call(this, key, value);
    };
  });
  await page.getByText('备份或合并学习完成记录').click();
  await upload(page, backup({'kv-math-progress-v2': '{"middle:linear-equation":5}', 'kv-science-progress': '{"sound":5}'}));
  await page.getByRole('button', {name: '合并导入'}).click();
  await expect(page.locator('#progress-backup-status')).toContainText('已恢复本次写入前的记录');
  expect(await page.evaluate(() => localStorage.getItem('kv-math-progress-v2'))).toBe('{"primary:addition":123}');
  expect(await page.evaluate(() => localStorage.getItem('kv-science-progress'))).toBeNull();
});

test('回滚也失败时明确提示可能部分变更', async ({page}) => {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.setItem('kv-math-progress-v2', '{"primary:addition":123}');
    const original = Storage.prototype.setItem;
    let failed = false;
    Storage.prototype.setItem = function(key, value) {
      if (key === 'kv-science-progress') { failed = true; throw new Error('denied'); }
      if (key === 'kv-math-progress-v2' && failed) throw new Error('rollback denied');
      return original.call(this, key, value);
    };
  });
  await page.getByText('备份或合并学习完成记录').click();
  await upload(page, backup({'kv-math-progress-v2': '{"middle:linear-equation":5}', 'kv-science-progress': '{"sound":5}'}));
  await page.getByRole('button', {name: '合并导入'}).click();
  await expect(page.locator('#progress-backup-status')).toContainText('部分记录可能已变更且无法自动恢复');
});

test('拒绝不安全的数据项和超大文件', async ({page}) => {
  await page.goto('/');
  await page.getByText('备份或合并学习完成记录').click();
  await upload(page, backup({'kv-science-progress': '{"__proto__":1}'}));
  await expect(page.locator('#progress-backup-status')).toContainText('不受支持');
  await page.locator('#progress-import-file').setInputFiles({name: 'large.json', mimeType: 'application/json', buffer: Buffer.alloc(1024 * 1024 + 1)});
  await expect(page.locator('#progress-backup-status')).toContainText('超过 1 MB');
  await expect(page.getByRole('button', {name: '合并导入'})).toBeDisabled();
});

test('本地文件模式可以导入完成记录', async ({page}) => {
  const path = require('node:path');
  const {pathToFileURL} = require('node:url');
  await page.goto(pathToFileURL(path.resolve(__dirname, '../../index.html')).href);
  await page.getByText('备份或合并学习完成记录').click();
  await upload(page, backup({'kv-science-progress': '{"sound":23}'}));
  await page.getByRole('button', {name: '合并导入'}).click();
  await expect(page.locator('#progress-backup-status')).toContainText('合并完成');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('kv-science-progress')).sound)).toBe(23);
});

test('存储不可读时不生成误导性的空备份', async ({page}) => {
  await page.addInitScript(() => { Storage.prototype.getItem = () => { throw new Error('denied'); }; });
  await page.goto('/');
  await page.getByText('备份或合并学习完成记录').click();
  await page.getByRole('button', {name: '导出完成记录'}).click();
  await expect(page.locator('#progress-backup-status')).toContainText('无法读取本地进度，未导出文件');
});
