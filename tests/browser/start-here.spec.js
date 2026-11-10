const {test, expect} = require('@playwright/test');
const path = require('node:path');
const {pathToFileURL} = require('node:url');

for (const [title, action] of [
  ['扇形统计图', async page => {
    await page.getByRole('button', {name: /探索/}).click();
    await page.getByLabel('⚽ 足球').fill('45');
    await expect(page.locator('#valA')).toHaveText('45%');
  }],
  ['机械运动', async page => {
    await page.locator('#btnStart').click();
    await expect.poll(async () => parseFloat(await page.locator('#dispDist').textContent())).toBeGreaterThan(0);
  }],
  ['物质的量', async page => {
    await page.getByRole('button', {name: 'CO₂ (44)'}).click();
    await expect(page.locator('#infoM')).toHaveText('88.0 g');
  }],
  ['沉与浮', async page => {
    await page.getByRole('button', {name: '🪵 木块'}).click();
    await expect(page.locator('#infoSubmerged')).toContainText('50%');
  }],
  ['指令小机器人', async page => {
    await page.getByRole('button', {name: '运行指令'}).click();
    await expect(page.locator('#robot-status')).toContainText('抵达目标');
  }],
]) {
  test(`从首页动手入口体验${title}`, async ({page}) => {
    await page.goto('/');
    const region = page.getByRole('region', {name: '✨ 从动手开始'});
    const card = region.getByRole('link', {name: new RegExp(title)});
    const box = await card.boundingBox();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(page.viewportSize().width);
    await card.focus();
    await page.keyboard.press('Enter');
    await action(page);
  });
}

test('直接打开本地首页时入口可进入主题', async ({page}) => {
  await page.goto(pathToFileURL(path.resolve(__dirname, '../../index.html')).href);
  await page.getByRole('region', {name: '✨ 从动手开始'}).getByRole('link', {name: /沉与浮/}).click();
  await expect(page).toHaveURL(/science\/sink-float\.html$/);
  await page.getByRole('button', {name: '🪵 木块'}).click();
  await expect(page.locator('#infoSubmerged')).toContainText('50%');
});

test('禁用脚本时动手入口仍可导航', async ({browser}) => {
  const context = await browser.newContext({javaScriptEnabled: false});
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4183/');
  const links = page.getByRole('region', {name: '✨ 从动手开始'}).getByRole('link');
  await expect(links).toHaveCount(5);
  await expect(links.filter({hasText: '指令小机器人'})).toHaveAttribute('href', 'computer-ai/primary/robot-algorithms.html');
  await links.filter({hasText: '机械运动'}).click();
  await expect(page).toHaveURL(/physics\/middle\/motion\.html$/);
  await context.close();
});
