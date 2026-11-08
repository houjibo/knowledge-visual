const {test, expect} = require('@playwright/test');

const url = '/physics/high/constant-current.html';
const visualSections = [
  {name: '欧姆定律', canvases: ['#ohmCanvas', '#ohmChart']},
  {name: '串并联电路', canvases: ['#circuitCanvas']},
  {name: '电动势与内阻', canvases: ['#emfCanvas', '#emfChart']},
  {name: '电功率', canvases: ['#powerCanvas', '#bulbCanvas']},
];

async function expectPainted(canvas) {
  await expect(canvas).toBeVisible();
  const result = await canvas.evaluate(element => {
    const rect = element.getBoundingClientRect();
    const context = element.getContext('2d');
    const pixels = context.getImageData(0, 0, element.width, element.height).data;
    let painted = false;
    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] !== 0) { painted = true; break; }
    }
    return {displayWidth: rect.width, width: element.width, height: element.height, painted};
  });
  expect(result.displayWidth).toBeGreaterThan(0);
  expect(result.width).toBeGreaterThan(0);
  expect(result.height).toBeGreaterThan(0);
  expect(result.painted).toBe(true);
}

test('各可视化标签切入后绘制全部画布', async ({page}) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url);

  for (let index = 0; index < visualSections.length; index++) {
    const section = visualSections[index];
    await page.locator('.tab').nth(index).click();
    await expect(page.locator('.tab').nth(index)).toHaveClass(/active/);
    for (const selector of section.canvases) await expectPainted(page.locator(selector));
  }

  const viewport = page.viewportSize();
  await page.setViewportSize({width: Math.max(320, viewport.width - 40), height: viewport.height});
  for (const selector of visualSections[3].canvases) await expectPainted(page.locator(selector));

  expect(errors).toEqual([]);
});

test('各模块滑块更新数值并保持画布可绘制', async ({page}) => {
  await page.goto(url);
  const cases = [
    {tab: 0, input: '#ohmVoltage', output: '#ohmVDisp', canvas: '#ohmCanvas'},
    {tab: 1, input: '#circVoltage', output: '#circVDisp', canvas: '#circuitCanvas'},
    {tab: 2, input: '#emfE', output: '#emfEDisp', canvas: '#emfCanvas'},
    {tab: 3, input: '#powI', output: '#powIDisp', canvas: '#powerCanvas'},
  ];

  for (const item of cases) {
    await page.locator('.tab').nth(item.tab).click();
    const before = await page.locator(item.output).textContent();
    await page.locator(item.input).evaluate(input => {
      input.value = String(Number(input.value) + Number(input.step));
      input.dispatchEvent(new Event('input', {bubbles: true}));
    });
    await expect(page.locator(item.output)).not.toHaveText(before);
    await expectPainted(page.locator(item.canvas));
  }
});

test('四道不同题目答对后才完成，且完成记录可刷新恢复', async ({page}) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('constant-current-test-reset') !== '1') {
      localStorage.clear();
      sessionStorage.setItem('constant-current-test-reset', '1');
    }
  });
  await page.goto(url);
  await page.locator('.tab').nth(4).click();
  const isDone = () => page.evaluate(() => PageProgress.isDone('constant-current'));

  await page.locator('#quizCard1 .quiz-option').nth(0).click();
  await expect(page.locator('#quizFb1')).toContainText('错误');
  for (let attempt = 0; attempt < 5; attempt++) {
    await page.locator('#quizCard1 .quiz-option').nth(2).click();
  }
  expect(await isDone()).toBe(false);

  await page.locator('#quizCard2 .quiz-option').nth(2).click();
  await page.locator('#quizCard3 .quiz-option').nth(0).click();
  expect(await isDone()).toBe(false);
  await page.locator('#quizCard4 .quiz-option').nth(1).click();
  expect(await isDone()).toBe(true);
  await expect(page.locator('#quizFb4')).toContainText('忽略摩擦、铁芯等其他损耗');
  await expect(page.locator('#quizFb4')).toContainText('机械输出功率 = 1100 - 50 = 1050W');
  await page.reload();
  expect(await isDone()).toBe(true);
  await expect(page.locator('#quizCard4')).toContainText('只考虑线圈电阻产生的焦耳热');
  await expect(page.locator('#quizCard4')).toContainText('忽略摩擦、铁芯等其他损耗');
});
