const {test, expect} = require('@playwright/test');
const {resolve} = require('node:path');
const {pathToFileURL} = require('node:url');
const {startReleaseServer} = require('./release-server');

const topic = process.env.KV_PUBLISHED_BASE_URL
  ? new URL('chemistry/high/organic.html', process.env.KV_PUBLISHED_BASE_URL.replace(/\/?$/, '/')).href
  : '/chemistry/high/organic.html';
const progressKey = 'kv-chemistry-high-progress';
const answers = ['丁烷', '异丁烷', '丙烯', '乙炔', '2-丁烯'];

async function answerFive(page) {
  await page.getByRole('tab', {name: /命名练习/}).click();
  for (const [index, answer] of answers.entries()) {
    await expect(page.locator('#naming-question')).toContainText(`第 ${index + 1} / 8 题`);
    await page.locator('#namingOpts').getByRole('button', {name: answer, exact: true}).click();
    await expect(page.locator('#namingFb')).toContainText('正确');
    if (index < 4) {
      await page.locator('#namingNext').click();
      await expect(page.locator('#naming-question')).toBeFocused();
    }
  }
}

test('四主题是单一停靠点的页签，方向键和原生键可切换实际内容', async ({page}) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(topic);
  const tabs = page.getByRole('tablist', {name: '有机化学学习主题'}).getByRole('tab');
  const panels = page.locator('[role="tabpanel"]');
  await expect(tabs).toHaveCount(4);
  await expect(panels).toHaveCount(4);
  await expect(page.locator('#organic-panel-structure')).toBeVisible();
  await expect(page.locator('#organic-panel-isomer')).toBeHidden();
  await page.keyboard.press('Tab');
  await expect(tabs.nth(0)).toBeFocused();
  await expect(tabs.nth(0)).toHaveCSS('outline-style', 'solid');
  await page.keyboard.press('ArrowRight');
  await expect(tabs.nth(1)).toBeFocused();
  await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
  await expect(tabs.nth(1)).toHaveAttribute('tabindex', '0');
  await expect(page.locator('#organic-panel-isomer')).toBeVisible();
  await expect(page.locator('#organic-panel-isomer #organic-stage')).toHaveCount(1);
  await page.keyboard.press('Tab');
  await expect(page.locator('#organic-panel-isomer')).toBeFocused();

  await tabs.nth(1).focus();
  await page.keyboard.press('End');
  await expect(tabs.nth(3)).toBeFocused();
  await expect(page.locator('#reactionEq')).toContainText('CH₄ + Cl₂');
  await page.keyboard.press('ArrowRight');
  await expect(tabs.nth(0)).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect(tabs.nth(3)).toBeFocused();
  await page.keyboard.press('Home');
  await expect(tabs.nth(0)).toBeFocused();
  await tabs.nth(2).focus();
  await page.keyboard.press('Space');
  await expect(tabs.nth(2)).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#namingOpts button')).toHaveCount(4);
  expect(errors).toEqual([]);
});

test('烃类、异构体、反应与命名答案可键盘操作且选择后保留焦点', async ({page}) => {
  await page.goto(topic);
  const alkene = page.locator('.mode-btn[data-type="alkene"]');
  await alkene.focus();
  await alkene.press('Enter');
  await expect(alkene).toHaveAttribute('aria-pressed', 'true');
  await expect(alkene).toBeFocused();
  await expect(page.locator('#formulaDisp')).toContainText('C3H6');
  const alkyne = page.locator('.mode-btn[data-type="alkyne"]');
  await alkyne.focus();
  await alkyne.press('Space');
  await expect(alkyne).toHaveAttribute('aria-pressed', 'true');

  await page.getByRole('tab', {name: /同分异构/}).click();
  const six = page.locator('.mode-btn[data-f="C₆H₁₄"]');
  await six.click();
  await expect(six).toBeFocused();
  const card = page.locator('#isoGrid button').nth(3);
  await card.focus();
  await card.press('Enter');
  await expect(card).toBeFocused();
  await expect(card).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#isoDetail')).toContainText('2,2-二甲基丁烷');
  await expect(page.locator('#mainCanvas')).toHaveAttribute('aria-label', /2,2-二甲基丁烷/);
  await page.locator('#isoGrid button').nth(4).click();
  await expect(page.locator('#isoGrid button').nth(4)).toBeFocused();

  await page.getByRole('tab', {name: /特征反应/}).click();
  const oxidation = page.getByRole('button', {name: '氧化反应'});
  await oxidation.focus();
  await oxidation.press('Space');
  await expect(oxidation).toBeFocused();
  await expect(oxidation).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#reactionEq')).toContainText('紫色褪去');
  await expect(page.locator('#reactionConcept')).toContainText('不是配平方程');

  await page.getByRole('tab', {name: /命名练习/}).click();
  const answer = page.locator('#namingOpts button').nth(1);
  await answer.focus();
  await answer.press('Enter');
  await expect(answer).toBeFocused();
  await expect(answer).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#namingFb')).toContainText('正确');
  await answer.press('Enter');
  expect(await page.evaluate(() => namingCorrectSet.size)).toBe(1);
});

