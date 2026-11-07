const {test, expect} = require('@playwright/test');
const url = '/math/topics/area-and-perimeter/index.html';

test('长方形与正方形格数、面积、周长随参数一致', async ({page}) => {
  await page.goto(url);
  await page.locator('[data-mode="rectangle"]').click();
  for (const [l,w] of [[1,1],[6,4],[12,10]]) {
    await page.locator('#rect-l').fill(String(l)); await page.locator('#rect-w').fill(String(w));
    await expect(page.locator('#rect-svg rect')).toHaveCount(l*w+1);
    await expect(page.locator('#rect-svg animate')).toHaveCount(0);
    await expect(page.locator('#rect-area')).toHaveText(`${l*w} cm²`);
    await expect(page.locator('#rect-perimeter')).toHaveText(`${2*(l+w)} cm`);
  }
  await page.locator('#rect-l').fill('2');
  await expect(page.locator('#rect-w')).toHaveValue('2');
  await expect(page.locator('#rect-w')).toHaveAttribute('max', '2');
  await expect(page.locator('#rect-area')).toHaveText('4 cm²');
  await page.locator('[data-mode="square"]').click();
  for (const side of [1,5,10]) {
    await page.locator('#square-side').fill(String(side));
    await expect(page.locator('#square-svg rect')).toHaveCount(side*side+1);
    await expect(page.locator('#square-grid .sq-cell')).toHaveCount(side*side);
    await expect(page.locator('#sq-area')).toHaveText(`${side*side} cm²`);
    await expect(page.locator('#sq-perimeter')).toHaveText(`${side*4} cm`);
  }
});

test('形状切换和滑块有可访问名称及选中状态', async ({page}) => {
  await page.goto(url);
  await page.locator('#toggle-square').click();
  await expect(page.locator('#toggle-square')).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('#toggle-rect')).toHaveAttribute('aria-pressed','false');
  await expect(page.locator('#concept-svg rect')).toHaveCount(65);
  await page.locator('#toggle-rect').click();
  await expect(page.locator('#concept-svg rect')).toHaveCount(71);
  await page.locator('[data-mode="rectangle"]').click();
  await expect(page.getByRole('slider', {name:/长 =/})).toBeVisible();
  await expect(page.getByRole('slider', {name:/宽 =/})).toBeVisible();
  await page.locator('[data-mode="square"]').click();
  await expect(page.getByRole('slider', {name:/边长/})).toBeVisible();
});

test('随机矩形题的宽不大于长', async ({page}) => {
  await page.goto(url);
  for (const mode of ['practice','challenge']) {
    await page.locator(`[data-mode="${mode}"]`).click();
    for (const kind of ['rect-area','rect-perimeter', ...(mode === 'challenge' ? ['reverse'] : [])]) {
      await page.evaluate(type => { Random.pick = () => type; let first = true; Random.int = (min,max) => { if (first) {first = false; return min;} return max; }; }, kind);
      await page.locator(mode === 'practice' ? '#btn-new-practice' : '#btn-new-challenge').click();
      const text = await page.locator(mode === 'practice' ? '#practice-question' : '#challenge-question').innerText();
      const values = [...text.matchAll(/\d+/g)].map(m => Number(m[0]));
      if (kind === 'reverse') expect(values[0] / values[1]).toBeLessThanOrEqual(values[1]);
      else expect(values[1]).toBeLessThanOrEqual(values[0]);
    }
  }
});
