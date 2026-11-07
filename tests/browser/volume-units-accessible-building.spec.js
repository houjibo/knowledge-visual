const {test,expect}=require('@playwright/test');
const url='/math/topics/volume-units/index.html';

test('键盘可移动、搭建和移除并同步反馈',async({page})=>{
  await page.addInitScript(()=>{Math.random=()=>0;}); await page.goto(url); await page.locator('[data-mode="build"]').click();
  const cells=page.locator('#buildGrid button'); await expect(cells).toHaveCount(42);
  await cells.nth(0).focus(); await page.keyboard.press('Space'); await page.keyboard.press('ArrowRight'); await page.keyboard.press('Enter');
  await page.keyboard.press('ArrowDown'); await page.keyboard.press('Space'); await page.keyboard.press('ArrowLeft'); await page.keyboard.press('Enter');
  await expect(page.locator('#blockCount')).toHaveText('4'); await expect(page.locator('#buildResult')).toContainText('完全正确');
  await page.locator('#btnRemoveBlock').click(); await expect(page.locator('#btnRemoveBlock')).toHaveAttribute('aria-pressed','true');
  await cells.nth(0).click(); await expect(page.locator('#blockCount')).toHaveText('3'); await expect(page.locator('#buildResult')).toBeEmpty();
  await page.locator('#btnClearBuild').click(); await expect(page.locator('#blockCount')).toHaveText('0');
});

test('不同目标在缩放视口下点击对应方格可完成',async({page})=>{
  await page.goto(url); await page.locator('[data-mode="build"]').click();
  for(let i=0;i<8;i++){
    await page.evaluate(value=>{Math.random=()=>value;},(i+.01)/8); await page.locator('#btnNewShape').click();
    const target=page.locator('#buildGrid .build-cell.target'); const n=await target.count();
    expect(n).toBe(Number(await page.locator('#targetCount').textContent()));
    for(const cell of await target.all()) { if(test.info().project.name==='mobile') await cell.tap(); else await cell.click(); }
    await expect(page.locator('#buildResult')).toContainText('完全正确'); await expect(page.locator('#blockCount')).toHaveText(String(n));
  }
  const bounds=await page.locator('#buildGrid').evaluate(el=>[el.getBoundingClientRect().right,document.documentElement.clientWidth]); expect(bounds[0]).toBeLessThanOrEqual(bounds[1]);
});

test('数量正确但位置不同可继续修正',async({page})=>{
  await page.addInitScript(()=>{Math.random=()=>0;}); await page.goto(url); await page.locator('[data-mode="build"]').click();
  for(const i of [0,1,7,9]) await page.locator('#buildGrid button').nth(i).click();
  await expect(page.locator('#buildResult')).toContainText('位置');
  await page.locator('#btnRemoveBlock').click(); await page.locator('#buildGrid button').nth(9).click();
  await expect(page.locator('#buildResult')).toBeEmpty();
  await page.locator('#btnAddBlock').click(); await page.locator('#buildGrid button').nth(8).click();
  await expect(page.locator('#buildResult')).toContainText('完全正确');
});