test('甲烷四氢、无效单碳双键与各异构体的画布碳数正确', async ({page}) => {
  await page.emulateMedia({reducedMotion: 'reduce'});
  await page.addInitScript(() => {
    window.organicDrawnText = [];
    const original = CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillText = function (text, ...args) {
      if (this.canvas.id === 'mainCanvas') window.organicDrawnText.push(String(text));
      return original.call(this, text, ...args);
    };
  });
  await page.goto(topic);
  await page.evaluate(() => { window.organicDrawnText = []; });
  await page.locator('#carbonSlider').evaluate(input => {
    input.value = '1'; input.dispatchEvent(new Event('input', {bubbles: true}));
  });
  expect(await page.evaluate(() => [
    window.organicDrawnText.filter(text => text === 'C').length,
    window.organicDrawnText.filter(text => text === 'H').length,
  ])).toEqual([1, 4]);
  await expect(page.locator('#formulaDisp')).toContainText('CH4');
  await page.evaluate(() => { window.organicDrawnText = []; });
  await page.locator('.mode-btn[data-type="alkene"]').click();
  await expect(page.locator('#formulaDisp')).toHaveText('不存在');
  expect(await page.evaluate(() => window.organicDrawnText.filter(text => text === 'C' || text === 'H'))).toEqual([]);
  await expect(page.locator('#mainCanvas')).toHaveAttribute('aria-label', /至少需要两个碳原子/);

  await page.getByRole('tab', {name: /同分异构/}).click();
  expect(await page.evaluate(() => window.organicDrawnText.filter(text => text === 'C').length)).toBe(8);
  for (const [formula, expected] of [['C₅H₁₂', 15], ['C₆H₁₄', 30]]) {
    await page.evaluate(() => { window.organicDrawnText = []; });
    await page.locator(`.mode-btn[data-f="${formula}"]`).click();
    expect(await page.evaluate(() => window.organicDrawnText.filter(text => text === 'C').length)).toBe(expected);
  }
  expect(await page.evaluate(() => isomerData['C₆H₁₄'].map(iso => {
    const graph = carbonSkeleton(iso);
    return [graph.nodes.length, graph.edges.length];
  }))).toEqual([[6, 5], [6, 5], [6, 5], [6, 5], [6, 5]]);

  await page.evaluate(() => { window.organicDrawnText = []; });
  await page.getByRole('tab', {name: /命名练习/}).click();
  expect(await page.evaluate(() => window.organicDrawnText)).toContain('CH₃-CH₂-CH₂-CH₃');
  expect(await page.evaluate(() => window.organicDrawnText.filter(text => text === 'C' || text === 'H'))).toEqual([]);
});

test('五道不同命名题正确后才显示已保存，答案重复不增加次数', async ({page}) => {
  await page.goto(topic);
  await expect(page.locator('#done-mark')).toHaveText('');
  await answerFive(page);
  await expect(page.locator('#done-mark')).toContainText('已完成');
  await expect(page.locator('#organic-progress')).toContainText('已保存在本机');
  const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), progressKey);
  expect(saved.organic).toBeGreaterThan(0);
  await page.reload();
  await expect(page.locator('#done-mark')).toContainText('已完成');
});

test('返回已作答题目不会改写首次答案，重新练习才清空本轮答案', async ({page}) => {
  await page.goto(topic);
  await page.getByRole('tab', {name: /命名练习/}).click();
  await page.locator('#namingOpts').getByRole('button', {name: '丙烷', exact: true}).click();
  await expect(page.locator('#namingFb')).toContainText('正确答案：丁烷');
  await page.locator('#namingNext').click();
  await page.locator('#namingPrev').click();
  const revealed = page.locator('#namingOpts').getByRole('button', {name: '丁烷', exact: true});
  await expect(revealed).toHaveAttribute('aria-disabled', 'true');
  await revealed.evaluate(button => button.click());
  await expect(page.locator('#namingFb')).toContainText('正确答案：丁烷');
  await expect(page.locator('#naming-score')).toContainText('答对 0 / 8');
  await page.locator('#namingRestart').click();
  await expect(page.locator('#namingFb')).toBeEmpty();
  await page.locator('#namingOpts').getByRole('button', {name: '丁烷', exact: true}).click();
  await expect(page.locator('#naming-score')).toContainText('答对 1 / 8');
});

