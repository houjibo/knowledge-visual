const {test, expect} = require('@playwright/test');
const {resolve} = require('node:path');
const {pathToFileURL} = require('node:url');
const {startReleaseServer} = require('./release-server');

const topic = process.env.KV_PUBLISHED_BASE_URL
  ? new URL('computer/middle/online-learning-modes.html', process.env.KV_PUBLISHED_BASE_URL.replace(/\/?$/, '/')).href
  : '/computer/middle/online-learning-modes.html';
const progressKey = 'kv-computer-middle-progress';

async function answer(page, mode, reason) {
  await page.locator('#mode-choice').selectOption(mode);
  await page.locator('#reason-choice').selectOption(reason);
  await page.locator('#check-choice').click();
}

async function completeAll(page) {
  await answer(page, 'live', 'immediate');
  await page.locator('#change-time-button').click();
  await answer(page, 'board', 'flexible');
  await page.locator('#scenario').selectOption('club-plan');
  await answer(page, 'board', 'flexible');
  await page.locator('#scenario').selectOption('classroom-offline');
  await answer(page, 'face', 'nearby');
  await page.getByRole('radio', {name: /距离、共同时间、网络和任务要求/}).check();
  await page.locator('#check-conclusion').click();
}

test('remote question changes when shared time disappears, including feasibility feedback', async ({page}) => {
  await page.goto(topic);
  await expect(page.locator('#task-text')).toContainText('两地同学');
  await expect(page.locator('#schedule-summary')).toContainText('两人有共同时间');
  await expect(page.locator('[data-person="a"][data-time="18:00"]')).toHaveText('可');
  await expect(page.locator('[data-person="b"][data-time="18:00"]')).toHaveText('可');
  await expect(page.locator('#mode-live .mode-status')).toHaveText('提交后显示可行性');
  await page.locator('#check-choice').click();
  await expect(page.locator('#choice-feedback')).toContainText('先选择');
  await answer(page, 'board', 'flexible');
  await expect(page.locator('#choice-feedback')).toContainText('可行，但不优先');
  await expect(page.locator('#mode-board .mode-status')).toHaveText('可行但不优先');
  await expect(page.locator('#challenge-remote-question')).toContainText('待完成');
  await answer(page, 'live', 'immediate');
  await expect(page.locator('#challenge-remote-question')).toContainText('本轮已完成');
  await expect(page.locator('#mode-live .mode-status')).toContainText('本情境推荐');
  await page.locator('#change-time-button').click();
  await expect(page.locator('#schedule-summary')).toContainText('两人没有共同时间');
  await expect(page.locator('[data-person="b"][data-time="18:00"]')).toHaveText('—');
  await expect(page.locator('[data-person="b"][data-time="20:00"]')).toHaveText('可');
  await expect(page.locator('#mode-live .mode-status')).toHaveText('提交后显示可行性');
  await answer(page, 'live', 'immediate');
  await expect(page.locator('#choice-feedback')).toContainText('不可行');
  await expect(page.locator('#mode-live .mode-status')).toHaveText('当前不可行');
  await answer(page, 'board', 'flexible');
  await expect(page.locator('#choice-feedback')).toContainText('不能保证即时答疑');
  await expect(page.locator('#challenge-remote-shifted')).toContainText('本轮已完成');
});

test('club and classroom cases expose delayed and offline conditions without universal claims', async ({page}) => {
  await page.goto(topic);
  await page.locator('#scenario').selectOption('club-plan');
  await expect(page.locator('#task-text')).toContainText('活动建议');
  await expect(page.locator('#overlap-value')).toHaveText('没有');
  await answer(page, 'board', 'flexible');
  await expect(page.locator('#challenge-club-plan')).toContainText('本轮已完成');
  await page.locator('#scenario').selectOption('classroom-offline');
  await expect(page.locator('#place-value')).toHaveText('同一教室');
  await expect(page.locator('#network-value')).toHaveText('暂不可用');
  await answer(page, 'face', 'immediate');
  await expect(page.locator('#choice-feedback')).toContainText('主要依据应是');
  await expect(page.locator('#challenge-classroom-offline')).toContainText('待完成');
  await answer(page, 'face', 'nearby');
  await expect(page.locator('#mode-board .mode-status')).toHaveText('当前不可行');
  await expect(page.locator('#challenge-classroom-offline')).toContainText('本轮已完成');
  await expect(page.locator('#check-conclusion')).toBeDisabled();
});

