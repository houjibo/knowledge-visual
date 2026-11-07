const {test,expect}=require('@playwright/test');
const url='/math/topics/large-numbers/';

test('跨数级与零读法、固定随机读数选项',async({page})=>{
  await page.addInitScript(()=>{Math.random=()=>0;}); await page.goto(url,{timeout:10000});
  const actual=await page.evaluate(()=>['0','10','1010','10000','10010','100010000','100000001','100000000','100100010','10000000000','202005400','100005030'].map(readNumber));
  expect(actual).toEqual(['零','十','一千零一十','一万','一万零一十','一亿零一万','一亿零一','一亿','一亿零一十万零一十','一百亿','二亿零二百万五千四百','一亿零五千零三十']);
  await page.locator('[data-mode="read"].mode-tab').click();
  const opts=page.locator('#read-options button'); await expect(opts).toHaveCount(4);
  expect(new Set(await opts.allTextContents()).size).toBe(4);
  const correct=opts.getByText('一千',{exact:true}); await correct.focus(); await page.keyboard.press('Enter');
  await correct.dispatchEvent('click'); await expect(page.locator('#streak')).toHaveText('1');
  await expect(page.locator('#read-next')).toBeVisible();
});

test('数位按键定位正确，写数与比较逐题计分',async({page})=>{
  await page.addInitScript(()=>{Math.random=()=>0;}); await page.goto(url);
  const digits=page.locator('#place-num [role="button"]'); await expect(digits).toHaveCount(5);
  await digits.first().focus(); await page.keyboard.press('Enter');
  await expect(page.locator('#place-info-val')).toContainText('1 在 万位');
  await digits.last().focus(); await page.keyboard.press('Space');
  await expect(page.locator('#place-info-val')).toContainText('0 在 个位');
  await page.locator('[data-mode="write"].mode-tab').click();
  const value=await page.evaluate(()=>writeAnswer); await page.locator('#write-input').fill(value);
  await page.locator('#write-submit').click(); await page.locator('#write-submit').click();
  await expect(page.locator('#streak')).toHaveText('1');
  await expect(page.locator('#write-answer')).toContainText('正确');
  await page.waitForTimeout(1600); await expect(page.locator('#write-answer')).toContainText('正确');
  await page.locator('#write-next').click(); await expect(page.locator('#write-answer')).toBeEmpty();
  await page.locator('[data-mode="compare"].mode-tab').click();
  await page.locator('.cmp-btn[data-val="="]').click(); await page.locator('.cmp-btn[data-val="="]').dispatchEvent('click');
  await expect(page.locator('#streak')).toHaveText('2');
  await expect(page.locator('#compare-next')).toBeVisible();
});

test('达到完成条件时存储失败可重试',async({page})=>{
  await page.addInitScript(()=>{Math.random=()=>0;window.oldSet=Storage.prototype.setItem;Storage.prototype.setItem=()=>{throw Error('denied');};});
  await page.goto(url); await page.locator('[data-mode="write"].mode-tab').click();
  for(let i=0;i<10;i++) {
    const value=await page.evaluate(()=>writeAnswer);
    await page.locator('#write-input').fill(value); await page.locator('#write-submit').click();
    if(i<9) await page.locator('#write-next').click();
  }
  await expect(page.locator('#math-progress-save-notice')).toContainText('暂未保存');
  await page.evaluate(()=>{Storage.prototype.setItem=window.oldSet;});
  await page.locator('#math-progress-save-notice button').click();
  await page.reload(); expect(await page.evaluate(()=>PageProgress.isDone('large-numbers'))).toBe(true);
});
