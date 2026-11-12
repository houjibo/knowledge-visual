const {test, expect} = require('@playwright/test');
const {resolve} = require('node:path');
const {pathToFileURL} = require('node:url');

const topic = process.env.KV_PUBLISHED_BASE_URL
  ? new URL('chemistry/high/nonmetals.html', process.env.KV_PUBLISHED_BASE_URL.replace(/\/?$/, '/')).href
  : '/chemistry/high/nonmetals.html';
const progressKey = 'kv-chemistry-high-progress';
const elements = [
  ['cl','氯','Cl',17,[2,8,7],'[Ne] 3s² 3p⁵'],
  ['s','硫','S',16,[2,8,6],'[Ne] 3s² 3p⁴'],
  ['n','氮','N',7,[2,5],'[He] 2s² 2p³'],
  ['si','硅','Si',14,[2,8,4],'[Ne] 3s² 3p²'],
  ['o','氧','O',8,[2,6],'[He] 2s² 2p⁴'],
  ['f','氟','F',9,[2,7],'[He] 2s² 2p⁵'],
  ['c','碳','C',6,[2,4],'[He] 2s² 2p²'],
  ['p','磷','P',15,[2,8,5],'[Ne] 3s² 3p³'],
];
const reactions = {
  nitrogen:[
    ['N₂','NH₃','N₂ + 3H₂ ⇌ 2NH₃','高温高压催化剂'],
    ['NH₃','NO','4NH₃ + 5O₂ → 4NO + 6H₂O','催化剂/加热'],
    ['NO','NO₂','2NO + O₂ → 2NO₂','常温'],
    ['NO₂','HNO₃','3NO₂ + H₂O → 2HNO₃ + NO','与水反应'],
    ['HNO₃','NO₂','Cu + 4HNO₃(浓) → Cu(NO₃)₂ + 2NO₂↑ + 2H₂O','与Cu反应'],
    ['N₂','NO','N₂ + O₂ ⇌ 2NO','放电'],
  ],
  sulfur:[
    ['S','SO₂','S + O₂ → SO₂','点燃'],
    ['SO₂','SO₃','2SO₂ + O₂ ⇌ 2SO₃','催化剂/加热'],
    ['SO₃','H₂SO₄','SO₃ + H₂O → H₂SO₄','与水反应'],
    ['H₂SO₄','SO₂','Cu + 2H₂SO₄(浓) → CuSO₄ + SO₂↑ + 2H₂O','与Cu加热'],
    ['SO₂','H₂SO₃','SO₂ + H₂O ⇌ H₂SO₃','溶于水'],
    ['S','H₂S','S + H₂ → H₂S','与H₂加热'],
  ],
};
const elementGroup = page => page.getByRole('radiogroup',{name:'非金属元素选择',exact:true});
const reactionGroup = page => page.getByRole('radiogroup',{name:'当前系列转化选择',exact:true});

async function captureDrawing(page) {
  await page.addInitScript(() => {
    window.nonmetalFrames = {};
    const proto = CanvasRenderingContext2D.prototype;
    const clear = proto.clearRect, text = proto.fillText, arc = proto.arc;
    proto.clearRect = function(...args) {
      if (this.canvas.id) window.nonmetalFrames[this.canvas.id] = {texts:[], electrons:[]};
      return clear.apply(this,args);
    };
    proto.fillText = function(...args) {
      const frame = window.nonmetalFrames[this.canvas.id];
      if (frame) frame.texts.push(String(args[0]));
      return text.apply(this,args);
    };
    proto.arc = function(...args) {
      const frame = window.nonmetalFrames[this.canvas.id];
      if (frame && this.canvas.id === 'canvas-elements' && args[2] === 4) frame.electrons.push([args[0],args[1]]);
      return arc.apply(this,args);
    };
  });
}
async function frame(page,id) {
  return page.evaluate(id => window.nonmetalFrames[id] || {texts:[],electrons:[]},id);
}
async function expectSelected(group,index) {
  const options = group.getByRole('radio');
  await expect(options.nth(index)).toHaveAttribute('aria-checked','true');
  await expect(options.nth(index)).toHaveAttribute('tabindex','0');
  await expect(group.locator('[aria-checked="true"]')).toHaveCount(1);
  await expect(group.locator('[tabindex="0"]')).toHaveCount(1);
}
async function transforms(page) {
  await page.locator('#tab-transforms').click();
  await expect(reactionGroup(page).getByRole('radio')).toHaveCount(6);
}

