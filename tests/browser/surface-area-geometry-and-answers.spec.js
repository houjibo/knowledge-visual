const {test, expect} = require('@playwright/test');
const url='/math/topics/surface-area/index.html';
const vertices = v => v.split(' ').map(pair => pair.split(',').map(Number));

test('立体图共享棱，长方体展开图六面尺寸一致', async ({page}) => {
  await page.goto(url);
  for (const id of ['shape-cuboid','shape-cube']) {
    const polygons=page.locator(`#${id} polygon`);
    const front=vertices(await polygons.nth(0).getAttribute('points'));
    const right=vertices(await polygons.nth(1).getAttribute('points'));
    const top=vertices(await polygons.nth(2).getAttribute('points'));
    expect(right[0]).toEqual(front[1]); expect(right[3]).toEqual(front[2]);
    expect(top[0]).toEqual(front[3]); expect(top[1]).toEqual(front[2]); expect(top[2]).toEqual(right[2]);
  }
  await page.locator('[data-mode="unfold"]').click();
  const rects=page.locator('#unfold-cuboid rect');
  const sizes=[]; for(const r of await rects.all()) sizes.push([Number(await r.getAttribute('width')),Number(await r.getAttribute('height'))]);
  expect(sizes).toEqual([[100,60],[100,80],[100,60],[60,80],[60,80],[100,80]]);
  await page.locator('#unfoldBtn').click(); await expect(page.locator('#unfold-cube')).toBeVisible();
  await expect(page.locator('#unfold-cube rect')).toHaveCount(6);
});

test('五个生活题的正确答案与条件一致', async ({page}) => {
  await page.goto(url); await page.locator('[data-mode="challenge"]').click();
  for (const answer of ['600 cm²','1300 cm²','74 m²','54 cm²','640 cm²']) {
    await page.locator('#challengeOptions button').getByText(answer,{exact:true}).click();
    await expect(page.locator('#challengeFeedback')).toContainText('答对');
    await page.locator('#nextBtn').click();
  }
  await expect(page.locator('#challengeCorrect')).toHaveText('5');
});