test('four conditional choices and a qualified conclusion save completion only after this session', async ({page}) => {
  await page.goto(topic);
  await completeAll(page);
  await expect(page.locator('#progress-status')).toContainText('本机已记录完成');
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), progressKey)).toEqual({'online-learning-modes': true});
  await page.reload();
  await expect(page.locator('#challenge-remote-question')).toContainText('待完成');
  await expect(page.locator('#progress-status')).toContainText('本机此前已记录完成');
  await expect(page.locator('#check-conclusion')).toBeDisabled();
});

test('wrong conclusion does not save, and storage denial can be retried', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '公网测试不改写存储实现');
  await page.addInitScript(key => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (name, value) {
      if (name === key) throw new Error('denied');
      return original.call(this, name, value);
    };
    window.restoreProgressWrites = () => { Storage.prototype.setItem = original; };
  }, progressKey);
  await page.goto(topic);
  await answer(page, 'live', 'immediate');
  await page.locator('#change-time-button').click();
  await answer(page, 'board', 'flexible');
  await page.locator('#scenario').selectOption('club-plan');
  await answer(page, 'board', 'flexible');
  await page.locator('#scenario').selectOption('classroom-offline');
  await answer(page, 'face', 'nearby');
  await page.getByRole('radio', {name: /只要能联网/}).check();
  await page.locator('#check-conclusion').click();
  await expect(page.locator('#conclusion-feedback')).toContainText('并非总是');
  expect(await page.evaluate(key => localStorage.getItem(key), progressKey)).toBeNull();
  await page.getByRole('radio', {name: /距离、共同时间、网络和任务要求/}).check();
  await page.locator('#check-conclusion').click();
  await expect(page.locator('#progress-status')).toContainText('未能保存');
  await page.evaluate(() => window.restoreProgressWrites());
  await page.locator('#retry-save').click();
  await expect(page.locator('#progress-status')).toContainText('本机已记录完成');
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), progressKey)).toEqual({'online-learning-modes': true});
});

test('home search, counts and stage directory discover the new topic', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '公网发现由发布后验收');
  await page.goto('/');
  await expect(page.locator('[data-subject="computer"]')).toHaveAttribute('data-total', '14');
  await page.getByRole('combobox', {name: '学科', exact: true}).selectOption('computer');
  await page.getByRole('combobox', {name: '学段', exact: true}).selectOption('middle');
  await page.getByRole('searchbox', {name: '关键词'}).fill('交流方式选择');
  await page.locator('#site-results a[href="computer/middle/online-learning-modes.html"]').click();
  await completeAll(page);
  await page.locator('.footer-nav a[href="index.html"]').click();
  await expect(page.locator('#stage-progress')).toContainText('1/7');
  await expect(page.locator('[data-topic-slug="online-learning-modes"] [data-completion]')).toContainText('已完成');
  await page.goto('/');
  await expect(page.locator('[data-subject="computer"] .sp-label')).toContainText('已学 1/14');
});

test('controls stay disabled while the lesson controller loads', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '公网专项不延迟脚本');
  await page.route('**/computer/middle/assets/online-learning-modes.js', async route => {
    await new Promise(resolve => setTimeout(resolve, 700));
    await route.continue();
  });
  await page.goto(topic, {waitUntil: 'commit'});
  for (const id of ['scenario', 'change-time-button', 'mode-choice', 'reason-choice', 'check-choice', 'check-conclusion']) {
    await expect(page.locator(`#${id}`)).toBeDisabled();
  }
  await page.waitForLoadState('domcontentloaded');
  await expect(page.locator('#scenario')).toBeEnabled();
  await expect(page.locator('#change-time-button')).toBeEnabled();
});

test('320px keyboard, direct file and release subpath retain the same decision activity', async ({page}) => {
  await page.setViewportSize({width: 320, height: 740});
  await page.emulateMedia({reducedMotion: 'reduce'});
  await page.goto(topic);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await page.locator('#mode-choice').selectOption('live');
  await page.locator('#reason-choice').selectOption('immediate');
  await page.locator('#check-choice').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#challenge-remote-question')).toContainText('本轮已完成');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  if (process.env.KV_PUBLISHED_BASE_URL) return;

  await page.goto(pathToFileURL(resolve(__dirname, '../../computer/middle/online-learning-modes.html')).href);
  await page.locator('#scenario').selectOption('classroom-offline');
  await answer(page, 'face', 'nearby');
  await expect(page.locator('#challenge-classroom-offline')).toContainText('本轮已完成');
  const release = await startReleaseServer();
  try {
    const response = await page.goto(new URL('computer/middle/online-learning-modes.html', release.base).href);
    expect(response.status()).toBe(200);
    await completeAll(page);
    await expect(page.locator('#progress-status')).toContainText('本机已记录完成');
  } finally { await release.close(); }
});