test('元素组真实Tab可达，初始化与点击使用同一完整属性和说明', async ({page}) => {
  await page.goto(topic);
  const group = elementGroup(page), radios = group.getByRole('radio');
  await expect(radios).toHaveCount(8);
  expect(await radios.evaluateAll(items => items.every(item => item.tagName === 'BUTTON' && item.type === 'button'))).toBe(true);
  await expectSelected(group,0);
  await page.locator('#stage-elements').press('Tab');
  await expect(radios.first()).toBeFocused();
  await expect(radios.first()).toHaveCSS('outline-style','solid');
  await expect(page.locator('#element-info')).toContainText('HClO');
  await expect(page.locator('#element-info')).toContainText('强氧化性');
  await expect(page.locator('#canvas-elements')).toHaveAttribute('role','img');
  await expect(page.locator('#canvas-elements')).toHaveAttribute('aria-describedby',/element-info/);
  await expect(page.locator('#canvas-elements')).toHaveAttribute('aria-label',/氯.*Cl.*17.*2.*8.*7/);
});

test('八元素的选中状态、属性、实际绘制和电子层分布一致', async ({page},testInfo) => {
  await captureDrawing(page);
  await page.goto(topic);
  for (const [index,[key,name,symbol,number,shells,configuration]] of elements.entries()) {
    const option = page.locator(`.element-card[data-element="${key}"]`);
    if (testInfo.project.name === 'mobile') await option.tap(); else await option.click();
    await expectSelected(elementGroup(page),index);
    await expect(page.locator('#element-info .title')).toContainText(`${name} (${symbol})`);
    await expect(page.locator('#element-info .prop').filter({hasText:'原子序数'}).locator('.prop-value')).toHaveText(String(number));
    await expect(page.locator('#element-info')).toContainText(configuration);
    await expect(page.locator('#canvas-elements')).toHaveAttribute('aria-label',new RegExp(`${name}.*${symbol}.*${number}`));
    await expect(page.locator('#canvas-elements')).toHaveAttribute('aria-label',new RegExp(shells.join('.*')));
    await expect.poll(async () => (await frame(page,'canvas-elements')).texts.includes(symbol)).toBe(true);
    const drawing = await frame(page,'canvas-elements');
    expect(drawing.texts).toContain(`电子排布: ${configuration}`);
    expect(drawing.electrons).toHaveLength(number);
    // Recover the common centre from the evenly distributed rendered electrons.
    // Compare counts per radius without depending on arbitrary canvas pixel radii.
    const centre = drawing.electrons.reduce((sum,p) => [sum[0]+p[0]/number,sum[1]+p[1]/number],[0,0]);
    const counts = new Map();
    for (const p of drawing.electrons) {
      const radius = Math.round(Math.hypot(p[0]-centre[0],p[1]-centre[1]));
      counts.set(radius,(counts.get(radius)||0)+1);
    }
    expect([...counts.entries()].sort((a,b)=>a[0]-b[0]).map(entry=>entry[1])).toEqual(shells);
  }
});

test('元素方向键与首尾循环选中，Enter和Space不删除焦点节点', async ({page}) => {
  await page.goto(topic);
  const group = elementGroup(page), radios = group.getByRole('radio');
  await radios.first().focus();
  for (let i=1;i<8;i++) {
    await page.keyboard.press('ArrowRight');
    await expectSelected(group,i);
    await expect(radios.nth(i)).toBeFocused();
  }
  await page.keyboard.press('ArrowDown'); await expectSelected(group,0);
  await page.keyboard.press('ArrowLeft'); await expectSelected(group,7);
  await page.keyboard.press('ArrowUp'); await expectSelected(group,6);
  await page.keyboard.press('Home'); await expectSelected(group,0);
  await page.keyboard.press('End'); await expectSelected(group,7);
  await page.evaluate(() => {window.nonmetalFocusedElement=document.activeElement;});
  await page.keyboard.press('Enter'); await page.keyboard.press('Space');
  expect(await page.evaluate(() => window.nonmetalFocusedElement.isConnected && window.nonmetalFocusedElement===document.activeElement)).toBe(true);
  await expectSelected(group,7);
});

