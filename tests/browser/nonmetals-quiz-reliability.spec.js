const {test, expect} = require('@playwright/test');
const {resolve} = require('node:path');
const {pathToFileURL} = require('node:url');

const topic = process.env.KV_PUBLISHED_BASE_URL
  ? new URL('chemistry/high/nonmetals.html', process.env.KV_PUBLISHED_BASE_URL.replace(/\/?$/, '/')).href
  : '/chemistry/high/nonmetals.html';
const progressKey = 'kv-chemistry-high-progress';
const correctAnswers = [1, 1, 1, 1, 3];

async function openQuiz(page, url = topic) {
  await page.goto(url);
  await page.getByRole('tab', {name: /互动练习/}).click();
}

async function choose(page, index, touch = false) {
  const option = page.locator('#quiz-options button').nth(index);
  if (touch) await option.tap();
  else await option.click();
}

async function answerRound(page, answers, touch = false) {
  for (const [index, answer] of answers.entries()) {
    await expect(page.locator('#quiz-progress')).toHaveText(`${index + 1}/5`);
    await expect(page.locator('#quiz-next')).toBeDisabled();
    await choose(page, answer, touch);
    await expect(page.locator('#quiz-answered')).toHaveText(`${index + 1}/5`);
    if (index < answers.length - 1) await page.locator('#quiz-next').click();
  }
}

test('首次答案在返回和切换主题后保留，重复操作不增加得分', async ({page}) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await openQuiz(page);
  await expect(page.locator('#quiz-score')).toHaveText('0');
  await expect(page.locator('#quiz-answered')).toHaveText('0/5');
  await expect(page.locator('#quiz-next')).toBeDisabled();
  const firstAnswer = page.locator('#quiz-options button').nth(1);
  await page.keyboard.press('Tab');
  await expect(page.locator('#stage-quiz')).toBeFocused();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await expect(firstAnswer).toBeFocused();
  await expect(firstAnswer).toHaveCSS('outline-style', 'solid');
  await firstAnswer.press('Enter');
  await expect(page.locator('#quiz-score')).toHaveText('1');
  await expect(page.locator('#quiz-options button:disabled')).toHaveCount(4);
  await expect(page.locator('#quiz-feedback')).toContainText('黄绿色');
  await expect(page.locator('#quiz-options button').nth(1)).toContainText('你的选择');

  await page.locator('#quiz-next').click();
  await expect(page.locator('#quiz-question')).toBeFocused();
  await choose(page, 0);
  await expect(page.locator('#quiz-score')).toHaveText('1');
  await expect(page.locator('#quiz-feedback')).toContainText('MnO₂');
  await page.locator('#quiz-prev').click();
  await expect(page.locator('#quiz-options button:disabled')).toHaveCount(4);
  await expect(page.locator('#quiz-options button').nth(1)).toContainText('你的选择');
  await expect(page.locator('#quiz-score')).toHaveText('1');
  await page.getByRole('tab', {name: /元素特性/}).click();
  await page.getByRole('tab', {name: /互动练习/}).click();
  await expect(page.locator('#quiz-score')).toHaveText('1');
  await expect(page.locator('#quiz-answered')).toHaveText('2/5');
  await expect(page.locator('#quiz-options button:disabled')).toHaveCount(4);
  await expect(page.locator('#quiz-feedback')).toContainText('黄绿色');
  await page.locator('#quiz-next').click();
  await expect(page.locator('#quiz-options button').nth(0)).toContainText('你的选择');
  await expect(page.locator('#quiz-options button').nth(1)).toContainText('正确答案');
  await expect(page.locator('#quiz-score')).toHaveText('1');
  expect(errors).toEqual([]);
});

