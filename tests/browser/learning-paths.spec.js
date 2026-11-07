const {test: base, expect} = require('@playwright/test');

const test = base.extend({
  noPageErrors: [async ({page}, use) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await use();
    expect(errors, '页面存在未捕获脚本异常').toEqual([]);
  }, {auto: true}],
});

// All tests get a fresh browser context; no real learner progress is modified.
test('小学数学：进入加法并获得正确及错误反馈', async ({page}) => {
  await page.goto('/');
  await page.getByRole('link', {name: /数学 小学/}).click();
  await page.locator('a.topic-node[href="topics/addition/index.html"]').click();
  await page.getByRole('button', {name: '✏️ 练习'}).click();
  const prompt = await page.locator('#practice-problem').textContent();
  const parts = prompt.match(/(\d+)\s*([+-])\s*(\d+)\s*=\s*\?/);
  expect(parts, `无法解析练习题：${prompt}`).not.toBeNull();
  const answer = parts[2] === '+' ? Number(parts[1]) + Number(parts[3]) : Number(parts[1]) - Number(parts[3]);
  const input = page.locator('#practice-answer');
  await input.fill(String(answer + 1));
  await page.locator('#btn-check-answer').click();
  await expect(page.getByText('不对哦，再算算看')).toBeVisible();
  await input.fill(String(answer));
  await page.locator('#btn-check-answer').click();
  await expect(page.getByText('🎉 答对了！')).toBeVisible();
});

test('初中物理：启动和重置运动并用键盘切换模式', async ({page}) => {
  await page.goto('/');
  await page.getByRole('link', {name: /物理 初中/}).click();
  await page.getByRole('link', {name: /初中物理/}).click();
  await page.getByRole('link', {name: /机械运动/}).click();
  await page.locator('#btnStart').click();
  await expect.poll(async () => parseFloat(await page.locator('#dispDist').textContent())).toBeGreaterThan(0);
  await page.locator('#btnReset').click();
  await expect(page.locator('#dispDist')).toContainText('0.0');
  await expect(page.locator('#dispTime')).toContainText('0.0');
  const mode = page.getByRole('button', {name: '匀速运动'});
  await mode.focus();
  await page.keyboard.press('Space');
  await expect(mode).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#sec-uniform')).toBeVisible();
});

test('高中化学：切换物质并用键盘打开计算', async ({page}) => {
  await page.goto('/');
  await page.getByRole('link', {name: /化学 初中/}).click();
  await page.getByRole('link', {name: /高中化学/}).click();
  await page.getByRole('link', {name: /物质的量/}).click();
  await page.getByRole('button', {name: 'CO₂ (44)'}).click();
  await expect(page.getByText('88.0 g')).toBeVisible();
  const mode = page.getByRole('button', {name: '🧪 计算'});
  await mode.focus();
  await page.keyboard.press('Enter');
  await expect(mode).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#sec-practice')).toBeVisible();
});

test('小学科学：选择铁块并用键盘打开计算', async ({page}) => {
  await page.goto('/');
  await page.getByRole('link', {name: /科学 小学科学/}).click();
  await page.getByRole('link', {name: /沉与浮/}).click();
  await page.getByRole('button', {name: '🔩 铁块'}).click();
  await expect(page.locator('#infoState')).toContainText('下沉');
  await expect(page.locator('#infoForce')).toContainText('浮力 < 重力');
  const mode = page.getByRole('button', {name: '🧪 计算'});
  await mode.focus();
  await page.keyboard.press('Enter');
  await expect(mode).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#sec-practice')).toBeVisible();
});