test('减少动态时电子位置静止，选择仍立即更新且不依赖动画', async ({page}) => {
  await captureDrawing(page);
  await page.clock.install();
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto(topic);
  await page.clock.runFor(96);
  const before = await frame(page,'canvas-elements');
  expect(before.electrons).toHaveLength(17);
  await page.clock.runFor(160);
  expect((await frame(page,'canvas-elements')).electrons).toEqual(before.electrons);
  await elementGroup(page).getByRole('radio').first().focus();
  await page.keyboard.press('ArrowRight');
  await page.clock.runFor(32);
  await expectSelected(elementGroup(page),1);
  expect((await frame(page,'canvas-elements')).electrons).toHaveLength(16);
  await expect(page.locator('.element-card.selected')).toHaveCSS('transform','none');
});

test('反应首项可Tab聚焦但不隐式选择，Space后才显示反应', async ({page}) => {
  await page.goto(topic); await transforms(page);
  const group = reactionGroup(page), radios = group.getByRole('radio');
  expect(await radios.evaluateAll(items => items.every(item=>item.tagName==='BUTTON' && item.type==='button'))).toBe(true);
  await expect(group.locator('[aria-checked="true"]')).toHaveCount(0);
  await expect(group.locator('[tabindex="0"]')).toHaveCount(1);
  await expect(page.locator('#reaction-detail')).toContainText('尚未选择');
  await page.locator('#series-nitrogen').press('Tab');
  await expect(radios.first()).toBeFocused();
  await expect(group.locator('[aria-checked="true"]')).toHaveCount(0);
  await page.keyboard.press('Space');
  await expectSelected(group,0);
  await expect(radios.first()).toBeFocused();
  await expect(page.locator('#reaction-detail')).toContainText(reactions.nitrogen[0][2]);
});

test('氮硫十二条反应的列表、详情、可读高亮和实际条件绘制一致', async ({page},testInfo) => {
  await captureDrawing(page);
  await page.goto(topic); await transforms(page);
  for (const series of ['nitrogen','sulfur']) {
    await page.locator(`#series-${series}`).click();
    for (const [index,[from,to,equation,condition]] of reactions[series].entries()) {
      const option = reactionGroup(page).getByRole('radio').nth(index);
      if (testInfo.project.name==='mobile') await option.tap(); else await option.click();
      await expectSelected(reactionGroup(page),index);
      await expect(option).toContainText(from); await expect(option).toContainText(to);
      await expect(page.locator('#reaction-detail')).toContainText(equation);
      await expect(page.locator('#reaction-detail')).toContainText(condition);
      await expect(page.locator('#canvas-transforms')).toHaveAttribute('aria-label',new RegExp(condition));
      expect(await page.locator('#canvas-transforms').getAttribute('aria-label')).toContain(equation);
      await expect.poll(async () => (await frame(page,'canvas-transforms')).texts.includes(condition)).toBe(true);
    }
  }
});

test('反应连续方向键与原生激活保持节点身份、焦点和唯一选择', async ({page}) => {
  await page.goto(topic); await transforms(page);
  const group=reactionGroup(page), radios=group.getByRole('radio');
  await page.evaluate(()=>{window.nonmetalReactionNodes=[...document.querySelectorAll('#transform-list .transform-item')];});
  await radios.first().focus(); await page.keyboard.press('Enter');
  for (let i=1;i<6;i++) {
    await page.keyboard.press('ArrowDown'); await expectSelected(group,i); await expect(radios.nth(i)).toBeFocused();
  }
  await page.keyboard.press('ArrowRight'); await expectSelected(group,0);
  await page.keyboard.press('ArrowLeft'); await expectSelected(group,5);
  await page.keyboard.press('ArrowUp'); await expectSelected(group,4);
  await page.keyboard.press('Home'); await expectSelected(group,0);
  await page.keyboard.press('End'); await expectSelected(group,5);
  await page.keyboard.press('Space'); await page.keyboard.press('Enter');
  expect(await page.evaluate(()=>{
    const current=[...document.querySelectorAll('#transform-list .transform-item')];
    return current.every((node,i)=>node===window.nonmetalReactionNodes[i]) && window.nonmetalReactionNodes[5]===document.activeElement;
  })).toBe(true);
  await expect(page.locator('#reaction-detail')).toContainText(reactions.nitrogen[5][2]);
});

