const { test, expect } = require('@playwright/test');
const url = '/math/topics/solid-shapes/index.html';

test('固定随机值下分类可用键盘且每题只计一次', async ({ page }) => {
  await page.clock.install({time: new Date('2026-01-01T00:00:00Z')}); await page.clock.pauseAt(new Date('2026-01-01T00:00:00Z'));
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto(url, { timeout: 10000 });
  await page.locator('[data-mode="sort"]').click();
  const seen = [];
  for (let i = 0; i < 20; i++) {
    const name = await page.locator('#sort-name').innerText();
    seen.push(name);
    const answer = await page.evaluate(name => SORT_ITEMS.find(item => item.name === name).answer, name);
    const button = page.locator(`#sort-bins button[data-bin="${answer}"]`);
    await button.focus(); await page.keyboard.press('Enter'); await button.dispatchEvent('click');
    await expect(page.locator('#sort-correct')).toHaveText(String(i + 1));
    await page.clock.runFor(1600);
  }
  expect(new Set(seen).size).toBe(20);
  expect(await page.evaluate(() => PageProgress.isDone('solid-shapes'))).toBe(true);
});

test('五类题目的选项互异且参考答案正确', async ({ page }) => {
  await page.clock.install({time: new Date('2026-01-01T00:00:00Z')}); await page.clock.pauseAt(new Date('2026-01-01T00:00:00Z'));
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto(url);
  await page.locator('[data-mode="quiz"]').click();
  let prior = Number(await page.locator('#quiz-correct').innerText());
  await page.locator('#quiz-options button').first().click();
  for (let type = 0; type < 5; type++) {
    for (let shape = 0; shape < 4; shape++) {
      await page.evaluate(({type, shape}) => {
        const sequence = [(type + 0.1) / 5, (shape + 0.1) / 4, (shape % 2 + 0.1) / 2, (shape % 3 + 0.1) / 3];
        Math.random = () => sequence.length ? sequence.shift() : 0.3;
      }, {type, shape});
      await page.clock.runFor(1600);
      const question = await page.locator('#quiz-question').innerText();
      const buttons = page.locator('#quiz-options button');
      const options = (await buttons.allTextContents()).map(text => text.slice(1));
      expect(options).toHaveLength(4);
      expect(new Set(options).size).toBe(4);
      let answer;
      const shapes = ['正方体', '长方体', '圆柱', '球'];
      if (type === 0) answer = shapes[shape];
      else if (type === 1) {
        const label = question.match(/(平面|直棱|顶点)/)[1];
        answer = ({平面: 6, 直棱: 12, 顶点: 8})[label] + '个';
      } else if (type === 2) answer = ['🎲 骰子', '📱 手机', '🥫 罐头', '⚽ 足球'][shape];
      else if (type === 3) {
        const mapping = {'正方体和长方体': '都有6个平面、12条直棱、8个顶点', '球和圆柱': '球没有平面，圆柱有2个圆形平面', '正方体和球': '正方体的面是平面，球的表面是曲面', '圆柱和长方体': '圆柱有曲面，长方体的面都是平面'};
        answer = mapping[Object.keys(mapping).find(key => question.includes(key))];
      } else answer = ['6个面都是正方形', '相对的面完全相同', '有2个圆形平面和1个曲面', '表面是曲面，没有平面'][shape];
      const index = options.indexOf(answer);
      expect(index, question).toBeGreaterThanOrEqual(0);
      prior = Number(await page.locator('#quiz-correct').innerText());
      await buttons.nth(index).click();
      await expect(page.locator('#quiz-correct')).toHaveText(String(prior + 1));
      await expect(page.locator('#quiz-explain')).toContainText('答对');
    }
  }
});

test('形状详情可键盘查看，区分平面、曲面和圆形边界', async ({ page }) => {
  await page.goto(url);
  const cylinder = page.locator('#shape-gallery button').filter({ hasText: '圆柱' });
  await cylinder.focus(); await page.keyboard.press('Enter');
  await expect(page.locator('#shape-detail')).toContainText('2个圆形平面和1个曲面');
  await expect(page.locator('#shape-detail')).toContainText('圆形边界');
  const sphere = page.locator('#shape-gallery button').filter({ hasText: '球' });
  await sphere.focus(); await page.keyboard.press('Enter');
  await expect(page.locator('#shape-detail')).toContainText('1个曲面');
});

test('各形状和题型都只有一个选项计为正确', async ({ page }) => {
  await page.clock.install({time: new Date('2026-01-01T00:00:00Z')}); await page.clock.pauseAt(new Date('2026-01-01T00:00:00Z'));
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto(url);
  await page.locator('[data-mode="quiz"]').click();
  await page.locator('#quiz-options button').first().click();
  for (let type = 0; type < 5; type++) {
    for (let shape = 0; shape < 4; shape++) {
      let correctCount = 0, reference = null;
      for (let option = 0; option < 4; option++) {
        await page.evaluate(({type, shape}) => {
          const sequence = [(type + 0.1) / 5, (shape + 0.1) / 4, 0.1, 0.1];
          Math.random = () => sequence.length ? sequence.shift() : 0.3;
        }, {type, shape});
        await page.clock.runFor(1600);
        const question = await page.locator('#quiz-question').innerText();
        const options = await page.locator('#quiz-options button').allTextContents();
        const signature = JSON.stringify([question, options]);
        if (reference === null) reference = signature;
        else expect(signature).toBe(reference);
        const before = Number(await page.locator('#quiz-correct').innerText());
        await page.locator('#quiz-options button').nth(option).click();
        const after = Number(await page.locator('#quiz-correct').innerText());
        correctCount += after - before;
      }
      expect(correctCount, `题型 ${type}，图形 ${shape}`).toBe(1);
    }
  }
});
