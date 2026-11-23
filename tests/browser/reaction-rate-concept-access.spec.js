const {test, expect} = require('@playwright/test');

const url = '/chemistry/high/reaction-rate.html';

async function answerQuiz(page) {
  const answers = [0, 2, 1, 2];
  for (const answer of answers) {
    const option = page.locator('#quizOpts .quiz-opt').nth(answer);
    await option.focus();
    await page.keyboard.press('Space');
    await expect(page.locator('#quizOpts .quiz-opt').first()).toBeDisabled();
    await page.locator('#quizNextBtn').focus();
    await page.keyboard.press('Enter');
  }
}

test('模型指标和化学概念边界与滑块读数一致', async ({page}) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url);
  const description = page.locator('#sec0');
  await expect(description).toContainText('aA → bB');
  await expect(description).toContainText('体积恒定');
  await expect(description).toContainText('无量纲指数');
  await expect(description).toContainText('不是实测温度、浓度、每秒转化率或化学反应速率');
  await expect(page.locator('#rateValue')).toHaveText('0.30');
  for (const id of ['tempSlider', 'concSlider']) {
    await page.locator(`#${id}`).evaluate(input => {
      input.value = '10';
      input.dispatchEvent(new Event('input', {bubbles: true}));
    });
  }
  await expect(page.locator('#rateValue')).toHaveText('1.20');
  await page.locator('.tab').nth(1).click();
  await expect(page.locator('#sec1')).toContainText('不能把每升高 10°C 的固定倍数当作普遍规律');
  await expect(page.locator('#sec1')).toContainText('它可参与反应步骤，并在催化循环中再生');
  await page.locator('.tab').nth(4).click();
  await expect(page.locator('#quizQ')).toContainText('浓度以 mol/L、时间以秒表示');
  await page.setViewportSize({width: 320, height: 800});
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow).toBe(false);
  expect(errors).toEqual([]);
});

test('键盘可切换主题和测验，答案锁定并保存完成', async ({page}) => {
  await page.goto(url);
  const quizTab = page.locator('.tab').nth(4);
  await quizTab.focus();
  await page.keyboard.press('Enter');
  await expect(quizTab).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.tab').first()).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('#sec4')).toBeVisible();
  await answerQuiz(page);
  await expect(page.locator('#quizResult')).toContainText('得分：4/4');
  await expect(page.locator('#quizResult')).toContainText('已记录完成');
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('kv-chemistry-high-progress')));
  expect(saved['reaction-rate']).toBeGreaterThan(0);
  await page.reload();
  await expect(page.locator('.tab').first()).toHaveAttribute('aria-pressed', 'true');
  await page.locator('.tab').nth(1).focus();
  await page.keyboard.press('Space');
  await expect(page.locator('#sec1')).toBeVisible();
});

test('存储失败不冒称完成，重测后可重试', async ({page}) => {
  await page.addInitScript(() => {
    window.blockProgressWrites = true;
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (window.blockProgressWrites) throw new Error('storage denied');
      return originalSetItem.call(this, key, value);
    };
  });
  await page.goto(url);
  await page.locator('.tab').nth(4).click();
  await answerQuiz(page);
  await expect(page.locator('#quizResult')).toContainText('进度未保存');
  await expect(page.locator('#quizResult')).not.toContainText('已记录完成');
  await page.evaluate(() => { window.blockProgressWrites = false; });
  await page.getByRole('button', {name: '⟲ 重测'}).click();
  await answerQuiz(page);
  await expect(page.locator('#quizResult')).toContainText('已记录完成');
});
