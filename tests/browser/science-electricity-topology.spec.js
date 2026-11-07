const { test, expect } = require('@playwright/test');
const url = '/science/electricity.html';

async function wires(page, mode) {
  return page.evaluate(mode => {
    const original = drawWire, paths = [];
    drawWire = (ctx, path, active) => { paths.push(path.map(p => [p.x, p.y])); original(ctx, path, active); };
    try { mode === 'simple' ? animateSimple() : animateSeries(); return paths; }
    finally { drawWire = original; }
  }, mode);
}
function connected(paths, components, start, end) {
  const adjacency = new Map();
  const add = (a, b) => {
    a = a.join(','); b = b.join(',');
    if (!adjacency.has(a)) adjacency.set(a, []);
    if (!adjacency.has(b)) adjacency.set(b, []);
    adjacency.get(a).push(b); adjacency.get(b).push(a);
  };
  for (const path of paths) for (let i = 1; i < path.length; i++) add(path[i - 1], path[i]);
  for (const [a, b] of components) add(a, b);
  const queue = [start.join(',')], visited = new Set(queue), target = end.join(',');
  while (queue.length) {
    const current = queue.shift(); if (current === target) return true;
    for (const next of adjacency.get(current) || []) if (!visited.has(next)) { visited.add(next); queue.push(next); }
  }
  return false;
}

test('开关、串联与并联导线不绕过灯泡或电池', async ({ page }) => {
  await page.goto(url);
  await page.getByRole('button', { name: '暂停动画' }).click();
  const positive = [130,268], negative = [130,332];
  const sw = [[222,120],[278,120]], single = [[456,120],[484,120]];
  let paths = await wires(page, 'simple');
  expect(connected(paths, [], positive, negative)).toBe(false);
  expect(connected(paths, [single], positive, negative)).toBe(false);
  expect(connected(paths, [sw], positive, negative)).toBe(false);
  expect(connected(paths, [sw, single], positive, negative)).toBe(true);
  await page.getByRole('button', { name: '闭合开关' }).click();
  await expect(page.locator('#toggleSwitch')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#simpleCanvas')).toHaveAttribute('aria-label', /闭合.*点亮/);
  await page.getByRole('button', { name: '🔗 串联与并联' }).focus(); await page.keyboard.press('Enter');
  const a = [[276,120],[304,120]], b = [[416,120],[444,120]];
  paths = await wires(page, 'series');
  expect(connected(paths, [], positive, negative)).toBe(false);
  expect(connected(paths, [a], positive, negative)).toBe(false);
  expect(connected(paths, [b], positive, negative)).toBe(false);
  expect(connected(paths, [a,b], positive, negative)).toBe(true);
  await page.getByRole('button', { name: '并联电路' }).click();
  await expect(page.locator('#btnParallel')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#seriesCanvas')).toHaveAttribute('aria-label', /并联.*两条支路/);
  const upper = [[346,150],[374,150]], lower = [[346,270],[374,270]];
  paths = await wires(page, 'series');
  expect(connected(paths, [], positive, negative)).toBe(false);
  expect(connected(paths, [upper], positive, negative)).toBe(true);
  expect(connected(paths, [lower], positive, negative)).toBe(true);
  const nodes = await page.evaluate(() => ['upper','lower'].map(branch => {
    const count = branch === 'upper' ? 10 : 12;
    return Array.from({length: count}, (_, i) => seriesMotionPoint(i / (count - 1), branch));
  }));
  expect(nodes[0]).toContainEqual({x:360,y:150});
  expect(nodes[1]).toContainEqual({x:360,y:270});
  await expect(page.locator('#mode-series')).toContainText('电源电压恒定');
});

test('暂停后控制仍更新，测验可用键盘并保存完成', async ({ page }) => {
  await page.addInitScript(() => {
    const raf = window.requestAnimationFrame, cancel = window.cancelAnimationFrame, pending = new Set();
    window.__pendingFrames = pending;
    window.requestAnimationFrame = cb => { const id = raf.call(window, t => { pending.delete(id); cb(t); }); pending.add(id); return id; };
    window.cancelAnimationFrame = id => { pending.delete(id); return cancel.call(window, id); };
  });
  await page.goto(url);
  await page.getByRole('button', {name: '暂停动画'}).click();
  expect(await page.evaluate(() => window.__pendingFrames.size)).toBe(0);
  await page.getByRole('button', {name: '闭合开关'}).click();
  expect(await page.evaluate(() => simpleState.bulbGlow)).toBe(1);
  await page.getByRole('button', {name: '🔗 串联与并联'}).click();
  await page.getByRole('button', {name: '并联电路'}).click();
  expect(await page.evaluate(() => window.__pendingFrames.size)).toBe(0);
  await page.getByRole('button', {name: '🏆 闯关挑战'}).click();
  for (const answer of [0, 2, 2, 1, 1]) {
    const option = page.locator('#quizOpts button').nth(answer);
    await option.focus(); await page.keyboard.press('Enter');
    await page.locator('#quizNext').click();
  }
  await expect(page.locator('#finalScore')).toHaveText('100');
  await expect(page.locator('#done-mark')).toBeVisible();
  await page.reload();
  await expect(page.locator('#done-mark')).toBeVisible();
});
