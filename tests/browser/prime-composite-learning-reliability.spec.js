const {test, expect} = require('@playwright/test');
const url = '/math/topics/prime-composite/';
async function finish(page) {
  await page.locator('[data-mode="judge"].mode-tab').click();
  await page.locator('#btn-prime').click();
  await expect(page.locator('#judge-feedback')).toContainText('正确');
  await expect(page.locator('#btn-next-judge')).toBeVisible();
  await page.locator('[data-mode="sieve"].mode-tab').click();
  const primes = await page.evaluate(() => [...sieveState.primes]);
  for (const n of primes) {
    const button = page.locator(`#sieve-grid button[data-num="${n}"]`);
    await button.focus(); await page.keyboard.press('Space');
    await expect(button).toHaveAttribute('aria-pressed','true');
  }
  await page.locator('#btn-check-sieve').click();
  await expect(page.locator('#sieve-feedback')).toContainText('完美');
  await page.locator('[data-mode="factor"].mode-tab').click();
  const factors = await page.evaluate(() => factorState.correctFactors);
  for (const n of factors) {
    const button = page.locator(`#factor-options button[data-num="${n}"]`);
    await button.focus(); await page.keyboard.press('Enter');
    await expect(button).toHaveAttribute('aria-pressed','true');
  }
  await page.locator('#btn-check-factor').click();
  await expect(page.locator('#factor-feedback')).toContainText('完美');
}

test('因数范围及判断逻辑完整，重复随机可加载', async ({page}) => {
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto(url, {timeout:10000});
  const failures = await page.evaluate(() => {
    const issues = [];
    const expectedPrimes = new Set([2,3,5,7,11,13,17,19,23,29,31,37,41,43,47]);
    for (let n=1; n<=50; n++) if (isPrime(n) !== expectedPrimes.has(n)) issues.push(`prime ${n}`);
    for (let n=6; n<=36; n++) {
      Math.random = () => (n-6+.1)/31;
      newFactorQuestion();
      const opts = [...document.querySelectorAll('#factor-options button')].map(x => +x.textContent);
      const factors = Array.from({length:n}, (_, i) => i+1).filter(i => n%i===0);
      if (opts.length !== Math.min(12,n) || new Set(opts).size !== opts.length || factors.some(f => !opts.includes(f))) issues.push(`factors ${n}`);
    }
    return issues;
  });
  expect(failures).toEqual([]);
  await expect(page.getByText('大于2的偶数都是合数，因为它们都有因数2。')).toBeVisible();
});

test('三种练习完成后刷新及知识地图保持记录', async ({page}) => {
  await page.addInitScript(() => { Math.random = () => 0; });
  await page.goto(url);
  await expect(page.locator('#learningProgress')).toContainText('0/3');
  await finish(page);
  await expect(page.locator('#learningProgress')).toHaveText('✓ 本主题已完成');
  await page.reload();
  await expect(page.locator('#learningProgress')).toHaveText('✓ 本主题已完成');
  await page.goto('/math/index.html');
  await expect(page.locator('a.topic-card[href="topics/prime-composite/index.html"] .progress-badge')).toHaveText('✓');
});

test('答错后可主动换题，保存失败可重试', async ({page}) => {
  await page.addInitScript(() => { Math.random = () => 0; window.oldSet = Storage.prototype.setItem; Storage.prototype.setItem = () => { throw Error('denied'); }; });
  await page.goto(url);
  await page.locator('[data-mode="judge"].mode-tab').click();
  await page.locator('#btn-composite').click();
  await expect(page.locator('#judge-feedback')).toContainText('错误');
  await page.waitForTimeout(1700);
  await expect(page.locator('#judge-feedback')).toContainText('错误');
  await page.locator('#btn-next-judge').click();
  await finish(page);
  await expect(page.locator('#learningProgress')).toContainText('尚未保存');
  await page.evaluate(() => { Storage.prototype.setItem = window.oldSet; });
  await page.locator('#math-progress-save-notice button').click();
  await expect(page.locator('#learningProgress')).toHaveText('✓ 本主题已完成');
  await page.reload();
  await expect(page.locator('#learningProgress')).toHaveText('✓ 本主题已完成');
});