test('第五题按指定产物区分 NaHCO₃ 与 Al(OH)₃，反馈给出平衡反应', async ({page}) => {
  await openQuiz(page);
  for (let i = 0; i < 4; i++) {
    await choose(page, 0);
    await page.locator('#quiz-next').click();
  }
  await expect(page.locator('#quiz-question')).toContainText('稀盐酸');
  await expect(page.locator('#quiz-question')).toContainText('CO₂');
  await expect(page.locator('#quiz-question')).toContainText('Na₂CO₃');
  await choose(page, 1);
  await expect(page.locator('#quiz-score')).toHaveText('0');
  await expect(page.locator('#quiz-options button').nth(1)).toContainText('你的选择');
  await expect(page.locator('#quiz-options button').nth(3)).toContainText('正确答案');
  await expect(page.locator('#quiz-feedback')).toContainText('NaHCO₃ + HCl → NaCl + CO₂↑ + H₂O');
  await expect(page.locator('#quiz-feedback')).toContainText('NaHCO₃ + NaOH → Na₂CO₃ + H₂O');
  await expect(page.locator('#quiz-feedback')).toContainText('Al(OH)₃');
  await expect(page.locator('#quiz-feedback')).toContainText('强酸');
  await expect(page.locator('#quiz-feedback')).toContainText('强碱');
  await expect(page.locator('#quiz-feedback')).toHaveAttribute('role', 'status');
});

for (const [label, answers, score] of [
  ['全错', [0, 0, 0, 0, 0], 0],
  ['两题正确', [1, 1, 0, 0, 0], 2],
  ['三题正确', [1, 1, 1, 0, 0], 3],
  ['全部正确', correctAnswers, 5],
]) {
  test(`${label}按完整回合判定，回看及重做保留已有完成记录`, async ({page}, testInfo) => {
    await openQuiz(page);
    await answerRound(page, answers, testInfo.project.name === 'mobile');
    await expect(page.locator('#quiz-score')).toHaveText(String(score));
    await expect(page.locator('#quiz-result')).toBeHidden();
    expect(await page.evaluate(key => localStorage.getItem(key), progressKey)).toBeNull();
    await page.locator('#quiz-next').click();
    await expect(page.locator('#quiz-result')).toContainText(`本轮得分 ${score}/5`);
    await expect(page.locator('#quiz-next')).toBeDisabled();
    const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), progressKey);
    if (score >= 3) {
      expect(saved.nonmetals).toBeGreaterThan(0);
      await expect(page.locator('#quiz-save-status')).toContainText('已保存');
      await expect(page.locator('#done-mark')).toContainText('已完成');
    } else {
      expect(saved).toBeNull();
      await expect(page.locator('#quiz-result')).toContainText('未达标');
      await expect(page.locator('#done-mark')).toHaveText('');
    }
    await expect(page.locator('#quiz-save-retry')).toBeHidden();
    await page.locator('#quiz-prev').click();
    await expect(page.locator('#quiz-options button:disabled')).toHaveCount(4);
    await expect(page.locator('#quiz-result')).toContainText(`本轮得分 ${score}/5`);
    await page.getByRole('tab', {name: /转化关系/}).click();
    await page.getByRole('tab', {name: /互动练习/}).click();
    await expect(page.locator('#quiz-score')).toHaveText(String(score));
    expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), progressKey)).toEqual(saved);

    await page.getByRole('button', {name: '重新练习', exact: true}).click();
    await expect(page.locator('#quiz-progress')).toHaveText('1/5');
    await expect(page.locator('#quiz-score')).toHaveText('0');
    await expect(page.locator('#quiz-answered')).toHaveText('0/5');
    await expect(page.locator('#quiz-options button:enabled')).toHaveCount(4);
    await expect(page.locator('#quiz-result')).toBeHidden();
    await expect(page.locator('#quiz-next')).toBeDisabled();
    expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), progressKey)).toEqual(saved);
  });
}