test('写入拒绝及损坏记录不假称完成，恢复后可重试', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '公网测试不修改存储实现');
  await page.addInitScript(key => {
    window.rejectOrganicProgress = true;
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (name, value) {
      if (name === key && window.rejectOrganicProgress) throw new Error('denied');
      return original.call(this, name, value);
    };
  }, progressKey);
  await page.goto(topic);
  await answerFive(page);
  await expect(page.locator('#done-mark')).toHaveText('');
  await expect(page.locator('#organic-progress')).toContainText('未能保存');
  await expect(page.locator('#retry-organic-save')).toBeVisible();
  expect(await page.evaluate(key => localStorage.getItem(key), progressKey)).toBeNull();
  await page.evaluate(() => { window.rejectOrganicProgress = false; });
  await page.locator('#retry-organic-save').click();
  await expect(page.locator('#done-mark')).toContainText('已完成');
  await expect(page.locator('#retry-organic-save')).toBeHidden();

  await page.evaluate(key => localStorage.setItem(key, '{broken'), progressKey);
  await page.reload();
  await answerFive(page);
  await expect(page.locator('#done-mark')).toHaveText('');
  await expect(page.locator('#organic-progress')).toContainText('未能保存');
  expect(await page.evaluate(key => localStorage.getItem(key), progressKey)).toBe('{broken');
});

test('320px、无画布和减少动态下仍能完成文字交互', async ({page}) => {
  await page.setViewportSize({width: 320, height: 740});
  await page.emulateMedia({reducedMotion: 'reduce'});
  await page.addInitScript(() => {
    HTMLCanvasElement.prototype.getContext = () => null;
  });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(topic);
  await expect(page.locator('#canvas-fallback')).toBeVisible();
  const tabs = page.getByRole('tablist', {name: '有机化学学习主题'}).getByRole('tab');
  for (let i = 0; i < 4; i++) {
    await tabs.nth(i).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  }
  await tabs.nth(0).click();
  await page.locator('.mode-btn[data-type="alkyne"]').click();
  await expect(page.locator('#formulaDisp')).toContainText('C3H4');
  await tabs.nth(1).click();
  await page.locator('.mode-btn[data-f="C₆H₁₄"]').click();
  await page.locator('#isoGrid button').nth(4).click();
  await expect(page.locator('#isoDetail')).toContainText('2,3-二甲基丁烷');
  expect(errors).toEqual([]);
});

test('参数和题目切换不产生并行动画帧，隐藏页面后不自动恢复', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '公网测试不替换浏览器时钟');
  await page.addInitScript(() => {
    let id = 0;
    const pending = new Map();
    window.requestAnimationFrame = callback => { pending.set(++id, callback); return id; };
    window.cancelAnimationFrame = frame => { pending.delete(frame); };
    window.organicPendingFrames = () => pending.size;
  });
  await page.goto(topic);
  expect(await page.evaluate(() => window.organicPendingFrames())).toBe(1);
  for (const value of ['4', '5', '6']) {
    await page.locator('#carbonSlider').evaluate((input, next) => {
      input.value = next; input.dispatchEvent(new Event('input', {bubbles: true}));
    }, value);
    expect(await page.evaluate(() => window.organicPendingFrames())).toBe(1);
  }
  await page.getByRole('tab', {name: /命名练习/}).click();
  expect(await page.evaluate(() => window.organicPendingFrames())).toBe(0);
  await page.getByRole('tab', {name: /特征反应/}).click();
  expect(await page.evaluate(() => window.organicPendingFrames())).toBe(1);
  await page.locator('.mode-btn[data-idx="3"]').click();
  expect(await page.evaluate(() => window.organicPendingFrames())).toBe(1);
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', {configurable: true, value: true}); document.dispatchEvent(new Event('visibilitychange')); });
  expect(await page.evaluate(() => window.organicPendingFrames())).toBe(0);
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', {configurable: true, value: false}); document.dispatchEvent(new Event('visibilitychange')); });
  expect(await page.evaluate(() => window.organicPendingFrames())).toBe(0);
});

test('直接文件与发布子路径保留主题交互', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '公网专项直接使用已部署路径');
  await page.goto(pathToFileURL(resolve(__dirname, '../../chemistry/high/organic.html')).href);
  await page.getByRole('tab', {name: /同分异构/}).click();
  await page.locator('.mode-btn[data-f="C₆H₁₄"]').click();
  await expect(page.locator('#isoGrid button')).toHaveCount(5);
  const release = await startReleaseServer();
  try {
    const response = await page.goto(new URL('chemistry/high/organic.html', release.base).href);
    expect(response.status()).toBe(200);
    await page.getByRole('tab', {name: /特征反应/}).click();
    await page.locator('.mode-btn[data-idx="3"]').click();
    await expect(page.locator('#reactionEq')).toContainText('紫色褪去');
  } finally { await release.close(); }
});
