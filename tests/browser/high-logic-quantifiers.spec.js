const {test, expect} = require('@playwright/test');
const {resolve} = require('node:path');
const {pathToFileURL} = require('node:url');
const {startReleaseServer} = require('./release-server');

const topic = process.env.KV_PUBLISHED_BASE_URL
  ? new URL('math/high/logic-quantifiers.html', process.env.KV_PUBLISHED_BASE_URL.replace(/\/?$/, '/')).href
  : '/math/high/logic-quantifiers.html';

async function choose(page, {forall, exists, counterexample, witness, allQuantifier = 'exists', allPolarity = 'not', existsQuantifier = 'forall', existsPolarity = 'not'}) {
  await page.locator(`input[name="forall-truth"][value="${forall}"]`).check();
  await page.locator(`input[name="exists-truth"][value="${exists}"]`).check();
  await page.locator('#universal-counterexample').selectOption(String(counterexample));
  await page.locator('#existential-witness').selectOption(String(witness));
  await page.locator('#negate-all-quantifier').selectOption(allQuantifier);
  await page.locator('#negate-all-polarity').selectOption(allPolarity);
  await page.locator('#negate-exists-quantifier').selectOption(existsQuantifier);
  await page.locator('#negate-exists-polarity').selectOption(existsPolarity);
  await page.getByRole('button', {name: '核对预测与否定式'}).click();
}

const examples = [
  ['all', {forall: 'yes', exists: 'yes', counterexample: 'none', witness: '2'}],
  ['mixed', {forall: 'no', exists: 'yes', counterexample: '0', witness: '1'}],
  ['none', {forall: 'no', exists: 'no', counterexample: '1', witness: 'none'}],
  ['empty', {forall: 'yes', exists: 'no', counterexample: 'none', witness: 'none'}]
];

test('混合域先错后改：量词和谓词都需否定，显示见证及反例', async ({page}) => {
  await page.goto(topic);
  await page.locator('#presets button[data-preset="mixed"]').click();
  await choose(page, {...examples[1][1], allPolarity: 'plain'});
  await expect(page.locator('#feedback')).toContainText('全称命题的否定还需否定谓词');
  await expect(page.locator('#result')).toBeHidden();
  await page.locator('#negate-all-polarity').selectOption('not');
  await expect(page.locator('#feedback')).toBeHidden();
  await page.getByRole('button', {name: '核对预测与否定式'}).click();
  await expect(page.locator('#result')).toContainText('0 是反例');
  await expect(page.locator('#result')).toContainText('1 是见证');
  await expect(page.locator('#result')).toContainText('¬(∀n∈U R(n)) ⇔ ∃n∈U ¬R(n)，两边均为真');
  await expect(page.locator('#result')).toContainText('¬(∃n∈U R(n)) ⇔ ∀n∈U ¬R(n)，两边均为假');
  await page.locator('input[name="forall-truth"][value="yes"]').check();
  await expect(page.locator('#result')).toBeHidden();
});

test('四类实例完成门槛独立于条件关系；自由改动不计完成', async ({page}) => {
  await page.goto(topic);
  for (const [id, values] of examples.slice(0, 3)) {
    await page.locator(`#presets button[data-preset="${id}"]`).click();
    await choose(page, values);
  }
  await expect(page.locator('#progress-status')).toContainText('3 / 4');
  await page.locator('#presets button[data-preset="empty"]').click();
  await page.getByRole('button', {name: '讨论域成员 1', exact: true}).click();
  await expect(page.locator('#presets button[data-preset="empty"]')).toHaveAttribute('aria-pressed', 'false');
  await choose(page, {forall: 'yes', exists: 'yes', counterexample: 'none', witness: '1'});
  await expect(page.locator('#progress-status')).toContainText('3 / 4');
  await page.locator('#presets button[data-preset="empty"]').click();
  await choose(page, examples[3][1]);
  await expect(page.locator('#progress-status')).toContainText('4 / 4');
  await expect(page.locator('#result')).toContainText('学习进度已保存');
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('kv-math-progress-v2')));
  expect(stored['high:logic-quantifiers']).toBeTruthy();
  expect(stored['high:logic-conditions']).toBeUndefined();
  await page.goto(process.env.KV_PUBLISHED_BASE_URL ? new URL('math/high/index.html', process.env.KV_PUBLISHED_BASE_URL.replace(/\/?$/, '/')).href : '/math/high/index.html');
  await expect(page.locator('a[href="logic-quantifiers.html"] .progress-badge')).toBeVisible();
});

test('全真、全假和空域的真值、否定与证据符合定义', async ({page}) => {
  await page.goto(topic);
  for (const [id, values] of [examples[0], examples[2], examples[3]]) {
    await page.locator(`#presets button[data-preset="${id}"]`).click();
    await choose(page, values);
    await expect(page.locator('#feedback')).toContainText('均正确');
    await expect(page.locator('#result')).toContainText('两边均为');
  }
  await expect(page.locator('#result')).toContainText('空域中没有成员，全称命题为真、存在命题为假');
  await expect(page.locator('#result')).toContainText('¬(∀n∈U R(n)) ⇔ ∃n∈U ¬R(n)，两边均为假');
  await expect(page.locator('#result')).toContainText('¬(∃n∈U R(n)) ⇔ ∀n∈U ¬R(n)，两边均为真');
});

test('320px 键盘修改讨论域与构造式，页面无横向溢出', async ({page}) => {
  await page.setViewportSize({width: 320, height: 740});
  await page.goto(topic);
  await page.locator('#presets button[data-preset="empty"]').click();
  const member = page.getByRole('button', {name: '讨论域成员 1', exact: true});
  await member.focus();
  await page.keyboard.press('Enter');
  await expect(member).toHaveAttribute('aria-pressed', 'true');
  await choose(page, {forall: 'yes', exists: 'yes', counterexample: 'none', witness: '1'});
  await expect(page.locator('#result')).toContainText('1 是见证');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});

test('进度保存失败保留结果并可重试', async ({page}) => {
  await page.addInitScript(() => {
    window.__allowProgressWrite = false;
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === 'kv-math-progress-v2' && !window.__allowProgressWrite) throw new Error('blocked');
      return original.call(this, key, value);
    };
  });
  await page.goto(topic);
  for (const [id, values] of examples) {
    await page.locator(`#presets button[data-preset="${id}"]`).click();
    await choose(page, values);
  }
  await expect(page.locator('#math-progress-save-notice')).toContainText('暂未保存');
  await expect(page.locator('#result')).toContainText('空域中没有成员');
  await page.evaluate(() => { window.__allowProgressWrite = true; });
  await page.getByRole('button', {name: '重试保存'}).click();
  await expect(page.locator('#math-progress-save-notice')).toContainText('已保存');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('kv-math-progress-v2'))['high:logic-quantifiers'])).toBeTruthy();
});

test('直接文件和发布子路径都能加载模型并完成量词任务', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '公网路径由上方共用用例验证');
  await page.goto(pathToFileURL(resolve(__dirname, '../../math/high/logic-quantifiers.html')).href);
  await page.locator('#presets button[data-preset="mixed"]').click();
  await choose(page, examples[1][1]);
  await expect(page.locator('#result')).toContainText('0 是反例');
  const release = await startReleaseServer();
  try {
    const response = await page.goto(new URL('math/high/logic-quantifiers.html', release.base).href);
    expect(response.status()).toBe(200);
    await page.locator('#presets button[data-preset="empty"]').click();
    await choose(page, examples[3][1]);
    await expect(page.locator('#result')).toContainText('空域中没有成员');
  } finally { await release.close(); }
});