test('同系列激活保留反应，真实跨系列才清空并保留有效键盘入口', async ({page}) => {
  await page.goto(topic); await transforms(page);
  await reactionGroup(page).getByRole('radio').nth(4).click();
  await page.locator('#series-nitrogen').press('Enter');
  await expectSelected(reactionGroup(page),4);
  await expect(page.locator('#reaction-detail')).toContainText(reactions.nitrogen[4][2]);
  await page.locator('#tab-elements').click(); await page.locator('#tab-transforms').click();
  await expectSelected(reactionGroup(page),4);
  await page.locator('#series-nitrogen').press('ArrowRight');
  await expect(page.locator('#series-sulfur')).toBeFocused();
  await expect(reactionGroup(page).locator('[aria-checked="true"]')).toHaveCount(0);
  await expect(page.locator('#reaction-detail')).toContainText('尚未选择');
  await expect(page.locator('#reaction-detail')).not.toContainText(reactions.nitrogen[4][2]);
  await page.keyboard.press('Tab');
  await expect(reactionGroup(page).getByRole('radio').first()).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#reaction-detail')).toContainText(reactions.sulfur[0][2]);
});

test('两系列摘要只表达实际六条边，浓酸限定不丢失', async ({page}) => {
  await page.goto(topic); await transforms(page);
  for (const series of ['nitrogen','sulfur']) {
    await page.locator(`#series-${series}`).click();
    const summary=page.locator('#transform-summary');
    for (const [from,to] of reactions[series]) await expect(summary).toContainText(`${from} → ${to}`);
    await expect(summary).not.toContainText('硝酸盐');
    await expect(summary).not.toContainText('中和');
    await reactionGroup(page).getByRole('radio').nth(series==='nitrogen'?4:3).click();
    await expect(page.locator('#reaction-detail')).toContainText('(浓)');
    await expect(page.locator('#canvas-transforms')).toHaveAttribute('aria-label',/浓/);
  }
});

test('重复选择和绘制帧不反复更新短状态播报', async ({page}) => {
  await page.clock.install();
  await page.goto(topic);
  await page.evaluate(()=>{
    window.nonmetalStatusMutations=0;
    const observer=new MutationObserver(records=>{window.nonmetalStatusMutations+=records.length;});
    observer.observe(document.querySelector('#element-selection-status'),{childList:true,characterData:true,subtree:true});
  });
  await elementGroup(page).getByRole('radio').first().press('Enter');
  await page.clock.runFor(160);
  expect(await page.evaluate(()=>window.nonmetalStatusMutations)).toBe(0);
  await transforms(page); await reactionGroup(page).getByRole('radio').first().click();
  await page.evaluate(()=>{
    window.nonmetalReactionStatusMutations=0;
    const observer=new MutationObserver(records=>{window.nonmetalReactionStatusMutations+=records.length;});
    observer.observe(document.querySelector('#transform-selection-status'),{childList:true,characterData:true,subtree:true});
  });
  await reactionGroup(page).getByRole('radio').first().press('Space');
  await page.locator('#series-nitrogen').press('Enter');
  await page.clock.runFor(160);
  expect(await page.evaluate(()=>window.nonmetalReactionStatusMutations)).toBe(0);
});

test('碳状态与氧常见价态示例准确并保留来源入口', async ({page}) => {
  await page.goto(topic);
  await page.locator('.element-card[data-element="c"]').click();
  const carbon=page.locator('#element-info .prop').filter({hasText:'单质状态'}).locator('.prop-value');
  await expect(carbon).toContainText('固体'); await expect(carbon).toContainText('石墨'); await expect(carbon).toContainText('金刚石');
  await page.locator('.element-card[data-element="o"]').click();
  const valence=page.locator('#element-info .prop').filter({hasText:'常见化合价'}).locator('.prop-value');
  await expect(valence).toContainText('-1'); await expect(valence).toContainText('-2');
  await expect(page.locator('#element-info')).toContainText('H₂O₂');
  await expect(page.locator('a[href*="periodic-table.rsc.org/element/6/"]')).toHaveCount(1);
  await expect(page.locator('a[href*="periodic-table.rsc.org/element/8/"]')).toHaveCount(1);
  await expect(page.locator('#element-visual-note')).toContainText('示意');
});

