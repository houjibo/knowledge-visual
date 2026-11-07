const {test, expect} = require('@playwright/test');
const inventory = require('../../docs/assessments/page-inventory.json');

for (const entry of inventory.pages) {
  test(`加载 ${entry.path}`, async ({page}) => {
    const failures = [];
    page.on('pageerror', error => failures.push(`未捕获异常: ${error.message}`));
    page.on('response', response => {
      const url = new URL(response.url());
      if (url.origin === 'http://127.0.0.1:4183' && response.status() >= 400) {
        failures.push(`HTTP ${response.status()}: ${url.pathname}`);
      }
    });
    const response = await page.goto('/' + entry.path, {waitUntil: 'load'});
    expect(response.status(), '页面 HTTP 状态').toBe(200);
    await expect(page).toHaveTitle(/\S/);
    // Capture near-immediate asynchronous initialisation errors, not later interactions.
    await page.waitForTimeout(200);
    expect(failures, `加载 ${entry.path} 时的错误`).toEqual([]);
  });
}