test('达标写入失败时保留结果，恢复后可重试保存', async ({page}) => {
  await page.addInitScript(key => {
    window.rejectQuizProgress = true;
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (name, value) {
      if (name === key && window.rejectQuizProgress) throw new Error('storage denied');
      return original.call(this, name, value);
    };
  }, progressKey);
  await openQuiz(page);
  await answerRound(page, [1, 1, 1, 0, 0]);
  await page.locator('#quiz-next').click();
  await expect(page.locator('#quiz-result')).toContainText('本轮得分 3/5');
  await expect(page.locator('#quiz-save-status')).toContainText('未保存');
  await expect(page.locator('#done-mark')).toContainText('未保存');
  expect(await page.evaluate(key => localStorage.getItem(key), progressKey)).toBeNull();
  await page.getByRole('button', {name: '重试保存', exact: true}).click();
  await expect(page.locator('#quiz-save-status')).toContainText('未保存');
  await page.evaluate(() => { window.rejectQuizProgress = false; });
  await page.getByRole('button', {name: '重试保存', exact: true}).click();
  await expect(page.locator('#quiz-save-status')).toContainText('已保存');
  await expect(page.locator('#quiz-score')).toHaveText('3');
  await expect(page.locator('#done-mark')).toContainText('✓ 已完成');
  await expect(page.locator('#done-mark')).not.toContainText('未保存');
  await expect(page.locator('#quiz-save-retry')).toBeHidden();
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).nonmetals, progressKey)).toBeGreaterThan(0);
});

test('损坏进度原文不被覆盖，作答与重做仍可使用', async ({page}) => {
  await page.addInitScript(key => localStorage.setItem(key, '{broken-record'), progressKey);
  await openQuiz(page);
  await answerRound(page, correctAnswers);
  await page.locator('#quiz-next').click();
  await expect(page.locator('#quiz-result')).toContainText('本轮得分 5/5');
  await expect(page.locator('#quiz-save-status')).toContainText('未保存');
  await page.getByRole('button', {name: '重试保存', exact: true}).click();
  expect(await page.evaluate(key => localStorage.getItem(key), progressKey)).toBe('{broken-record');
  await page.getByRole('button', {name: '重新练习', exact: true}).click();
  await expect(page.locator('#quiz-options button:enabled')).toHaveCount(4);
  expect(await page.evaluate(key => localStorage.getItem(key), progressKey)).toBe('{broken-record');
});

test('低分回合与重做不会撤销已保存主题或覆盖其他主题', async ({page}) => {
  const previous = {nonmetals: 12345, 'mole-concept': 67890};
  await page.addInitScript(({key, value}) => localStorage.setItem(key, JSON.stringify(value)), {key: progressKey, value: previous});
  await openQuiz(page);
  await expect(page.locator('#done-mark')).toContainText('已完成');
  await answerRound(page, [0, 0, 0, 0, 0]);
  await page.locator('#quiz-next').click();
  await expect(page.locator('#quiz-result')).toContainText('未达标');
  await expect(page.locator('#done-mark')).toContainText('已完成');
  await page.getByRole('button', {name: '重新练习', exact: true}).click();
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), progressKey)).toEqual(previous);
});

test('320px 下可用 Space/Enter 完整作答，题设和结果不溢出', async ({page}) => {
  await page.setViewportSize({width: 320, height: 844});
  await openQuiz(page);
  for (const [index, answer] of correctAnswers.entries()) {
    const option = page.locator('#quiz-options button').nth(answer);
    await option.focus();
    await option.press(index % 2 ? 'Enter' : 'Space');
    await expect(page.locator('#quiz-options button:disabled')).toHaveCount(4);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
    await page.locator('#quiz-next').click();
  }
  await expect(page.locator('#quiz-result')).toContainText('本轮得分 5/5');
  await expect(page.getByRole('button', {name: '重新练习', exact: true})).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});

test('直接打开文件也能完成回合，学习交互不发出外部请求', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '公网验收只检查已发布站点');
  const externalRequests = [], errors = [];
  page.on('request', request => { if (/^https?:/.test(request.url())) externalRequests.push(request.url()); });
  page.on('pageerror', error => errors.push(error.message));
  await openQuiz(page, pathToFileURL(resolve(__dirname, '../../chemistry/high/nonmetals.html')).href);
  await answerRound(page, correctAnswers);
  await page.locator('#quiz-next').click();
  await expect(page.locator('#quiz-result')).toContainText('本轮得分 5/5');
  expect(externalRequests).toEqual([]);
  expect(errors).toEqual([]);
});
