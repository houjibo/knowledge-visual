const {test, expect} = require('@playwright/test');
const url = '/math/topics/chicken-rabbit/';

test('全部数量及两种提问的选项和提示一致', async ({page}) => {
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto(url, {timeout:10000});
  const failures = await page.evaluate(() => {
    const problems = [];
    for (let c=2;c<=15;c++) for(let r=1;r<=12;r++) for(const askChicken of [false,true]) {
      const seq = [(c-2+.1)/14,(r-1+.1)/12,askChicken?.75:.25]; let i=0;
      Math.random = () => seq[i++] ?? 0;
      generateQuiz();
      const values = [...document.querySelectorAll('#quizOptions button')].map(b => +b.textContent.match(/\d+/)[0]);
      const ans = askChicken ? c : r, heads=c+r, legs=2*c+4*r;
      const hint = document.querySelector('#quizHint').textContent;
      if(values.length!==4 || new Set(values).size!==4 || values.filter(v=>v===ans).length!==1 || values.some(v=>v<0||v>heads) || !hint.includes(`比实际${askChicken?'多':'少'}${askChicken?4*heads-legs:legs-2*heads}只脚`)) problems.push([c,r,askChicken,values,hint]);
    }
    return problems;
  });
  expect(failures).toEqual([]);
});

test('无整数解不展示动物组合，有解图示与计算一致', async ({page}) => {
  await page.goto(url);
  await page.locator('[data-mode="explore"]').click();
  await page.getByLabel('总头数：').fill('10');
  await page.getByLabel('总脚数：').fill('31');
  await expect(page.locator('#expAnswer')).toContainText('无整数解');
  await expect(page.locator('#expVisual .explore-animal')).toHaveCount(0);
  await page.getByLabel('总脚数：').fill('32');
  await expect(page.locator('#expVisual .ch')).toHaveCount(4);
  await expect(page.locator('#expVisual .rb')).toHaveCount(6);
  await expect(page.locator('#expFormula')).toContainText('32 ✓');
});

test('同题只计一次，五题完成保存失败后可恢复', async ({page}) => {
  await page.addInitScript(() => { Math.random = () => 0; window.oldSet = Storage.prototype.setItem; Storage.prototype.setItem = () => { throw Error('denied'); }; });
  await page.goto(url);
  await page.locator('[data-mode="quiz"]').click();
  for (let i=0;i<5;i++) {
    const answer=page.locator('#quizOptions button').getByText('兔 1 只',{exact:true});
    await answer.click();
    await answer.dispatchEvent('click');
    await expect(page.locator('#quizTotal')).toHaveText(String(i+1));
    if(i<4) await page.locator('#quizNext').click();
  }
  await expect(page.locator('#quizCorrect')).toHaveText('5');
  await expect(page.locator('#math-progress-save-notice')).toContainText('暂未保存');
  await page.evaluate(() => { Storage.prototype.setItem = window.oldSet; });
  await page.locator('#math-progress-save-notice button').click();
  await expect(page.locator('#math-progress-save-notice')).toContainText('已保存');
  await page.reload();
  expect(await page.evaluate(() => PageProgress.isDone('chicken-rabbit'))).toBe(true);
});
