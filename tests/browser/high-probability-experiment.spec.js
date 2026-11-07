const {test, expect} = require('@playwright/test');
const url = '/math/high/probability.html';

test('骰子目标切换重新统计历史，重置取消批量任务', async ({page}) => {
  await page.clock.install();
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto(url);
  const tab = page.getByRole('button',{name:'② 古典概型'});
  await tab.focus(); await page.keyboard.press('Enter');
  await expect(tab).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('#diceTheory')).toHaveText('16.7%');
  await page.getByRole('button',{name:'🎲 掷骰子'}).click();
  await expect(page.locator('#diceTotal')).toHaveText('1');
  await expect(page.locator('#diceHit')).toHaveText('0');
  const target = page.getByLabel('目标点数之和：');
  await target.fill('2');
  await expect(page.locator('#diceHit')).toHaveText('1');
  await expect(page.locator('#diceFreq')).toHaveText('100.0%');
  await expect(page.locator('#diceTheory')).toHaveText('2.8%');
  await expect(page.locator('#diceHist .hist-bar').first()).toHaveAttribute('style', /gradient/);
  await target.fill('7'); await expect(page.locator('#diceHit')).toHaveText('0');
  await page.getByRole('button',{name:'🚀 掷100次'}).click();
  await page.clock.fastForward(100);
  await page.locator('#p2').getByRole('button',{name:'🔄 重置'}).click();
  await page.clock.fastForward(5000);
  await expect(page.locator('#diceTotal')).toHaveText('0');
  await expect(page.locator('#diceFreq')).toHaveText('—');
});

test('重置与换球数取消硬币、摸球剩余批次', async ({page}) => {
  await page.clock.install();
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto(url);
  await page.getByRole('button',{name:'🚀 抛100次'}).click();
  await page.clock.fastForward(100);
  await page.locator('#p1').getByRole('button',{name:'🔄 重置'}).click();
  await page.clock.fastForward(5000);
  await expect(page.locator('#coinTotal')).toHaveText('0');
  await expect(page.locator('#coinFreq')).toHaveText('—');
  await page.getByRole('button',{name:'④ 模拟实验'}).click();
  await page.getByRole('button',{name:'🚀 摸100次'}).click();
  await page.clock.fastForward(100);
  await page.getByLabel('红球数量：').fill('4');
  await expect(page.locator('#bagStatus')).toContainText('已清空本轮记录');
  await page.clock.fastForward(5000);
  await expect(page.locator('#bagTotal')).toHaveText('0');
  await expect(page.locator('#bagTheory')).toHaveText('36.4%');
  await expect(page.locator('#bagFreq')).toHaveText('—');
  await page.getByRole('button',{name:'⚡ 摸10次'}).click();
  await page.clock.fastForward(1000);
  await expect(page.locator('#bagTotal')).toHaveText('10');
  await expect(page.locator('#bagRed')).toHaveText('10');
  await page.getByRole('button',{name:'🚀 摸100次'}).click();
  await page.locator('#p4').getByRole('button',{name:'🔄 重置'}).click();
  await page.clock.fastForward(5000);
  await expect(page.locator('#bagTotal')).toHaveText('0');
});

test('练习等价分数不再出现两个正确选项', async ({page}) => {
  await page.goto(url);
  await page.getByRole('button',{name:'⑤ 练习'}).click();
  for (const answer of [2,2,1]) {
    await page.locator('.quiz-option').nth(answer).click();
    await page.getByRole('button',{name:'📝 下一题'}).click();
  }
  await expect(page.locator('.quiz-option')).toHaveText(['1/5','3/10','4/10','1/2']);
  await page.locator('.quiz-option').nth(2).click();
  await expect(page.locator('#quizFeedback')).toContainText('正确');
});
