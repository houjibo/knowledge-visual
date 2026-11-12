const {test, expect} = require('@playwright/test');

const pages = {
  robot: '/computer/primary/robot-algorithms.html',
  binary: '/computer/middle/binary-pixels.html',
  classifier: '/ai/high/classifier-lab.html',
  trainTest: '/ai/high/train-test-generalization.html',
  neuron: '/ai/uni/neuron-forward-pass.html',
  feature: '/ai/primary/feature-classification-lab.html',
  label: '/ai/middle/data-label-quality.html',
  source: '/ai/middle/data-source-coverage.html',
  verification: '/ai/middle/output-verification.html',
  minimization: '/ai/middle/data-minimization.html',
  loops: '/computer/primary/repeat-loops.html',
  conditions: '/computer/primary/conditional-robot.html',
  network: '/computer/middle/network-paths.html',
};

test('首页分别展示计算机和人工智能，旧学科入口可进入新目录', async ({page}) => {
  await page.goto('/');
  await expect(page.locator('.subject-card[href="computer/index.html"]')).toContainText('计算机');
  await expect(page.locator('.subject-card[href="ai/index.html"]')).toContainText('人工智能');
  await page.goto('/computer-ai/');
  await expect(page.getByRole('link', {name: /打开计算机/})).toHaveAttribute('href', '../computer/index.html');
  await expect(page.getByRole('link', {name: /打开人工智能/})).toHaveAttribute('href', '../ai/index.html');
});

test('旧主题书签重定向到各自的新学科地址', async ({page}) => {
  const cases = [
    ['/computer-ai/primary/robot-algorithms.html', /\/computer\/primary\/robot-algorithms\.html$/],
    ['/computer-ai/high/classifier-lab.html', /\/ai\/high\/classifier-lab\.html$/],
  ];
  for (const [legacy, target] of cases) {
    await page.goto(legacy);
    await expect(page).toHaveURL(target);
  }
});

test('小学机器人算法可单步检查墙面并运行到目标', async ({page}) => {
  await page.goto(pages.robot);
  const commands = page.locator('#command-list select');
  await commands.nth(0).selectOption('right');
  await commands.nth(1).selectOption('up');
  await commands.nth(2).selectOption('right');
  await page.getByRole('button', {name: '执行下一条'}).click();
  await page.getByRole('button', {name: '执行下一条'}).click();
  await page.getByRole('button', {name: '执行下一条'}).click();
  await expect(page.locator('#robot-status')).toContainText('遇到边界或墙');
  await page.getByRole('button', {name: '重置关卡'}).click();
  await page.getByRole('button', {name: '运行指令'}).click();
  await expect(page.locator('#robot-status')).toContainText('抵达目标', {timeout: 5000});
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('kv-computer-primary-progress'))))
    .toEqual({'robot-algorithms': true});
  await page.getByRole('button', {name: '重置关卡'}).click();
  await expect(page.locator('#robot-grid')).toHaveAttribute('aria-label', /第 1 列第 4 行/);
});

test('初中二进制位权、像素亮度、错答反馈与完成记录一致', async ({page}) => {
  await page.goto(pages.binary);
  await page.getByRole('button', {name: '检查编码'}).click();
  await expect(page.locator('#binary-feedback')).toContainText('目标是 170');
  await page.locator('#bit-7').focus();
  await page.locator('#bit-7').press('Space');
  await expect(page.locator('#decimal-output')).toHaveText('128');
  await page.getByRole('button', {name: '清零重来'}).click();
  for (const id of ['bit-7', 'bit-5', 'bit-3', 'bit-1']) await page.locator(`#${id}`).check();
  await expect(page.locator('#binary-output')).toHaveText('10101010');
  await expect(page.locator('#decimal-output')).toHaveText('170');
  await expect(page.locator('#pixel')).toHaveAttribute('aria-label', '灰度像素，当前亮度 170，共 255');
  await page.getByRole('button', {name: '检查编码'}).click();
  await expect(page.locator('#binary-feedback')).toContainText('正确');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('kv-computer-middle-progress'))))
    .toEqual({'binary-pixels': true});
});

