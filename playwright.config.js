const {defineConfig} = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/browser',
  fullyParallel: true,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4183',
    browserName: 'chromium',
    launchOptions: process.env.KV_CHROMIUM_PATH ? {executablePath: process.env.KV_CHROMIUM_PATH} : {},
  },
  projects: [
    {name: 'desktop', use: {viewport: {width: 1280, height: 720}}},
    {name: 'mobile', use: {viewport: {width: 390, height: 844}, isMobile: true, hasTouch: true}},
  ],
  webServer: {
    command: 'python3 -m http.server 4183 --bind 127.0.0.1',
    url: 'http://127.0.0.1:4183/',
    reuseExistingServer: false,
    timeout: 10000,
  },
});