test('探索选择不改变已答题、分数和已有进度原文', async ({page}) => {
  await page.addInitScript(key=>localStorage.setItem(key,'{"nonmetals":true,"mole-concept":true}'),progressKey);
  await page.goto(topic);
  const raw=await page.evaluate(key=>localStorage.getItem(key),progressKey);
  await page.locator('#tab-quiz').click();
  await page.locator('#quiz-options button').nth(1).click();
  await expect(page.locator('#quiz-score')).toHaveText('1');
  await expect(page.locator('#quiz-answered')).toHaveText('1/5');
  await page.locator('#tab-elements').click();
  for (const [key] of elements) await page.locator(`.element-card[data-element="${key}"]`).click();
  await transforms(page);
  for (const series of ['nitrogen','sulfur']) {
    await page.locator(`#series-${series}`).click();
    for (let i=0;i<6;i++) await reactionGroup(page).getByRole('radio').nth(i).click();
  }
  await page.locator('#tab-quiz').click();
  await expect(page.locator('#quiz-score')).toHaveText('1');
  await expect(page.locator('#quiz-answered')).toHaveText('1/5');
  await expect(page.locator('#quiz-options button:disabled')).toHaveCount(4);
  await expect(page.locator('#quiz-options button').nth(1)).toContainText('你的选择');
  expect(await page.evaluate(key=>localStorage.getItem(key),progressKey)).toBe(raw);
});

test('320px下八元素和十二反应均可见可选且不横向溢出', async ({page},testInfo) => {
  await page.setViewportSize({width:320,height:844}); await page.goto(topic);
  for (const [key] of elements) {
    const option=page.locator(`.element-card[data-element="${key}"]`);
    if(testInfo.project.name==='mobile') await option.tap(); else await option.click();
    await expect(option).toBeVisible();
    expect((await option.boundingBox()).height).toBeGreaterThanOrEqual(40);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  }
  await transforms(page);
  for(const series of ['nitrogen','sulfur']) {
    await page.locator(`#series-${series}`).click();
    for(let i=0;i<6;i++) {
      const option=reactionGroup(page).getByRole('radio').nth(i);
      await option.click(); await expect(option).toBeVisible();
      expect((await option.boundingBox()).height).toBeGreaterThanOrEqual(40);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
    }
  }
});

test('无2D画布仍可选择和阅读，四主题不产生脚本异常', async ({page}) => {
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(()=>{HTMLCanvasElement.prototype.getContext=()=>null;});
  await page.goto(topic);
  await expect(page.locator('#elements-canvas-fallback')).toBeVisible();
  await page.locator('.element-card[data-element="s"]').click();
  await expect(page.locator('#element-info .title')).toContainText('硫');
  await transforms(page); await reactionGroup(page).getByRole('radio').nth(3).click();
  await expect(page.locator('#transforms-canvas-fallback')).toBeVisible();
  await expect(page.locator('#reaction-detail')).toContainText(reactions.nitrogen[3][2]);
  await page.locator('#tab-chlorine').click(); await page.locator('#tab-quiz').click();
  await expect(page.locator('#quiz-score')).toHaveText('0');
  expect(errors).toEqual([]);
});

test('直接打开文件可离线键盘选择元素和反应', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL,'公网专项只检查公开资源');
  const errors=[],external=[];page.on('pageerror',error=>errors.push(error.message));
  page.on('request',request=>{if(/^https?:/.test(request.url())) external.push(request.url());});
  await page.goto(pathToFileURL(resolve(__dirname,'../../chemistry/high/nonmetals.html')).href);
  await page.locator('#stage-elements').press('Tab'); await page.keyboard.press('End');
  await expect(page.locator('.element-card[data-element="p"]')).toHaveAttribute('aria-checked','true');
  await transforms(page); await page.locator('#series-nitrogen').press('Tab'); await page.keyboard.press('End');
  await expect(page.locator('#reaction-detail')).toContainText(reactions.nitrogen[5][2]);
  expect(external).toEqual([]);expect(errors).toEqual([]);
});
