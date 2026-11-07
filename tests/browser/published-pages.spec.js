const {test, expect} = require('@playwright/test');
const {startReleaseServer} = require('./release-server');
const inventory = require('../../docs/assessments/page-inventory.json');

let release;
test.beforeAll(async () => { release = await startReleaseServer(); });
test.afterAll(async () => { if (release) await release.close(); });

for (const {path} of inventory.pages) {
  test(`发布包加载 ${path}`, async ({page}) => {
    const failures = [];
    page.on('pageerror', error => failures.push(`未捕获异常: ${error.message}`));
    page.on('response', response => {
      const url = new URL(response.url());
      if (url.origin === release.origin && url.pathname !== '/favicon.ico' && response.status() >= 400)
        failures.push(`HTTP ${response.status()}: ${url.pathname}`);
    });
    page.on('requestfailed', request => {
      const url = new URL(request.url());
      if (url.origin === release.origin && url.pathname !== '/favicon.ico')
        failures.push(`请求失败: ${url.pathname} ${request.failure()?.errorText}`);
    });
    const response = await page.goto(new URL(path, release.base).href, {waitUntil: 'load'});
    expect(response.status(), '页面 HTTP 状态').toBe(200);
    await expect(page).toHaveTitle(/\S/);
    await page.waitForTimeout(200);
    expect(failures, `发布包中的 ${path}`).toEqual([]);
  });
}
