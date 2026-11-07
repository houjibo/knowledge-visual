const {test, expect} = require('@playwright/test');
const url = '/science/weather-water-cycle.html';

test('温度边界更新示意状态并保留真实模型的限制', async ({page}) => {
  await page.goto(url);
  const temp = page.getByLabel('环境温度（简化）');
  await temp.fill('0');
  await expect(page.locator('#valTemp')).toHaveText('0°C');
  await expect(page.locator('#infoEvap')).toHaveText('很慢');
  await expect(page.locator('#infoPrecip')).toHaveText('雪（简化）');
  await temp.fill('40');
  await expect(page.locator('#valTemp')).toHaveText('40°C');
  await expect(page.locator('#infoEvap')).toHaveText('非常快');
  await expect(page.locator('#infoPrecip')).toHaveText('雨（简化）');
  await expect(page.locator('#modelNote')).toContainText('不是天气预测');
  await expect(page.locator('#modelNote')).toContainText('各层气温');
  await expect(page.locator('.legend')).toContainText('并非可见的水蒸气');
});

test('键盘暂停动画后时间不前进，温度仍可调整并可恢复', async ({page}) => {
  await page.goto(url);
  const toggle = page.locator('#toggleAnimation');
  await toggle.focus();
  await page.keyboard.press('Enter');
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await expect(toggle).toContainText('播放');
  const before = await page.evaluate(() => visualTime);
  await page.getByLabel('环境温度（简化）').fill('2');
  await expect(page.locator('#infoPrecip')).toHaveText('雪（简化）');
  await page.waitForTimeout(100);
  expect(await page.evaluate(() => visualTime)).toBe(before);
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(() => page.evaluate(() => visualTime)).toBeGreaterThan(before);
});

test('练习回答后原生禁用选项且保留解释', async ({page}) => {
  await page.goto(url);
  await page.locator('[data-mode="practice"]').click();
  const options = page.locator('#p2 .quiz-opt');
  await options.getByText('许多小水滴或小冰晶').click();
  await expect(options.first()).toBeDisabled();
  await expect(page.locator('#p2 .practice-fb')).toContainText('水蒸气本身看不见');
});
