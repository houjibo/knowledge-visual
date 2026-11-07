const {test, expect} = require('@playwright/test');

const stages = [
  ['physics/middle', 'motion', 'force'], ['physics/high', 'optics', 'thermal'],
  ['physics/uni', 'fluid-mechanics', 'photoelectric'], ['chemistry/middle', '13-metals', '01-matter'],
  ['chemistry/high', 'mole-concept', 'reaction-energy'], ['chemistry/uni', 'equilibrium', 'phase-equilibrium'],
];
for (const [stage, first, second] of stages) {
  const key = `kv-${stage.replace('/', '-')}-progress`;
  test(`${stage} 异常进度保留原文`, async ({page}) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`/${stage}/index.html`);
    await page.evaluate(key => localStorage.setItem(key, 'null'), key);
    await page.goto(`/${stage}/${first}.html`);
    expect(await page.evaluate(slug => PageProgress.markDone(slug), first)).toBe(false);
    expect(await page.evaluate(slug => PageProgress.isDone(slug), first)).toBe(true);
    expect(await page.evaluate(key => localStorage.getItem(key), key)).toBe('null');
    expect(errors).toEqual([]);
  });
  test(`${stage} 多标签页顺序记录互不覆盖`, async ({context, page}) => {
    await page.goto(`/${stage}/${first}.html`);
    const other = await context.newPage();
    await other.goto(`/${stage}/${second}.html`);
    expect(await page.evaluate(slug => PageProgress.markDone(slug), first)).toBe(true);
    expect(await other.evaluate(slug => PageProgress.markDone(slug), second)).toBe(true);
    const data = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), key);
    expect(data[first]).toBeTruthy();
    expect(data[second]).toBeTruthy();
  });
}

test('物质的量测验无法保存时显示未保存', async ({page}) => {
  await page.addInitScript(() => { Storage.prototype.setItem = () => { throw new Error('denied'); }; });
  await page.goto('/chemistry/high/mole-concept.html');
  await page.locator('.tab[data-mode="quiz"]').click();
  await page.locator('#quizStart').click();
  for (const answer of [0, 1, 1, 1]) {
    await page.locator('#quizOpts button').nth(answer).click();
    await page.locator('#quizNext').click();
  }
  await page.locator('#quizNext').click();
  await expect(page.locator('#done-mark')).toContainText('进度未保存');
});

test('化学平衡练习无法保存时显示未保存', async ({page}) => {
  await page.addInitScript(() => { Storage.prototype.setItem = () => { throw new Error('denied'); }; });
  await page.goto('/chemistry/uni/equilibrium.html');
  await page.locator('.tab[data-tab="3"]').click();
  for (const [index, answer] of [1, 0, 1, 1, 1].entries()) {
    if (index) await page.locator('#q3next').click();
    await page.locator('#q3opts button').nth(answer).click();
  }
  await expect(page.locator('#done-mark')).toContainText('进度未保存');
});
