const {test, expect} = require('@playwright/test');
const {resolve} = require('node:path');
const {pathToFileURL} = require('node:url');
const {startReleaseServer} = require('./release-server');
const topic = process.env.KV_PUBLISHED_BASE_URL
  ? new URL('math/uni/eigenvalues.html', process.env.KV_PUBLISHED_BASE_URL.replace(/\/?$/, '/')).href
  : '/math/uni/eigenvalues.html';

async function progress(page, value) {
  await page.locator('#animSlider').evaluate((slider, next) => {
    slider.value = String(next);
    slider.dispatchEvent(new Event('input', {bubbles:true}));
  }, value);
}

test('正、负和零特征值有不同的最终方向反馈', async ({page}) => {
  await page.goto(topic);
  await page.getByRole('button', {name:'拉伸'}).click();
  await progress(page, 100);
  await expect(page.locator('#geoInfo')).toContainText('v⃗₁ 同向；v⃗₂ 同向');
  await expect(page.locator('#geoAnimInfo')).toContainText('v⃗₂ ×1.50（同向）');

  await page.getByRole('button', {name:'反射'}).click();
  await expect(page.locator('#geoInfo')).toContainText('v⃗₁ 同向；v⃗₂ 反向');
  await expect(page.locator('#geoAnimInfo')).toContainText('v⃗₂ ×-1.00（反向）');
  const reflected = await page.evaluate(() => {
    const v = geoEigen.v2;
    const image = matVec2(geoMatrix, v);
    return {dot: v[0]*image[0]+v[1]*image[1], image};
  });
  expect(reflected.dot).toBeLessThan(0);

  await page.getByRole('button', {name:'压到直线'}).click();
  await expect(page.locator('#geoInfo')).toContainText('v⃗₂ 零向量在原点，无方向');
  await expect(page.locator('#geoAnimInfo')).toContainText('v⃗₂ ×0（零向量在原点，无方向）');
  expect(await page.evaluate(() => matVec2(geoMatrix, geoEigen.v2))).toEqual([0,0]);
});

test('反射动画过零点时画布不把零向量画成箭头', async ({page}) => {
  await page.goto(topic);
  await page.getByRole('button', {name:'反射'}).click();
  await page.evaluate(() => {
    window.geoArrows = [];
    window.geoLabels = [];
    const original = drawArrow;
    window.drawArrow = function(ctx, x1, y1, x2, y2, color, width) {
      if (ctx === geoCtx && (color.includes('251,191,36') || color.includes('52,211,153'))) window.geoArrows.push({x1,y1,x2,y2,color});
      return original(ctx, x1, y1, x2, y2, color, width);
    };
    const fillText = geoCtx.fillText.bind(geoCtx);
    geoCtx.fillText = function(label, ...args) {
      window.geoLabels.push(String(label));
      return fillText(label, ...args);
    };
  });
  await progress(page, 0);
  await expect(page.locator('#geoAnimInfo')).toContainText('v⃗₂ ×1.00（同向）');
  await progress(page, 50);
  await expect(page.locator('#geoAnimInfo')).toContainText('v⃗₂ ×0（零向量在原点，无方向）');
  const midpoint = await page.evaluate(() => ({
    arrows: window.geoArrows.splice(0),
    pixel: [...geoCtx.getImageData(geoCvs.width/2,geoCvs.height/2,1,1).data]
  }));
  expect(midpoint.arrows.filter(arrow => arrow.color.includes('251,191,36'))).toHaveLength(3);
  expect(midpoint.pixel.slice(0,3)).toEqual([251,191,36]);
  expect(await page.evaluate(() => window.geoLabels)).toContain('M(t)v⃗₁');
  await progress(page, 100);
  await expect(page.locator('#geoAnimInfo')).toContainText('v⃗₂ ×-1.00（反向）');
  const finalArrows = await page.evaluate(() => window.geoArrows.splice(0));
  expect(finalArrows).toHaveLength(4);
  const originalV2 = finalArrows[2], imageV2 = finalArrows[3];
  const dot = (originalV2.x2-originalV2.x1)*(imageV2.x2-imageV2.x1) + (originalV2.y2-originalV2.y1)*(imageV2.y2-imageV2.y1);
  expect(dot).toBeLessThan(0);
});

test('窄屏、键盘、文件直开和发布子路径可查看方向反馈', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL, '本地文件与构建路径检查');
  await page.setViewportSize({width:320,height:700});
  await page.goto(pathToFileURL(resolve('math/uni/eigenvalues.html')).href);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await page.getByRole('button', {name:'压到直线'}).click();
  await page.locator('#animSlider').focus();
  await page.keyboard.press('End');
  await expect(page.locator('#animSlider')).toBeFocused();
  await expect(page.locator('#geoAnimInfo')).toContainText('零向量在原点，无方向');
  await page.locator('#geo-d').focus();
  await page.keyboard.press('ArrowUp');
  await page.getByRole('button', {name:'更新'}).click();
  await expect(page.locator('#geoInfo')).toContainText('v⃗₂ 同向');
  const release = await startReleaseServer();
  try {
    await page.goto(new URL('math/uni/eigenvalues.html', release.base).href);
    await page.getByRole('button', {name:'反射'}).click();
    await progress(page, 100);
    await expect(page.locator('#geoAnimInfo')).toContainText('v⃗₂ ×-1.00（反向）');
  } finally {await release.close();}
});
