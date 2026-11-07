const {test,expect}=require('@playwright/test');
const url='/math/topics/numbers-within-100/';
async function finish(page) {
  await page.locator('[data-mode="count"].mode-tab').click();
  const n=await page.locator('#count-objects .count-obj').count();
  await page.getByLabel('物体数量').fill(String(n));
  await page.locator('#count-check').click(); await page.locator('#count-check').dispatchEvent('click');
  await expect(page.locator('#count-correct')).toHaveText('1');
  await page.locator('[data-mode="compose"].mode-tab').click();
  const val=Number(await page.locator('#compose-number').innerText());
  await page.getByLabel('十的个数').fill(String(Math.floor(val/10)));
  await page.getByLabel('一的个数').fill(String(val%10));
  await page.locator('#compose-check').click();await page.locator('#compose-check').dispatchEvent('click');
  await expect(page.locator('#compose-correct')).toHaveText('1');
  await page.locator('[data-mode="compare"].mode-tab').click();
  const left=Number(await page.locator('#compare-left').innerText()), right=Number(await page.locator('#compare-right').innerText());
  const symbol=left>right?'>':left<right?'<':'=';
  const cmp=page.locator('.compare-opt').getByText(symbol,{exact:true});
  await cmp.click();await cmp.dispatchEvent('click');
  await expect(page.locator('#compare-correct')).toHaveText('1');
  await page.locator('[data-mode="sequence"].mode-tab').click();
  const seq=await page.locator('#sequence-row > div').allTextContents();
  const blank=seq.indexOf('?'), step=(Number(seq[4])-Number(seq[0]))/4;
  const answer=String(Number(seq[0])+step*blank);
  const opts=page.locator('#seq-options button'); await expect(opts).toHaveCount(4);
  expect(new Set(await opts.allTextContents()).size).toBe(4);
  const choice=opts.getByText(answer,{exact:true});
  await choice.click();await choice.dispatchEvent('click');
  await expect(page.locator('#seq-correct')).toHaveText('1');
}
for(const value of [0,.999999]) {
  test(`固定随机值 ${value} 下四种活动完成`,async({page})=>{
    await page.addInitScript(v=>{Math.random=()=>v;},value);await page.goto(url,{timeout:10000});
    await expect(page.locator('#learningProgress')).toContainText('0/4');
    await finish(page);await expect(page.locator('#learningProgress')).toHaveText('✓ 本主题已完成');
    await page.reload();await expect(page.locator('#learningProgress')).toHaveText('✓ 本主题已完成');
    await page.goto('/math/index.html');
    await expect(page.locator('a[href="topics/numbers-within-100/index.html"] .progress-badge').first()).toHaveText('✓');
  });
}
test('七种数序和两端起点都有合法唯一选项',async({page})=>{
  await page.addInitScript(()=>{Math.random=()=>0;});await page.goto(url);
  await page.locator('[data-mode="sequence"].mode-tab').click();
  for(let type=0;type<7;type++) for(const edge of [0,.999999]) {
    await page.evaluate(({type,edge})=>{
      const values=[(type+.1)/7,edge,edge];let i=0;
      Math.random=()=>values[i++]??0;
      document.getElementById('seq-next').click();
    },{type,edge});
    const values=await page.locator('#sequence-row > div').allTextContents();
    const missing=values.indexOf('?'), first=Number(values[0]), last=Number(values[4]);
    const expected=first+(last-first)/4*missing;
    const opts=(await page.locator('#seq-options button').allTextContents()).map(Number);
    expect([first,last].every(v=>v>=1&&v<=100)).toBe(true);
    expect(opts).toHaveLength(4);expect(new Set(opts).size).toBe(4);
    expect(opts.filter(v=>v===expected)).toHaveLength(1);
    expect(opts.every(v=>v>=1&&v<=100)).toBe(true);
  }
});
test('拒绝小数输入并保持反馈到下一题',async({page})=>{
  await page.addInitScript(()=>{Math.random=()=>0;});await page.goto(url);
  await page.getByLabel('物体数量').fill('5.3');await page.locator('#count-check').click();
  await expect(page.locator('#count-feedback')).toContainText('整数');await expect(page.locator('#count-correct')).toHaveText('0');
  await page.getByLabel('物体数量').fill('5');await page.locator('#count-check').click();
  await page.waitForTimeout(1700);await expect(page.locator('#count-feedback')).toContainText('答对');
  await page.locator('#count-next').click();await expect(page.locator('#count-feedback')).toBeEmpty();
});
test('完成时存储失败可重试',async({page})=>{
  await page.addInitScript(()=>{Math.random=()=>0;window.oldSet=Storage.prototype.setItem;Storage.prototype.setItem=()=>{throw Error('denied');};});
  await page.goto(url);await finish(page);await expect(page.locator('#learningProgress')).toContainText('尚未保存');
  await page.evaluate(()=>{Storage.prototype.setItem=window.oldSet;});await page.locator('#math-progress-save-notice button').click();
  await expect(page.locator('#learningProgress')).toHaveText('✓ 本主题已完成');
  await page.reload();await expect(page.locator('#learningProgress')).toHaveText('✓ 本主题已完成');
});
