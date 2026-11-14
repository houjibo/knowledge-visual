const {test, expect} = require('@playwright/test');
const {resolve} = require('node:path');
const {pathToFileURL} = require('node:url');

const base = process.env.KV_PUBLISHED_BASE_URL?.replace(/\/?$/, '/');
const topic = base ? new URL('math/middle/real-symmetry-distance.html', base).href
  : '/math/middle/real-symmetry-distance.html';
async function move(page, selector, value) {
  await page.locator(selector).evaluate((node, next) => {
    node.value = String(next);
    node.dispatchEvent(new Event('input', {bubbles: true}));
  }, value);
}
async function complete(page, id, a, b, opposite, absolute) {
  await page.locator('#case-select').selectOption(id);
  await move(page, '#slider-a', a);
  await page.locator('#check-a').click();
  await move(page, '#slider-b', b);
  await page.locator('#check-b').click();
  await page.locator(`input[name="opposite"][value="${opposite}"]`).check();
  await page.locator(`input[name="absolute"][value="${absolute}"]`).check();
  await page.locator('input[name="reason"][value="distance"]').check();
  await page.locator('#check-conclusion').click();
}

test('√2 先定位、再反射，错误结论可修正且符号保持精确', async ({page}) => {
  await page.goto(topic);
  await expect(page.locator('#task')).toContainText('x = √2');
  await expect(page.locator('#slider-b')).toBeDisabled();
  await expect(page.locator('#check-conclusion')).toBeDisabled();
  await move(page, '#slider-a', 1.0);
  await page.locator('#check-a').click();
  await expect(page.locator('#feedback-a')).toContainText('原数位置还不合适');
  await move(page, '#slider-a', 1.4);
  await page.locator('#check-a').click();
  await expect(page.locator('#feedback-a')).toHaveClass(/good/);
  await expect(page.locator('#slider-b')).toBeEnabled();
  await move(page, '#slider-b', 1.4);
  await page.locator('#check-b').click();
  await expect(page.locator('#feedback-b')).toContainText('再试一次');
  await move(page, '#slider-b', -1.4);
  await page.locator('#check-b').click();
  await expect(page.locator('#check-conclusion')).toBeEnabled();
  await page.locator('input[name="opposite"][value="√2"]').check();
  await page.locator('input[name="absolute"][value="−√2"]').check();
  await page.locator('input[name="reason"][value="same-sign"]').check();
  await page.locator('#check-conclusion').click();
  await expect(page.locator('#feedback-conclusion')).toContainText('相反数、绝对值、距离理由');
  await expect(page.locator('#solution')).toBeHidden();
  await page.locator('input[name="opposite"][value="−√2"]').check();
  await page.locator('input[name="absolute"][value="√2"]').check();
  await page.locator('input[name="reason"][value="distance"]').check();
  await page.locator('#check-conclusion').click();
  await expect(page.locator('#solution')).toContainText('√2 的相反数是 −√2；|√2|=√2');
  await expect(page.locator('#solution')).toContainText('≈1.414');
  await expect(page.locator('#point-a')).toHaveClass(/exact/);
  await expect(page.locator('#distance-a')).toBeVisible();
  await expect(page.locator('#progress-detail')).toContainText('1/4');
});

test('负 π 的对称点和距离按近似位置、精确符号分别呈现', async ({page}) => {
  await page.goto(topic);
  await complete(page, 'pi-negative', -3.1, 3.1, 'π', 'π');
  await expect(page.locator('#solution')).toContainText('−π 的相反数是 π；|−π|=π');
  await expect(page.locator('#solution')).toContainText('≈3.142');
  await expect(page.locator('#axis')).toHaveAttribute('aria-label', /−π≈−3\.142.*π≈3\.142/);
  await expect(page.locator('#progress-detail')).toContainText('负无理数 ✓');
});

