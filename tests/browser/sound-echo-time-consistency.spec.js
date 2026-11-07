const {test,expect}=require('@playwright/test');
const url='/physics/middle/sound.html';

test('回声时间按距离和温度变化，分步位置与状态一致',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'}); await page.goto(url);
  const tab=page.getByRole('button',{name:'📏 声速测量'}); await tab.focus(); await page.keyboard.press('Enter');
  await expect(page.locator('#echoStatus')).toContainText('340.0 m/s'); await expect(page.locator('#echoStatus')).toContainText('1.00 秒');
  await page.getByRole('button',{name:'发出声波'}).click(); await expect(page.locator('#echoStatus')).toContainText('去程');
  await page.locator('#echoStep').click(); await expect(page.locator('#echoStatus')).toContainText('反射返回');
  let state=await page.evaluate(()=>echoStateAt(echoRun.elapsed,echoRun.distance,echoRun.speed)); expect(state.position).toBeCloseTo(1,8);
  await page.locator('#echoStep').click(); await expect(page.locator('#echoStatus')).toContainText('声波已返回');
  await expect(page.locator('#echoStep')).toBeDisabled();
  await page.getByLabel('🏔️ 障碍物距离').fill('500'); await page.getByLabel('🌡️ 气温').fill('-10');
  await expect(page.locator('#echoStatus')).toContainText('等待发出'); await expect(page.locator('#echoStatus')).toContainText('325.0 m/s');
  await expect(page.locator('#echoStatus')).toContainText('3.08 秒');
  await page.locator('#echoStart').click(); await page.locator('#echoReset').click(); await expect(page.locator('#echoStatus')).toContainText('等待发出');
});

test('自动回声按理想往返时间到达，可暂停与重播',async({page})=>{
  await page.emulateMedia({reducedMotion:'no-preference'}); await page.goto(url); await page.getByRole('button',{name:'📏 声速测量'}).click();
  await page.getByLabel('🏔️ 障碍物距离').fill('50'); await page.locator('#echoStart').click();
  await expect(page.locator('#echoStatus')).toContainText('声波已返回',{timeout:3000}); await expect(page.locator('#echoStatus')).toContainText('0.29 秒');
  await page.getByLabel('🏔️ 障碍物距离').fill('500'); await page.locator('#echoStart').click(); await page.locator('#echoPause').click();
  const elapsed=await page.evaluate(()=>echoRun.elapsed); await page.waitForTimeout(150); expect(await page.evaluate(()=>echoRun.elapsed)).toBe(elapsed);
  await page.locator('#echoPause').click(); await expect.poll(()=>page.evaluate(()=>echoRun.elapsed)).toBeGreaterThan(elapsed);
});
