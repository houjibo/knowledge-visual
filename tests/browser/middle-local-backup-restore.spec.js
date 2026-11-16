const {test, expect} = require('@playwright/test');
const fs = require('node:fs/promises');
const {resolve} = require('node:path');
const {pathToFileURL} = require('node:url');
const {startReleaseServer} = require('./release-server');
const topic = process.env.KV_PUBLISHED_BASE_URL
  ? new URL('computer/middle/local-backup-restore.html', process.env.KV_PUBLISHED_BASE_URL.replace(/\/?$/, '/')).href
  : '/computer/middle/local-backup-restore.html';
const key = 'kv-computer-middle-progress';
async function download(page) {
  const [file] = await Promise.all([page.waitForEvent('download'), page.locator('#download-backup').click()]);
  return {file, path:await file.path()};
}
async function upload(page,path) {
  await page.locator('#backup-file').setInputFiles(path);
  await expect(page.locator('#file-feedback')).toContainText('文件格式有效');
}
async function recovery(page) {
  const file = await download(page);
  await page.locator('#simulate-loss').click();
  await upload(page,file.path);
  await page.locator('#restore-backup').click();
}
async function answer(page) {
  await page.getByRole('radio',{name:/两者可能同时丢失/}).check();
  await page.locator('#check-conclusion').click();
}

test('实际下载、模拟丢失、选择文件和恢复后判断独立副本', async ({page}) => {
  await page.goto(topic);
  await page.locator('#workspace-text').fill('虚构观测：晴天\n第二行');
  await page.locator('#download-backup').click();
  await expect(page.locator('#backup-feedback')).toContainText('草稿尚未保存');
  await page.locator('#simulate-loss').click();
  await expect(page.locator('#workspace-text')).toHaveValue('虚构观测：晴天\n第二行');
  await page.locator('#save-work').click();
  await expect(page.locator('#workspace-revision')).toContainText('版本 2');
  const saved = await download(page);
  expect(saved.file.suggestedFilename()).toBe('knowledge-visual-backup-practice.json');
  const snapshot = JSON.parse(await fs.readFile(saved.path,'utf8'));
  expect(snapshot).toEqual({kind:'kv-backup-practice',schema_version:1,revision:2,text:'虚构观测：晴天\n第二行'});
  await expect(page.locator('#backup-feedback')).toContainText('已请求下载');
  await page.locator('#simulate-loss').click();
  await expect(page.locator('#workspace-text')).toBeDisabled();
  await expect(page.locator('#workspace-preview')).toContainText('没有工作版本');
  await upload(page,saved.path);
  await expect(page.locator('#file-preview')).toHaveText(snapshot.text);
  await expect(page.locator('#workspace-text')).toBeDisabled();
  await page.locator('#restore-backup').click();
  await expect(page.locator('#workspace-text')).toHaveValue(snapshot.text);
  await expect(page.locator('#file-feedback')).toContainText('不能据此确认文件来源或保存位置');
  await page.getByRole('radio',{name:/同一设备损毁后一定可以恢复/}).check();
  await page.locator('#check-conclusion').click();
  await expect(page.locator('#conclusion-feedback')).toContainText('都可能丢失');
  await answer(page);
  await expect(page.locator('#progress-status')).toContainText('已记录');
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)),key)).toEqual({'local-backup-restore':true});
  await page.reload();
  await expect(page.locator('#progress-status')).toContainText('此前已记录');
  await expect(page.locator('#check-conclusion')).toBeDisabled();
  await page.getByRole('link',{name:'← 返回初中计算机'}).click();
  await expect(page.locator('[data-topic-slug="local-backup-restore"] [data-completion]')).toContainText('已完成');
  await expect(page.locator('#stage-progress')).toContainText('1/9');
  await page.getByRole('link',{name:'首页',exact:true}).click();
  await expect(page.locator('[data-subject="computer"]')).toHaveAttribute('data-total','24');
});

test('旧版本与当前版本不同，预览不覆盖且未保存草稿阻止恢复', async ({page}) => {
  await page.goto(topic); const old = await download(page);
  await page.locator('#workspace-text').fill('新的工作文本');
  await upload(page,old.path);
  await expect(page.locator('#comparison')).toContainText('未保存草稿不参与比较');
  await page.locator('#restore-backup').click();
  await expect(page.locator('#file-feedback')).toContainText('草稿尚未保存');
  await expect(page.locator('#workspace-text')).toHaveValue('新的工作文本');
  await page.locator('#save-work').click();
  await expect(page.locator('#comparison')).toContainText('内容或版本不同');
  await page.locator('#restore-backup').click();
  await expect(page.locator('#workspace-revision')).toContainText('版本 1');
  await expect(page.locator('#check-conclusion')).toBeDisabled();
});

