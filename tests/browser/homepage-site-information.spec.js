const {test, expect} = require('@playwright/test');

test('首页提供站点介绍、进度提示和可访问的反馈入口', async ({page}) => {
  await page.goto('/');
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /可操作的图示/);
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', 'favicon.ico');
  await expect(page.getByRole('main')).toBeVisible();
  const footer = page.getByRole('contentinfo');
  await expect(footer).toContainText('保存在当前设备的浏览器');
  await expect(footer).toContainText('请勿在反馈中填写个人敏感信息');
  const feedback = page.getByRole('link', {name: '查看或提交问题（GitHub）'});
  await expect(feedback).toHaveAttribute('href', 'https://github.com/houjibo/knowledge-visual/issues');
  await feedback.focus();
  await expect(feedback).toBeFocused();
  await expect(feedback).toHaveCSS('outline-style', 'solid');
  const bounds = await footer.boundingBox();
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(page.viewportSize().width);
});

test('脚本不可用时仍可阅读站点说明与反馈入口', async ({browser}) => {
  const context = await browser.newContext({javaScriptEnabled: false});
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4183/');
  await expect(page.getByRole('link', {name: '查看或提交问题（GitHub）'})).toBeVisible();
  await expect(page.getByRole('contentinfo')).toContainText('学习进度');
  await context.close();
});