test('四类不同案例完成才保存，零示例不计且另一零案例可练', async ({page}) => {
  await page.goto(topic);
  await page.locator('#case-select').selectOption('zero');
  await page.locator('#show-example').click();
  await expect(page.locator('#solution')).toContainText('本案例不计入本机进度');
  await expect(page.locator('#progress-detail')).toContainText('0/4');
  await complete(page, 'root-positive', 1.4, -1.4, '−√2', '√2');
  await complete(page, 'e-positive', 2.7, -2.7, '−e', 'e');
  await expect(page.locator('#progress-detail')).toContainText('1/4');
  await complete(page, 'root-negative', -1.4, 1.4, '√2', '√2');
  await complete(page, 'rational-negative', -1.5, 1.5, '3/2', '3/2');
  await expect(page.locator('#axis')).toHaveAttribute('aria-label', /−3\/2=−1\.5.*3\/2=1\.5/);
  await expect(page.locator('#progress-detail')).toContainText('3/4');
  await complete(page, 'root-zero', 0, 0, '0', '0');
  await expect(page.locator('#solution')).toContainText('|√0|=0');
  await expect(page.locator('#learning-progress')).toContainText('已保存');
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('kv-math-progress-v2'))['middle:real-symmetry-distance']);
  expect(saved).toBeTruthy();
});

test('目录和首页检索能找到新主题与完成徽标', async ({page}) => {
  await page.goto(topic);
  await complete(page, 'root-positive', 1.4, -1.4, '−√2', '√2');
  await complete(page, 'root-negative', -1.4, 1.4, '√2', '√2');
  await complete(page, 'rational-positive', 1.5, -1.5, '−3/2', '3/2');
  await complete(page, 'zero', 0, 0, '0', '0');
  await page.getByRole('link', {name: '返回初中数学目录'}).click();
  await expect(page.locator('a[href="real-symmetry-distance.html"] .progress-badge')).toHaveText('✓');
  await page.goto(base ? new URL('index.html', base).href : '/index.html');
  await page.locator('#site-query').fill('实数对称');
  await expect(page.locator('#site-results')).toContainText('实数对称与距离实验室');
});

test('320px 键盘移动、换题重置且不横向溢出', async ({page}) => {
  await page.setViewportSize({width: 320, height: 740});
  await page.goto(topic);
  await page.locator('#slider-a').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#value-a')).toContainText('0.1');
  await move(page, '#slider-a', 1.4);
  await page.locator('#check-a').click();
  await expect(page.locator('#slider-b')).toBeEnabled();
  await page.locator('#check-b').scrollIntoViewIfNeeded();
  const axisBounds = await page.locator('#axis').boundingBox();
  expect(axisBounds.y).toBeGreaterThanOrEqual(0);
  expect(axisBounds.y + axisBounds.height).toBeLessThanOrEqual(740);
  await page.locator('#case-select').selectOption('pi-positive');
  await expect(page.locator('#slider-b')).toBeDisabled();
  await expect(page.locator('#slider-a')).toHaveValue('0');
  await expect(page.locator('#point-b')).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});

test('文件直开仍能完成 e 的反射与符号任务', async ({page}) => {
  test.skip(!!base, '公网专项不访问本机文件');
  await page.goto(pathToFileURL(resolve(__dirname, '../../math/middle/real-symmetry-distance.html')).href);
  await complete(page, 'e-negative', -2.7, 2.7, 'e', 'e');
  await expect(page.locator('#solution')).toContainText('|−e|=e');
});

test('存储失败时保留四类结果并支持重试', async ({page}) => {
  test.skip(!!base, '公网专项不替换本机存储实现');
  await page.addInitScript(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === 'kv-math-progress-v2') throw new Error('blocked');
      return original.call(this, key, value);
    };
    window.restoreMathWrites = () => { Storage.prototype.setItem = original; };
  });
  await page.goto(topic);
  await complete(page, 'root-positive', 1.4, -1.4, '−√2', '√2');
  await complete(page, 'root-negative', -1.4, 1.4, '√2', '√2');
  await complete(page, 'rational-positive', 1.5, -1.5, '−3/2', '3/2');
  await complete(page, 'zero', 0, 0, '0', '0');
  await expect(page.locator('#learning-progress')).toContainText('暂未保存');
  await page.evaluate(() => window.restoreMathWrites());
  await page.getByRole('button', {name: '重试保存'}).click();
  await expect(page.locator('#learning-progress')).toContainText('已保存');
});
