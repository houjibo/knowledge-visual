const {test, expect} = require('@playwright/test');

const baseValue = process.env.KV_PUBLISHED_BASE_URL;
const expectedRevision = process.env.GITHUB_SHA;

test('公网发布版本、万有引力及计算机和人工智能交互可用', async ({page}) => {
  test.setTimeout(120_000);
  expect(baseValue, '发布验收需指定 KV_PUBLISHED_BASE_URL').toBeTruthy();
  expect(expectedRevision, '发布验收需指定 GITHUB_SHA').toMatch(/^[a-f0-9]{40}$/);

  const base = new URL(baseValue);
  const loopbackHttp = base.protocol === 'http:' && ['127.0.0.1', 'localhost', '[::1]'].includes(base.hostname);
  expect(loopbackHttp || base.protocol === 'https:').toBe(true);
  expect(base.username || base.password || base.search || base.hash).toBeFalsy();
  base.pathname = base.pathname.replace(/\/*$/, '/')

  const failures = [];
  page.on('pageerror', error => failures.push(`未捕获异常：${error.message}`));
  page.on('response', response => {
    if (response.url().startsWith(base.href) && response.status() >= 400)
      failures.push(`HTTP ${response.status()}: ${response.url()}`);
  });

  const manifestUrl = new URL('release-version.json', base);
  const manifestResponse = await page.request.get(manifestUrl.href, {
    headers: {'Cache-Control': 'no-cache'},
    timeout: 20000,
  });
  expect(manifestResponse.status()).toBe(200);
  expect(await manifestResponse.json()).toEqual({
    schema_version: 1,
    revision: expectedRevision,
    site_files_modified: false,
  });

  const topicUrl = new URL('physics/high/gravitation.html', base);
  topicUrl.searchParams.set('verify', expectedRevision);
  await page.goto(topicUrl.href, {waitUntil: 'domcontentloaded', timeout: 30000});
  await expect(page).toHaveTitle(/万有引力/);
  await expect(page.getByRole('tab')).toHaveCount(4);
  await expect(page.locator('#cvLaw')).toBeVisible();

  await page.getByRole('tab', {name: '卫星轨道'}).click();
  await page.locator('#orbitPresetMoon').click();
  await expect(page.locator('#sH')).toHaveValue('378029');
  await expect(page.locator('#orbitDistanceInfo')).toContainText('384,400 km');

  await page.getByRole('tab', {name: '宇宙速度'}).click();
  const velocity = page.locator('#sVel');
  await velocity.evaluate(input => {
    input.value = '7.70';
    input.dispatchEvent(new Event('input', {bubbles: true}));
  });
  await expect(page.locator('#velInfo')).toHaveAttribute('data-trajectory', 'impact');

  await page.goto(new URL('', base).href, {waitUntil: 'domcontentloaded'});
  await page.getByRole('combobox', {name: '学科', exact: true}).selectOption('computer');
  await page.getByRole('combobox', {name: '学段', exact: true}).selectOption('primary');
  await page.getByRole('searchbox', {name: '关键词'}).fill('算法');
  await page.locator('#site-results a[href="computer/primary/robot-algorithms.html"]').click();
  await page.waitForLoadState('domcontentloaded');
  await expect(page).toHaveURL(/computer\/primary\/robot-algorithms\.html/);
  await page.getByRole('button', {name: '运行指令'}).click();
  await expect(page.locator('#robot-status')).toContainText('抵达目标', {timeout: 5000});
  await page.goto(new URL('', base).href, {waitUntil: 'domcontentloaded'});
  await page.getByRole('combobox', {name: '学科', exact: true}).selectOption('computer');
  await page.getByRole('combobox', {name: '学段', exact: true}).selectOption('primary');
  await page.getByRole('searchbox', {name: '关键词'}).fill('顺序查找');
  await page.locator('#site-results a[href="computer/primary/sequential-search.html"]').click();
  await page.waitForLoadState('domcontentloaded');
  await expect(page).toHaveURL(/computer\/primary\/sequential-search\.html/);
  await page.locator('#prediction-select').selectOption('3');
  for (let step = 0; step < 3; step++) await page.locator('#step-button').click();
  await expect(page.locator('#next-label')).toContainText('第 3 张找到');
  await page.locator('#target-select').selectOption('9');
  await page.locator('#prediction-select').selectOption('5');
  for (let step = 0; step < 5; step++) await page.locator('#step-button').click();
  await expect(page.locator('#next-label')).toContainText('未找到');
  await expect(page.locator('#progress-status')).toContainText('已保存');
  await page.goto(new URL('', base).href, {waitUntil: 'domcontentloaded'});
  await page.getByRole('combobox', {name: '学科', exact: true}).selectOption('computer');
  await page.getByRole('combobox', {name: '学段', exact: true}).selectOption('primary');
  await page.getByRole('searchbox', {name: '关键词'}).fill('相邻交换');
  await page.locator('#site-results a[href="computer/primary/adjacent-swap-sort.html"]').click();
  await page.waitForLoadState('domcontentloaded');
  await expect(page).toHaveURL(/computer\/primary\/adjacent-swap-sort\.html/);
  await page.locator('#prediction-select').selectOption('3');
  for (let step = 0; step < 10; step++) await page.locator('#step-button').click();
  await expect(page.locator('#prediction-status')).toContainText('预测正确');
  await expect(page.locator('#comparison-count')).toHaveText('10');
  await page.locator('#preset-select').selectOption('sorted');
  await page.locator('#prediction-select').selectOption('0');
  for (let step = 0; step < 4; step++) await page.locator('#step-button').click();
  await expect(page.locator('#run-status')).toContainText('没有交换');
  await expect(page.locator('#progress-status')).toContainText('已保存');
  await page.goto(new URL('', base).href, {waitUntil: 'domcontentloaded'});
  await page.getByRole('combobox', {name: '学科', exact: true}).selectOption('computer');
  await page.getByRole('combobox', {name: '学段', exact: true}).selectOption('high');
  await page.getByRole('searchbox', {name: '关键词'}).fill('查找策略');
  await page.locator('#site-results a[href="computer/high/search-strategies.html"]').click();
  await page.waitForLoadState('domcontentloaded');
  await expect(page).toHaveURL(/computer\/high\/search-strategies\.html/);
  await page.locator('#prediction-select').selectOption('binary');
  for (let step = 0; step < 14; step++) await page.locator('#step-button').click();
  await expect(page.locator('#linear-count')).toHaveText('14');
  await expect(page.locator('#binary-count')).toHaveText('3');
  await expect(page.locator('#prediction-status')).toContainText('预测正确');
  await page.locator('#order-select').selectOption('shuffled');
  await expect(page.locator('#binary-next')).toContainText('不能直接使用');
  await page.goto(new URL('', base).href, {waitUntil: 'domcontentloaded'});
  await page.getByRole('combobox', {name: '学科', exact: true}).selectOption('ai');
  await page.getByRole('combobox', {name: '学段', exact: true}).selectOption('high');
  await page.getByRole('searchbox', {name: '关键词'}).fill('分类边界');
  await page.locator('#site-results a[href="ai/high/classifier-lab.html"]').click();
  await page.waitForLoadState('domcontentloaded');
  await expect(page).toHaveURL(/ai\/high\/classifier-lab\.html/);
  const threshold = page.locator('#threshold');
  await threshold.focus();
  for (let i = 0; i < 4; i++) await threshold.press('ArrowLeft');
  await page.getByRole('button', {name: '重新评估样本'}).click();
  await expect(page.locator('#accuracy-output')).toHaveText('87.5%');
  await page.goto(new URL('', base).href, {waitUntil: 'domcontentloaded'});
  await page.getByRole('combobox', {name: '学科', exact: true}).selectOption('ai');
  await page.getByRole('combobox', {name: '学段', exact: true}).selectOption('high');
  await page.getByRole('searchbox', {name: '关键词'}).fill('训练集');
  await page.locator('#site-results a[href="ai/high/train-test-generalization.html"]').click();
  await page.waitForLoadState('domcontentloaded');
  await expect(page).toHaveURL(/ai\/high\/train-test-generalization\.html/);
  await page.getByRole('button', {name: '查看留出测试结果'}).click();
  await expect(page.locator('#test-accuracy')).toHaveText('50%');
  await page.getByRole('slider', {name: /分类阈值/}).focus();
  await page.getByRole('slider', {name: /分类阈值/}).press('ArrowLeft');
  await expect(page.locator('#test-accuracy')).toHaveText('75%');
  await expect(page.locator('#test-warning')).toBeVisible();
  await page.goto(new URL('', base).href, {waitUntil: 'domcontentloaded'});
  await page.getByRole('combobox', {name: '学科', exact: true}).selectOption('ai');
  await page.getByRole('combobox', {name: '学段', exact: true}).selectOption('primary');
  await page.getByRole('searchbox', {name: '关键词'}).fill('线索分类');
  await page.locator('#site-results a[href="ai/primary/feature-classification-lab.html"]').click();
  await page.waitForLoadState('domcontentloaded');
  await expect(page).toHaveURL(/ai\/primary\/feature-classification-lab\.html/);
  await page.getByRole('button', {name: '查看真实标签'}).click();
  await expect(page.locator('#test-summary')).toContainText('预测正确 2/4');
  await page.locator('#feature-color').focus();
  await page.locator('#feature-color').press('ArrowRight');
  await expect(page.locator('#test-summary')).toContainText('预测正确 4/4');
  await expect(page.locator('#seen-warning')).toBeVisible();

  const verificationUrl = new URL('ai/middle/output-verification.html', base);
  verificationUrl.searchParams.set('verify', expectedRevision);
  await page.goto(verificationUrl.href, {waitUntil: 'domcontentloaded'});
  await expect(page).toHaveTitle('回答核验实验室 · 初中人工智能');
  for (const [claim, value] of Object.entries({
    size: 'supports', distance: 'contradicts', moons: 'supports', life: 'insufficient',
  })) {
    await page.locator(`input[name="claim-${claim}"][value="${value}"]`).check();
  }
  await page.getByRole('button', {name: '核对我的判断'}).click();
  await expect(page.locator('#result-status')).toContainText('四条陈述都核验正确');

  await page.goto(new URL('', base).href, {waitUntil: 'domcontentloaded'});
  await page.getByRole('combobox', {name: '学科', exact: true}).selectOption('ai');
  await page.getByRole('combobox', {name: '学段', exact: true}).selectOption('middle');
  await page.getByRole('searchbox', {name: '关键词'}).fill('个人信息');
  await page.locator('#site-results a[href="ai/middle/data-minimization.html"]').click();
  await page.waitForLoadState('domcontentloaded');
  await expect(page).toHaveURL(/ai\/middle\/data-minimization\.html/);
  await expect(page).toHaveTitle('信息最小化实验室 · 初中人工智能');
  const dataFields = page.locator('#extra-fields input[type="checkbox"]');
  for (const input of await dataFields.all()) await input.uncheck();
  await expect(page.locator('#field-count')).toHaveText('当前计划收集 2 项：2 项用于推荐，0 项不会改变推荐结果。');
  await expect(page.locator('#recommendation-output')).toHaveText('11–13 岁 · 图文探索读物《太阳系观察手册》');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('kv-ai-middle-progress'))['data-minimization']))
    .toBe(true);
  await page.goto(new URL('', base).href, {waitUntil: 'domcontentloaded'});
  await expect(page.locator('[data-subject-category="simulation-world"] .subject-badge')).toHaveText('8 个模拟');
  await page.getByRole('combobox', {name: '学科', exact: true}).selectOption('simulation-world');
  await page.getByRole('searchbox', {name: '关键词'}).fill('机械臂');
  await page.locator('#site-results a[href="simulation-world/robot-arm.html"]').click();
  await page.waitForLoadState('domcontentloaded');
  await expect(page).toHaveTitle('二维机械臂模拟 · 模拟世界');
  await page.locator('#prediction-select').selectOption('reachable');
  await page.locator('#check-prediction').click();
  await page.locator('#show-pose').click();
  expect(Number(await page.locator('#tip-distance').textContent())).toBeLessThan(1);
  await page.locator('#flip-pose').click();
  await expect(page.locator('#action-status')).toContainText('肘向二');
  await page.goto(new URL('', base).href, {waitUntil: 'domcontentloaded'});
  await page.getByRole('combobox', {name: '学科', exact: true}).selectOption('simulation-world');
  await page.getByRole('searchbox', {name: '关键词'}).fill('分拣');
  await page.locator('#site-results a[href="simulation-world/warehouse-sort.html"]').click();
  await page.waitForLoadState('domcontentloaded');
  await expect(page).toHaveTitle('仓储分拣模拟 · 模拟世界');
  await page.locator('#preset-b').click();
  await page.locator('#prediction-select').selectOption('B');
  for (let second = 0; second <= 5; second++) await page.locator('#step-button').click();
  await expect(page.locator('#first-queue')).toHaveText('B 口');
  await expect(page.locator('#prediction-status')).toContainText('预测正确');
  await page.goto(new URL('', base).href, {waitUntil: 'domcontentloaded'});
  await page.getByRole('combobox', {name: '学科', exact: true}).selectOption('simulation-world');
  await page.getByRole('searchbox', {name: '关键词'}).fill('皮带');
  await page.locator('#site-results a[href="simulation-world/belt-pulley.html"]').click();
  await page.waitForLoadState('domcontentloaded');
  await expect(page).toHaveTitle('皮带与带轮模拟 · 模拟世界');
  await page.locator('#preset-crossed').click();
  await page.locator('#speed-prediction').selectOption('faster');
  await page.locator('#direction-prediction').selectOption('opposite');
  await page.locator('#reveal-button').click();
  await expect(page.locator('#ideal-output')).toHaveText('120.0 rpm');
  await page.locator('#step-button').click();
  await expect(page.locator('#driven-rotor')).toHaveAttribute('transform', /rotate\(-180\.0\)/);
  await page.goto(new URL('', base).href, {waitUntil: 'domcontentloaded'});
  await page.getByRole('combobox', {name: '学科', exact: true}).selectOption('simulation-world');
  await page.getByRole('searchbox', {name: '关键词'}).fill('凸轮');
  await page.locator('#site-results a[href="simulation-world/cam-factory.html"]').click();
  await page.waitForLoadState('domcontentloaded');
  await expect(page).toHaveTitle('凸轮送料与工厂节拍模拟 · 模拟世界');
  await page.locator('#window-prediction').selectOption('enough');
  await page.locator('#reveal-button').click();
  await expect(page.locator('#dwell-seconds')).toHaveText('0.50 s');
  await page.locator('#cycle-button').click();
  await expect(page.locator('#batch-copy')).toContainText('1 / 6 完成');
  await page.locator('#preset-fast').click();
  await page.locator('#window-prediction').selectOption('short');
  await page.locator('#reveal-button').click();
  await expect(page.locator('#window-result')).toHaveText('窗口不足');
  await page.goto(new URL('', base).href, {waitUntil: 'domcontentloaded'});
  await page.getByRole('combobox', {name: '学科', exact: true}).selectOption('computer');
  await page.getByRole('combobox', {name: '学段', exact: true}).selectOption('uni');
  await page.getByRole('searchbox', {name: '关键词'}).fill('栈与队列');
  await page.locator('#site-results a[href="computer/uni/stack-queue.html"]').click();
  await page.waitForLoadState('domcontentloaded');
  await expect(page).toHaveTitle('栈与队列对照实验室 · 大学计算机');
  for (let i = 0; i < 3; i++) await page.locator('#add-button').click();
  await page.locator('#stack-prediction').selectOption('C');
  await page.locator('#queue-prediction').selectOption('A');
  await page.locator('#remove-button').click();
  await expect(page.locator('#action-status')).toContainText('栈取出 C');
  await expect(page.locator('#action-status')).toContainText('队列取出 A');
  expect(failures).toEqual([]);
});

test('公网质量与密度的参考比较和键盘练习可用', async ({page}) => {
  expect(baseValue, '发布验收需指定 KV_PUBLISHED_BASE_URL').toBeTruthy();
  expect(expectedRevision, '发布验收需指定 GITHUB_SHA').toMatch(/^[a-f0-9]{40}$/);
  const url = new URL('physics/middle/mass-density.html', baseValue);
  url.searchParams.set('verify', expectedRevision);
  const failures = [];
  page.on('pageerror', error => failures.push(error.message));
  page.on('response', response => {
    if (response.url().startsWith(new URL(baseValue).href) && response.status() >= 400)
      failures.push(`${response.status()} ${response.url()}`);
  });
  await page.goto(url.href, {waitUntil: 'domcontentloaded', timeout: 30000});
  await expect(page).toHaveTitle('质量与密度 · 初中物理互动可视化');
  await page.getByRole('button', {name: /密度计算/}).focus();
  await page.keyboard.press('Enter');
  await page.locator('#densityMass').evaluate(input => {
    input.value = '50'; input.dispatchEvent(new Event('input', {bubbles: true}));
  });
  await page.locator('#densityVol').evaluate(input => {
    input.value = '20'; input.dispatchEvent(new Event('input', {bubbles: true}));
  });
  await page.locator('#referenceMaterial').selectOption('glass');
  await expect(page.locator('#materialComparison')).toContainText('低 0.10 g/cm³');
  await page.getByRole('button', {name: /^B\. 铝/}).focus();
  await page.keyboard.press('Space');
  await expect(page.locator('#completionStatus')).toContainText('称量未知物并正确读数（待完成）');
  await page.getByRole('button', {name: /天平使用/}).click();
  await page.locator('#riderSlider').evaluate(input => {
    input.value = '0'; input.dispatchEvent(new Event('input', {bubbles: true}));
  });
  await page.getByRole('button', {name: '调平空载天平'}).click();
  await page.getByRole('button', {name: '将未知物放左盘'}).click();
  await page.getByRole('button', {name: /^\+20 g/}).click();
  await page.getByRole('button', {name: /^\+5 g/}).click();
  await page.locator('#riderSlider').evaluate(input => {
    input.value = '4'; input.dispatchEvent(new Event('input', {bubbles: true}));
  });
  await page.getByRole('spinbutton', {name: '平衡后读数 (g)'}).fill('25.4');
  await page.getByRole('button', {name: '核对读数'}).click();
  await expect(page.locator('#completionStatus')).toContainText('完成记录已保存在本机');
  expect(failures).toEqual([]);
});

test('公网高中人工智能阈值比较和完成记录可用', async ({page}) => {
  expect(baseValue, '发布验收需指定 KV_PUBLISHED_BASE_URL').toBeTruthy();
  expect(expectedRevision, '发布验收需指定 GITHUB_SHA').toMatch(/^[a-f0-9]{40}$/);
  const url = new URL('ai/high/threshold-errors.html', baseValue);
  url.searchParams.set('verify', expectedRevision);
  const failures = [];
  page.on('pageerror', error => failures.push(error.message));
  page.on('response', response => {
    if (response.url().startsWith(new URL(baseValue).href) && response.status() >= 400)
      failures.push(`${response.status()} ${response.url()}`);
  });

  await page.goto(url.href, {waitUntil: 'domcontentloaded', timeout: 30000});
  await expect(page).toHaveTitle('分类阈值与误报漏报实验室 · 高中人工智能');
  await page.locator('#fp-prediction').selectOption('up');
  await page.locator('#fn-prediction').selectOption('down');
  await page.locator('#reveal-button').click();
  for (const [id, value] of Object.entries({
    'tp-count': '3', 'fp-count': '1', 'fn-count': '3', 'tn-count': '5',
    'precision-value': '75%', 'recall-value': '50%',
  })) await expect(page.locator(`#${id}`)).toHaveText(value);

  await page.locator('#preset-low').click();
  for (const [id, value] of Object.entries({
    'tp-count': '5', 'fp-count': '4', 'fn-count': '1', 'tn-count': '2',
    'precision-value': '55.6%', 'recall-value': '83.3%',
  })) await expect(page.locator(`#${id}`)).toHaveText(value);
  await page.locator('#low-miss-choice').selectOption('4');
  await page.locator('#low-alarm-choice').selectOption('9');
  await page.locator('#check-choices').click();
  await expect(page.locator('#progress-status')).toContainText('本机已记录完成分类阈值主题');
  expect(failures).toEqual([]);
});
