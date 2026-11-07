const {test, expect} = require('@playwright/test');
const url = '/math/topics/percentage-applications/';

for (const value of [0, .4, .8, .999999]) {
  test(`重复随机值 ${value} 下三种场景可出题`, async ({page}) => {
    await page.addInitScript(v => { Math.random = () => v; }, value);
    await page.goto(url, {timeout:10000});
    const q = await page.evaluate(() => genQ());
    expect(q.opts).toHaveLength(4);
    expect(new Set(q.opts).size).toBe(4);
    expect(q.opts.filter(x => x === q.ans)).toHaveLength(1);
    expect(q.tip).toContain(String(q.ans));
    await page.locator('[data-mode="practice"]').click();
    await page.locator('#practiceNext').click();
    const options = page.locator('#practiceOpts button');
    await expect(options).toHaveCount(4);
    const answer = await page.evaluate(() => pQ.ans + ' 元');
    const option = options.getByText(answer,{exact:true});
    await option.click(); await option.dispatchEvent('click');
    await expect(page.locator('#streak')).toHaveText('1');
  });
}

test('计算器保留小数金额并标明简化条件', async ({page}) => {
  await page.goto(url);
  await page.locator('[data-mode="explore"]').click();
  await page.getByLabel('原价').fill('50');
  await page.getByLabel('折扣').fill('75');
  await expect(page.locator('#calcPanel')).toContainText('应付 37.5 元');
  await expect(page.locator('#calcPanel')).toContainText('节省 12.5 元');
  await page.locator('[data-scene="tax"]').click();
  await expect(page.locator('#calcPanel')).toContainText('应税金额');
  await expect(page.locator('#calcPanel')).toContainText('固定税率');
  await page.locator('[data-scene="interest"]').click();
  await expect(page.locator('#calcPanel')).toContainText('单利');
});

test('挑战逐题保留反馈，完成时保存失败可重试', async ({page}) => {
  await page.addInitScript(() => { Math.random = () => 0; window.oldSet = Storage.prototype.setItem; Storage.prototype.setItem = () => { throw Error('denied'); }; });
  await page.goto(url);
  await page.locator('[data-mode="challenge"]').click();
  await page.locator('#challengeStart').click();
  for (let i=0; i<10; i++) {
    const option = page.locator('#chOpts button').getByText('50 元',{exact:true});
    await option.click(); await option.dispatchEvent('click');
    await expect(page.locator('#chCorrect')).toHaveText(String(i+1));
    await expect(page.locator('#chFb')).toContainText('现价');
    await page.locator('#chNext').click();
  }
  await expect(page.locator('#challengeStart')).toContainText('10/10');
  await expect(page.locator('#math-progress-save-notice')).toContainText('暂未保存');
  await page.evaluate(() => { Storage.prototype.setItem = window.oldSet; });
  await page.locator('#math-progress-save-notice button').click();
  await expect(page.locator('#math-progress-save-notice')).toContainText('已保存');
  await page.reload();
  expect(await page.evaluate(() => PageProgress.isDone('percentage-applications'))).toBe(true);
});