test('错误、过大和不可信内容不自动覆盖或执行', async ({page}) => {
  await page.goto(topic);
  await page.locator('#backup-file').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{bad')});
  await expect(page.locator('#file-feedback')).toContainText('无效');
  await expect(page.locator('#restore-backup')).toBeDisabled();
  await page.locator('#backup-file').setInputFiles({name:'large.json',mimeType:'application/json',buffer:Buffer.alloc(8193,65)});
  await expect(page.locator('#file-feedback')).toContainText('超过 8 KiB');
  const text = '<img src=x onerror="window.injected=true">';
  const data = {kind:'kv-backup-practice',schema_version:1,revision:5,text};
  await upload(page,{name:'safe.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(data))});
  await expect(page.locator('#file-preview')).toHaveText(text);
  expect(await page.evaluate(() => window.injected)).toBeUndefined();
  await expect(page.locator('#workspace-revision')).toContainText('版本 1');
  await page.locator('#restore-backup').click();
  await expect(page.locator('#workspace-text')).toHaveValue(text);
  expect(await page.evaluate(() => window.injected)).toBeUndefined();
});

test('较慢的旧文件读取不能覆盖较新的选择或丢失状态', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '仅本机注入延迟读取');
  await page.addInitScript(() => {
    const original = File.prototype.text;
    File.prototype.text = function() {
      if (this.name !== 'slow.json') return original.call(this);
      return new Promise(resolve => { window.finishSlow = () => original.call(this).then(resolve); });
    };
  });
  await page.goto(topic); await download(page);
  const makeFile = (name,text) => ({name,mimeType:'application/json',buffer:Buffer.from(JSON.stringify({kind:'kv-backup-practice',schema_version:1,revision:1,text}))});
  await page.locator('#backup-file').setInputFiles(makeFile('slow.json','旧读取'));
  await expect.poll(() => page.evaluate(() => typeof window.finishSlow)).toBe('function');
  await upload(page,makeFile('fast.json','新读取'));
  await page.evaluate(() => window.finishSlow());
  await expect(page.locator('#file-preview')).toHaveText('新读取');
  await page.locator('#backup-file').setInputFiles(makeFile('slow.json','丢失前读取'));
  await expect(page.locator('#file-feedback')).toContainText('正在读取');
  await page.locator('#simulate-loss').click();
  await page.evaluate(() => window.finishSlow());
  await expect(page.locator('#file-revision')).toHaveText('尚未选择有效文件');
  await expect(page.locator('#restore-backup')).toBeDisabled();
});

test('本机进度拒写时不丢失练习结果，可恢复后重试', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '仅本机注入存储故障');
  await page.addInitScript(key => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function(name,value) { if(name === key) throw new Error('denied'); return original.call(this,name,value); };
    window.restoreWrites = () => { Storage.prototype.setItem = original; };
  },key);
  await page.goto(topic); await recovery(page); await answer(page);
  await expect(page.locator('#progress-status')).toContainText('未保存');
  await page.evaluate(() => window.restoreWrites());
  await page.locator('#retry-save').click();
  await expect(page.locator('#progress-status')).toContainText('已记录');
});

test('320px 键盘、文件直开和发布子路径', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '仅本机文件和发布包');
  await page.setViewportSize({width:320,height:740});
  await page.goto(pathToFileURL(resolve(__dirname,'../../computer/middle/local-backup-restore.html')).href);
  await page.locator('#download-backup').focus();
  const [file] = await Promise.all([page.waitForEvent('download'),page.keyboard.press('Enter')]);
  await page.locator('#simulate-loss').click();
  await upload(page,await file.path());
  await page.locator('#restore-backup').click();
  await expect(page.locator('#workspace-revision')).toContainText('版本 1');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  const release = await startReleaseServer();
  try {
    await page.goto(new URL('computer/middle/local-backup-restore.html',release.base).href);
    await expect(page.locator('#workspace-revision')).toContainText('版本 1');
    await recovery(page); await answer(page);
    await expect(page.locator('#progress-status')).toContainText('已记录');
  } finally { await release.close(); }
});

test('不访问外部网络，模型加载失败时控件保持禁用', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '仅本机拦截');
  const external=[];
  page.on('request', request => { if (!request.url().startsWith('http://127.0.0.1:4183/')) external.push(request.url()); });
  await page.goto(topic); await recovery(page);
  expect(external).toEqual([]);
  await page.route('**/computer/middle/assets/local-backup-model.js', route => route.abort());
  await page.reload();
  await expect(page.locator('#workspace-feedback')).toContainText('加载失败');
  await expect(page.locator('#download-backup')).toBeDisabled();
});

test('进度记录损坏时保留原文，修复后可重试', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '仅本机注入损坏记录');
  await page.addInitScript(key => { localStorage.setItem(key,'{broken'); }, key);
  await page.goto(topic); await recovery(page); await answer(page);
  await expect(page.locator('#progress-status')).toContainText('未保存');
  expect(await page.evaluate(key => localStorage.getItem(key),key)).toBe('{broken');
  await page.evaluate(key => localStorage.setItem(key,'{}'),key);
  await page.locator('#retry-save').click();
  await expect(page.locator('#progress-status')).toContainText('已记录');
});
