const {test, expect} = require('@playwright/test');
const url='/math/topics/hectares-and-square-kilometers/';

test('六个方向及随机边界换算、提示和选项一致',async({page})=>{
  await page.addInitScript(()=>{Math.random=()=>0;});
  await page.goto(url,{timeout:10000});
  const failures=await page.evaluate(()=>{
    const units=[['公顷','平方米',10000,false,20],['平方米','公顷',10000,true,20],['平方千米','公顷',100,false,50],['公顷','平方千米',100,true,50],['平方千米','平方米',1000000,false,10],['平方米','平方千米',1000000,true,10]];
    const errors=[];
    for(let t=0;t<6;t++) for(const sample of [0,.999999]) {
      const seq=[(t+.1)/6,sample];let i=0;Math.random=()=>seq[i++]??0;
      genConvertProblem();
      const [from,to,factor,divide,max]=units[t];
      const n=sample===0?1:max;
      const value=divide?n*factor:n, answer=divide?n:n*factor;
      const problem=document.querySelector('#convertProblem').textContent;
      const hint=document.querySelector('#convertHint').textContent;
      const opts=[...document.querySelectorAll('#convertOptions button')].map(x=>Number(x.dataset.value));
      if(!problem.includes(`${value.toLocaleString()} ${from}`)||!problem.includes(to)||!hint.includes(divide?' ÷ ':' × ')||!hint.includes(answer.toLocaleString())||opts.length!==4||new Set(opts).size!==4||opts.filter(x=>x===answer).length!==1) errors.push({t,sample,problem,hint,opts,answer});
    }
    return errors;
  });
  expect(failures).toEqual([]);
});

test('错误选项突出唯一正确答案，逐题锁定并主动换题',async({page})=>{
  await page.addInitScript(()=>{Math.random=()=>0;});
  await page.goto(url);
  await page.locator('[data-mode="convert"].mode-tab').click();
  const options=page.locator('#convertOptions button');
  const wrong=page.locator('#convertOptions button:not([data-value="10000"])').first();
  const wrongValue=await wrong.getAttribute('data-value');
  expect(wrongValue).not.toBe('10000');
  await wrong.focus(); await page.keyboard.press('Enter');
  await expect(page.locator('#convertResult')).toContainText('答错');
  await expect(page.locator('#convertOptions .correct')).toHaveCount(1);
  await expect(page.locator('#convertOptions .correct')).toHaveAttribute('data-value','10000');
  await expect(options.first()).toBeDisabled();
  await wrong.dispatchEvent('click');
  await expect(page.locator('#convertScore')).toContainText('0 / 1');
  await page.waitForTimeout(1600);
  await expect(page.locator('#convertResult')).toContainText('答错');
  await page.locator('#convertNext').click();
  await expect(page.locator('#convertResult')).toBeEmpty();
});
