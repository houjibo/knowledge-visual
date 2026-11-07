const {test, expect} = require('@playwright/test');

for (const random of [0, .999999]) {
  test(`随机值 ${random} 下两页均可加载且选项不同`, async ({page}) => {
    await page.addInitScript(v => { Math.random = () => v; }, random);
    for (const [slug, mode, id] of [['addition','make10','make10'], ['subtraction','numberline','nl']]) {
      await page.goto(`/math/topics/${slug}/`, {timeout:10000});
      await page.locator(`[data-mode="${mode}"]`).click();
      const options = page.locator(`#${id}-options button`);
      await expect(options).toHaveCount(4);
      expect(new Set(await options.allTextContents()).size).toBe(4);
    }
  });
}

test('数轴答错可重试，重复正确不提前完成', async ({page}) => {
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto('/math/topics/subtraction/');
  await page.locator('[data-mode="numberline"]').click();
  const options = page.locator('#nl-options button');
  await options.filter({hasNotText: /^1$/}).first().click();
  await options.getByText('1', {exact:true}).click();
  await options.getByText('1', {exact:true}).dispatchEvent('click');
  await expect(page.locator('#streak')).toHaveText('1');
  expect(await page.evaluate(() => PageProgress.isDone('subtraction'))).toBe(false);
});

test('自由练习同题重复提交只计一次', async ({page}) => {
  await page.addInitScript(() => { Math.random = () => 0; });
  for (const [slug, answer] of [['addition','2'], ['subtraction','1']]) {
    await page.goto(`/math/topics/${slug}/`);
    await page.locator('[data-mode="practice"]').click();
    await page.locator('#practice-answer').fill(answer);
    await page.locator('#btn-check-answer').click();
    await page.locator('#btn-check-answer').click();
    await expect(page.locator('#streak')).toHaveText('1');
    expect(await page.evaluate(slug => PageProgress.isDone(slug), slug)).toBe(false);
  }
});

test('加法挑战比较题重复提交不提前完成', async ({page}) => {
  await page.addInitScript(() => { Math.random = () => .999999; });
  await page.goto('/math/topics/addition/');
  await page.locator('[data-mode="challenge"]').click();
  const problem = await page.locator('#challenge-problem').innerText();
  const m = problem.match(/(\d+)\s*\+\s*(\d+)\s*○\s*(\d+)\s*\+\s*(\d+)/);
  const left = +m[1] + +m[2], right = +m[3] + +m[4];
  const answer = left > right ? '>' : left < right ? '<' : '=';
  const button = page.locator('#challenge-options button').getByText(answer, {exact:true});
  await button.click();
  await button.click();
  await expect(page.locator('#challenge-streak')).toHaveText('1');
  expect(await page.evaluate(() => PageProgress.isDone('addition'))).toBe(false);
});

test('完成写入失败时提示重试，恢复后保留记录', async ({page}) => {
  await page.addInitScript(() => { Math.random = () => 0; window.oldSet = Storage.prototype.setItem; Storage.prototype.setItem = () => { throw Error('denied'); }; });
  await page.goto('/math/topics/addition/');
  await page.locator('[data-mode="challenge"]').click();
  for (let i = 0; i < 5; i++) {
    await page.locator('#challenge-answer').fill('2');
    await page.locator('#btn-check-challenge').click();
    if (i < 4) await page.locator('#btn-new-challenge').click();
  }
  await expect(page.locator('#math-progress-save-notice')).toContainText('暂未保存');
  await page.evaluate(() => { Storage.prototype.setItem = window.oldSet; });
  await page.locator('#math-progress-save-notice button').click();
  await expect(page.locator('#math-progress-save-notice')).toContainText('已保存');
  await page.reload();
  expect(await page.evaluate(() => PageProgress.isDone('addition'))).toBe(true);
});
