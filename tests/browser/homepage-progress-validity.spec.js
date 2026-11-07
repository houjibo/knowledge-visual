const {test, expect} = require('@playwright/test');

test('首页只计入当前学段中有效且完成的记录', async ({page}) => {
  await page.addInitScript(() => {
    localStorage.setItem('kv-math-progress', JSON.stringify({'linear-equation': 100, derivative: 101, ghost: 102}));
    localStorage.setItem('kv-math-progress-v2', JSON.stringify({'middle:linear-equation': null, 'high:derivative': 101, 'uni:derivative': 102, 'uni:ghost': 1}));
    localStorage.setItem('kv-physics-middle-progress', JSON.stringify({motion: 100, force: false, ghost: 101}));
    localStorage.setItem('kv-physics-high-progress', JSON.stringify({optics: 101, buoyancy: 102}));
    localStorage.setItem('kv-chemistry-high-progress', JSON.stringify({'mole-concept': 100, 'reaction-energy': 0, ghost: 2}));
    localStorage.setItem('kv-science-progress', JSON.stringify({'sink-float': 100, sound: null, ghost: 1}));
  });
  await page.goto('/');
  await expect(page.locator('[data-subject="math"] .sp-label')).toContainText('已学 2/198');
  await expect(page.locator('[data-subject="math"] .sp-label')).toContainText('学段不明旧记录');
  await expect(page.locator('[data-subject="physics"] .sp-label')).toHaveText('已学 2/55');
  await expect(page.locator('[data-subject="chemistry"] .sp-label')).toHaveText('已学 1/46');
  await expect(page.locator('[data-subject="science"] .sp-label')).toHaveText('已学 1/17');
});

test('存储损坏或目录不可用时不假称尚未开始', async ({page}) => {
  await page.addInitScript(() => localStorage.setItem('kv-science-progress', '{broken'));
  await page.goto('/');
  await expect(page.locator('[data-subject="science"] .sp-label')).toHaveText('进度暂不可用');
  await expect(page.locator('[data-subject="math"] .sp-label')).toHaveText('尚未开始');
  expect(await page.evaluate(() => localStorage.getItem('kv-science-progress'))).toBe('{broken');
  await page.route('**/assets/topic-catalog.js', route => route.abort());
  await page.reload();
  await expect(page.locator('[data-subject="math"] .sp-label')).toHaveText('进度暂不可用');
  await expect(page.locator('[data-subject="physics"] .sp-label')).toHaveText('进度暂不可用');
  await expect(page.getByRole('link', {name: /物理 初中/})).toBeVisible();
});

test('拒绝读取存储时如实提示进度不可用', async ({page}) => {
  await page.addInitScript(() => { Storage.prototype.getItem = () => { throw new Error('denied'); }; });
  await page.goto('/');
  await expect(page.locator('[data-subject="math"] .sp-label')).toHaveText('进度暂不可用');
  await expect(page.locator('[data-subject="science"] .sp-label')).toHaveText('进度暂不可用');
});

test('目录不完整时不误报零进度', async ({page}) => {
  await page.route('**/assets/topic-catalog.js', route => route.fulfill({contentType: 'application/javascript', body: 'window.KV_TOPIC_CATALOG = [];'}));
  await page.goto('/');
  await expect(page.locator('[data-subject="math"] .sp-label')).toHaveText('进度暂不可用');
  await expect(page.locator('[data-subject="science"] .sp-label')).toHaveText('进度暂不可用');
});
