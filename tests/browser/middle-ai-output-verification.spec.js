const {test, expect} = require('@playwright/test');

const pagePath = '/ai/middle/output-verification.html';
const correctAnswers = {
  size: 'supports',
  distance: 'contradicts',
  moons: 'supports',
  life: 'insufficient',
};

async function chooseAnswers(page, answers) {
  for (const [claim, value] of Object.entries(answers)) {
    await page.locator(`input[name="claim-${claim}"][value="${value}"]`).check();
  }
}

test('支持、反驳与证据不足按 NASA 资料反馈，全部正确后记录完成', async ({page}) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(pagePath);

  await expect(page.getByText('这是预先写好的教学示例，不是模型现场生成。')).toBeVisible();
  await expect(page.locator('.evidence-card')).toHaveCount(3);
  await expect(page.locator('.evidence-card a')).toHaveCount(3);
  await expect(page.locator('#progress-status')).toContainText('全部判断正确后');
  await chooseAnswers(page, correctAnswers);
  await page.getByRole('button', {name: '核对我的判断'}).click();

  await expect(page.locator('#feedback-size')).toContainText('约为地球大小的一半');
  await expect(page.locator('#feedback-distance')).toContainText('5,800 万千米');
  await expect(page.locator('#feedback-distance')).toContainText('2.279 亿千米');
  await expect(page.locator('#feedback-moons')).toContainText('Phobos 和 Deimos');
  await expect(page.locator('#feedback-life')).toContainText('不能据此断言生命存在或不存在');
  await expect(page.locator('#result-status')).toContainText('四条陈述都核验正确');
  await expect(page.locator('#progress-status')).toContainText('已在本机记录完成');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('kv-ai-middle-progress'))))
    .toEqual({'output-verification': true});
  expect(errors).toEqual([]);
});

test('漏答时聚焦未完成项目且不显示答案或完成进度', async ({page}) => {
  await page.goto(pagePath);
  await chooseAnswers(page, {size: 'supports', distance: 'contradicts', moons: 'supports'});
  await page.getByRole('button', {name: '核对我的判断'}).click();

  await expect(page.locator('#result-status')).toContainText('请为四条陈述各选一个分类');
  await expect(page.locator('input[name="claim-life"]').first()).toBeFocused();
  await expect(page.locator('#feedback-size')).toBeEmpty();
  expect(await page.evaluate(() => localStorage.getItem('kv-ai-middle-progress'))).toBeNull();
});

test('错误分类显示逐项依据，只有修正后全对才完成', async ({page}) => {
  await page.goto(pagePath);
  await chooseAnswers(page, {size: 'contradicts', distance: 'supports', moons: 'supports', life: 'contradicts'});
  await page.getByRole('button', {name: '核对我的判断'}).click();

  await expect(page.locator('#result-status')).toHaveText('已核对 1 / 4 条；查看逐项反馈，修改后可以再次核对。');
  await expect(page.locator('#feedback-size')).toContainText('正确分类为“证据支持”');
  await expect(page.locator('#feedback-life')).toContainText('正确分类为“证据不足”');
  expect(await page.evaluate(() => localStorage.getItem('kv-ai-middle-progress'))).toBeNull();

  await chooseAnswers(page, correctAnswers);
  await page.getByRole('button', {name: '核对我的判断'}).click();
  await expect(page.locator('#result-status')).toContainText('四条陈述都核验正确');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('kv-ai-middle-progress'))))
    .toEqual({'output-verification': true});
});

test('被拒绝写入进度时仍可核对并说明保存失败', async ({page}) => {
  await page.addInitScript(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === 'kv-ai-middle-progress') throw new Error('storage denied');
      return original.call(this, key, value);
    };
  });
  await page.goto(pagePath);
  await chooseAnswers(page, correctAnswers);
  await page.getByRole('button', {name: '核对我的判断'}).click();

  await expect(page.locator('#result-status')).toContainText('四条陈述都核验正确');
  await expect(page.locator('#progress-status')).toContainText('本机进度未能保存');
  expect(await page.evaluate(() => localStorage.getItem('kv-ai-middle-progress'))).toBeNull();
});

test('损坏的本机进度不阻止回答核验且不覆盖损坏内容', async ({page}) => {
  await page.addInitScript(() => localStorage.setItem('kv-ai-middle-progress', '{broken'));
  await page.goto(pagePath);
  await expect(page.locator('#progress-status')).toContainText('本机进度暂不可用');
  await chooseAnswers(page, correctAnswers);
  await page.getByRole('button', {name: '核对我的判断'}).click();

  await expect(page.locator('#result-status')).toContainText('四条陈述都核验正确');
  await expect(page.locator('#progress-status')).toContainText('本机进度未能保存');
  expect(await page.evaluate(() => localStorage.getItem('kv-ai-middle-progress'))).toBe('{broken');
});

test('键盘可以完成判断，320px 下证据和分类选项无横向溢出', async ({page}) => {
  await page.setViewportSize({width: 320, height: 800});
  await page.goto(pagePath);
  for (const [claim, value] of Object.entries(correctAnswers)) {
    const input = page.locator(`input[name="claim-${claim}"][value="${value}"]`);
    await input.focus();
    await page.keyboard.press('Space');
  }
  const submit = page.getByRole('button', {name: '核对我的判断'});
  await submit.focus();
  await page.keyboard.press('Enter');

  await expect(page.locator('#result-status')).toContainText('四条陈述都核验正确');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await expect(page.locator('.evidence-card a').first()).toBeVisible();
});

test('初中目录、首页搜索和学科总数包含新主题', async ({page}) => {
  await page.goto('/ai/middle/index.html');
  await expect(page.locator('#stage-progress')).toHaveText('已完成 0/4 个主题');
  await expect(page.locator('[data-topic-slug="output-verification"]')).toContainText('回答核验实验室');
  await page.goto('/');
  await expect(page.locator('.subject-card[href="ai/index.html"]')).toContainText('8 个知识点');
  await page.getByRole('combobox', {name: '学科', exact: true}).selectOption('ai');
  await page.getByRole('combobox', {name: '学段', exact: true}).selectOption('middle');
  await page.getByRole('searchbox', {name: '关键词'}).fill('回答核验');
  const result = page.locator('#site-results a[href="ai/middle/output-verification.html"]');
  await expect(result).toBeVisible();
  await result.click();
  await expect(page).toHaveURL(/\/ai\/middle\/output-verification\.html$/);
});