test('初中存储损坏时交互继续可用且不覆盖原数据', async ({page}) => {
  await page.addInitScript(() => localStorage.setItem('kv-computer-middle-progress', '{broken'));
  await page.goto(pages.binary);
  await expect(page.locator('#progress-status')).toContainText('进度暂不可用');
  for (const id of ['bit-7', 'bit-5', 'bit-3', 'bit-1']) await page.locator(`#${id}`).check();
  await page.getByRole('button', {name: '检查编码'}).click();
  await expect(page.locator('#binary-feedback')).toContainText('正确');
  await expect(page.locator('#binary-feedback')).toContainText('未能保存');
  expect(await page.evaluate(() => localStorage.getItem('kv-computer-middle-progress'))).toBe('{broken');
});

test('进度存储被拒绝时大学神经元仍能完成计算', async ({page}) => {
  await page.addInitScript(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key.startsWith('kv-ai-')) throw new Error('storage denied');
      return original.call(this, key, value);
    };
  });
  await page.goto(pages.neuron);
  await page.getByRole('button', {name: '计算神经元输出'}).click();
  await expect(page.locator('#z-output')).toHaveText('0.80');
  await expect(page.locator('#activation-output')).toHaveText('0.6900');
  await expect(page.locator('#progress-status')).toContainText('未能保存');
  const weight = page.locator('#weight-w1');
  await weight.focus(); await weight.press('ArrowRight');
  await page.getByRole('button', {name: '计算神经元输出'}).click();
  await expect(page.locator('#z-output')).toHaveText('0.90');
  await page.getByRole('button', {name: '恢复示例参数'}).click();
  await expect(page.locator('#z-output')).toHaveText('—');
});

test('高中分类边界重新计算逐点预测和评价指标', async ({page}) => {
  await page.goto(pages.classifier);
  const threshold = page.locator('#threshold');
  await threshold.focus();
  for (let i = 0; i < 4; i++) await threshold.press('ArrowLeft');
  await expect(threshold).toHaveValue('6');
  await page.getByRole('button', {name: '重新评估样本'}).click();
  await expect(page.locator('#accuracy-output')).toHaveText('87.5%');
  await expect(page.locator('#error-output')).toHaveText('1 / 8');
  await expect(page.locator('#sample-results')).toContainText('误分类');
  await expect(page.locator('#classifier-feedback')).toContainText('虚构样本');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('kv-ai-high-progress'))))
    .toEqual({'classifier-lab': true});
  await page.getByRole('button', {name: '重置边界'}).click();
  await expect(threshold).toHaveValue('10');
  await expect(page.locator('#accuracy-output')).toHaveText('—');
});

test('计算机与人工智能十三个主题在 320px 下无页面级横向溢出', async ({page}) => {
  await page.setViewportSize({width: 320, height: 760});
  for (const path of Object.values(pages)) {
    await page.goto(path);
    const sizes = await page.evaluate(() => ({document: document.documentElement.scrollWidth, viewport: innerWidth}));
    expect(sizes.document, path).toBeLessThanOrEqual(sizes.viewport);
    await expect(page.getByRole('main')).toBeVisible();
  }
});

test('旧进度合并进独立学科，新记录优先且旧键保留', async ({page}) => {
  await page.addInitScript(() => {
    localStorage.setItem('kv-computer-ai-primary-progress', JSON.stringify({'robot-algorithms': true}));
    localStorage.setItem('kv-computer-primary-progress', JSON.stringify({'robot-algorithms': false}));
    localStorage.setItem('kv-computer-ai-high-progress', JSON.stringify({'classifier-lab': true}));
  });
  await page.goto('/');
  await expect(page.locator('[data-subject="computer"] .sp-label')).toHaveText('尚未开始');
  await expect(page.locator('[data-subject="ai"] .sp-label')).toHaveText('已学 1/8');
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('kv-computer-primary-progress'))))
    .toEqual({'robot-algorithms': false});
  await page.goto('/computer/primary/index.html');
  await expect(page.locator('#stage-progress')).toContainText('已完成 0/5');
  expect(await page.evaluate(() => localStorage.getItem('kv-computer-ai-primary-progress')))
    .toBe('{"robot-algorithms":true}');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('kv-ai-high-progress'))))
    .toEqual({'classifier-lab': true});
});
