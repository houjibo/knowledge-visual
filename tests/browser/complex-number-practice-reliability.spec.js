const {test, expect} = require('@playwright/test');

const groups = [
  {
    mode: 'plane',
    questions: [
      {question: '复数 z = 3 + 4i 的模 |z| = ?', options: ['5', '7', '√7', '25'], answer: 0},
      {question: '复数 1 − i 在复平面上对应哪个点？', options: ['(1, 1)', '(1, −1)', '(−1, 1)', '(−1, −1)'], answer: 1},
      {question: 'i² 等于什么？', options: ['1', '−1', 'i', '−i'], answer: 1},
      {question: '复数 2+3i 的共轭复数是？', options: ['2−3i', '−2+3i', '−2−3i', '3+2i'], answer: 0},
    ],
  },
  {
    mode: 'ops',
    questions: [
      {question: '(1+2i) + (3−i) = ?', options: ['4+i', '4+3i', '−2+3i', '4−i'], answer: 0},
      {question: 'i × i = ?', options: ['1', '−1', '2i', '−2i'], answer: 1},
      {question: '(1+i)(1−i) = ?', options: ['0', '2', '2i', '1+i'], answer: 1},
    ],
  },
  {
    mode: 'rotate',
    questions: [
      {question: '复数 z 乘以 i 相当于？', options: ['顺时针旋转90°', '逆时针旋转90°', '旋转180°', '不变'], answer: 1},
      {question: '复数 z 乘以 −1 相当于？', options: ['旋转90°', '旋转180°', '旋转270°', '关于实轴对称'], answer: 1},
      {question: '复数 z 乘以 2 相当于？', options: ['旋转2倍', '放大2倍', '缩小一半', '取共轭'], answer: 1},
    ],
  },
];

test('十道复数练习答案准确、键盘可答且回看保留掌握状态', async ({page}) => {
  await page.goto('/math/high/complex-numbers.html');
  let mastered = 0;

  for (const group of groups) {
    await page.locator(`.tabs button.tab[data-mode="${group.mode}"]`).click();
    const question = page.locator(`#quiz-q-${group.mode}`);
    const options = page.locator(`#quiz-opts-${group.mode} button.quiz-opt`);
    const feedback = page.locator(`#quiz-fb-${group.mode}`);
    const previous = page.locator(`#quiz-prev-${group.mode}`);
    const next = page.locator(`#quiz-next-${group.mode}`);
    await expect(page.locator(`#panel-${group.mode}`)).toBeVisible();
    await expect(previous).toBeDisabled();
    await expect(page.getByRole('group')).toHaveAttribute('aria-labelledby', `quiz-q-${group.mode}`);
    await expect(feedback).toHaveAttribute('role', 'status');
    await expect(feedback).toHaveAttribute('aria-live', 'polite');

    for (const [index, item] of group.questions.entries()) {
      await expect(question).toContainText(item.question);
      await expect(options).toHaveText(item.options);

      if (group.mode === 'plane' && index === 0) {
        const wrong = options.nth((item.answer + 1) % item.options.length);
        await wrong.focus();
        await page.keyboard.press('Enter');
        await expect(feedback).toContainText(`正确答案是：${item.options[item.answer]}`);
        await expect(feedback).toContainText('已掌握 0/10');
        await expect(wrong).toHaveAttribute('aria-pressed', 'true');
        await expect(options.nth(item.answer)).toHaveClass(/correct/);
      }

      const correct = options.nth(item.answer);
      await correct.focus();
      await page.keyboard.press((mastered % 2) ? 'Space' : 'Enter');
      mastered++;
      await expect(correct).toHaveClass(/correct/);
      await expect(correct).toHaveAttribute('aria-pressed', 'true');
      await expect(options).toHaveCount(item.options.length);
      await expect(feedback).toContainText(`已掌握 ${mastered}/10`);

      if (index > 0) {
        await previous.click();
        await expect(options.nth(group.questions[index - 1].answer)).toBeDisabled();
        await expect(options.nth(group.questions[index - 1].answer)).toHaveAttribute('aria-pressed', 'true');
        await next.click();
        await expect(correct).toBeDisabled();
        await expect(feedback).toContainText(`已掌握 ${mastered}/10`);
      }

      if (index === group.questions.length - 1) await expect(next).toBeDisabled();
      else await next.click();
    }
  }

  await expect(page.locator('#quiz-fb-rotate')).toContainText('全部答对，已记录完成');
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('kv-math-progress-v2')));
  expect(saved['high:complex-numbers']).toBeTruthy();
});

test('全部答对但保存失败时如实提示，并在重试成功后更新反馈', async ({page}) => {
  await page.addInitScript(() => {
    window.blockQuizProgress = true;
    window.originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key, value) {
      if (window.blockQuizProgress && key === 'kv-math-progress-v2') throw new Error('storage unavailable');
      return window.originalSetItem.call(this, key, value);
    };
  });
  await page.goto('/math/high/complex-numbers.html');

  for (const group of groups) {
    await page.locator(`.tabs button.tab[data-mode="${group.mode}"]`).click();
    const options = page.locator(`#quiz-opts-${group.mode} button.quiz-opt`);
    for (const [index, item] of group.questions.entries()) {
      await options.nth(item.answer).click();
      if (index < group.questions.length - 1) await page.locator(`#quiz-next-${group.mode}`).click();
    }
  }

  const feedback = page.locator('#quiz-fb-rotate');
  const notice = page.locator('#math-progress-save-notice');
  await expect(feedback).toContainText('全部答对，但进度暂未保存');
  await expect(feedback).not.toContainText('已记录完成');
  await expect(notice).toContainText('暂未保存');
  await expect(notice.getByRole('button', {name: '重试保存'})).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('kv-math-progress-v2'))).toBeNull();

  await page.evaluate(() => { window.blockQuizProgress = false; });
  await notice.getByRole('button', {name: '重试保存'}).click();
  await expect(notice).toContainText('已保存');
  await expect(feedback).toContainText('全部答对，已记录完成');
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('kv-math-progress-v2')));
  expect(saved['high:complex-numbers']).toBeTruthy();
});
