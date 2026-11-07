const {test,expect}=require('@playwright/test');
const url='/math/topics/estimation/index.html';
for(const [name,seed,type] of [['最低随机值',0,0],['第二生活题型',0.25,1],['重复中间随机值',0.5,2],['零余额边界',0.999999,3]]){
  test(`${name} 初始化并生成可判断的四个选项`,async({page})=>{
    await page.addInitScript(value=>{Math.random=()=>value;},seed);
    const response=await page.goto(url,{timeout:10000});expect(response.status()).toBe(200);
    for(const selector of ['#round-options button','#est-options button','#life-options button']){
      const texts=await page.locator(selector).allTextContents();expect(texts).toHaveLength(4);expect(new Set(texts).size).toBe(4);
    }
    const round=Number(await page.locator('#round-number').textContent());
    const target=await page.locator('#round-target').textContent();const place=target.includes('百位')?100:10;
    const rounded=Math.round(round/place)*place;
    expect((await page.locator('#round-options button').allTextContents()).map(Number)).toContain(rounded);
    const expression=(await page.locator('#est-expression .est-num').allTextContents()).map(Number);
    const op=await page.locator('#est-expression .est-op').first().textContent();
    const expected=op==='×'?Math.round(expression[0]/10)*10*expression[1]:Math.round(expression[0]/100)*100+(op==='+'?1:-1)*Math.round(expression[1]/100)*100;
    expect((await page.locator('#est-options button').allTextContents()).map(Number)).toContain(expected);
    const question=await page.locator('#life-question').innerText();
    const money=[...question.matchAll(/(\d+)元/g)].map(m=>Number(m[1]));
    let answer;
    if(type===0) answer=money.reduce((sum,n)=>sum+Math.round(n/10)*10,0)+'元';
    else if(type===1) answer=(money[1]>=money[0]?'够':'不够')+'，大约需要'+Math.round(money[0]/100)*100+'元';
    else if(type===2) answer=Math.round(money[0]/10)*10*Number(question.match(/(\d+)本/)[1])+'元';
    else answer=money[0]-Math.round(money[1]/100)*100+'元';
    expect(await page.locator('#life-options button').allTextContents()).toContain(answer);
    if(type===3){expect(money).toEqual([1000,999]);expect(answer).toBe('0元');}
    await page.getByRole('button',{name:'🛒 生活应用'}).click();
    await page.locator('#life-options button').filter({hasText:new RegExp('^'+answer+'$')}).click();
    await expect(page.locator('#life-feedback')).toContainText('正确');
  });
}
test('边界与重复随机序列不会造成生成卡死',async({page})=>{
  await page.goto(url);
  const result=await page.evaluate(()=>{
    let seed=123456789;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
    let invalid=0;
    for(let i=0;i<500;i++){
      newRoundQuestion();newEstQuestion();newLifeQuestion();
      for(const id of ['round-options','est-options','life-options']){
        const texts=[...document.querySelectorAll(`#${id} button`)].map(b=>b.textContent);
        if(texts.length!==4||new Set(texts).size!==4)invalid++;
      }
    }
    return invalid;
  });
  expect(result).toBe(0);
});
