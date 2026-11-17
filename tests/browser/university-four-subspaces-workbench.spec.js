const {test, expect} = require('@playwright/test');
const {resolve} = require('node:path');
const {pathToFileURL} = require('node:url');
const {startReleaseServer} = require('./release-server');
const topic = process.env.KV_PUBLISHED_BASE_URL
  ? new URL('math/uni/four-subspaces.html', process.env.KV_PUBLISHED_BASE_URL.replace(/\/?$/, '/')).href
  : '/math/uni/four-subspaces.html';

async function choose(page, group, indices) {
  for (const index of indices) await page.locator(`input[data-group="${group}"][value="${index}"]`).check();
}

async function predict(page, rank, nullDimension, leftDimension) {
  await page.locator('#rankGuess').selectOption(String(rank));
  await page.locator('#nullGuess').selectOption(String(nullDimension));
  await page.locator('#leftGuess').selectOption(String(leftDimension));
}

test('先预测再构造四个基，揭示不记完成，精确验证候选向量', async ({page}) => {
  const errors=[]; page.on('pageerror', error => errors.push(error.message));
  await page.goto(topic);
  await page.locator('#revealAnswer').click();
  await expect(page.locator('#answer')).toBeVisible();
  expect(await page.evaluate(() => PageProgress.isDone('four-subspaces'))).toBe(false);
  await expect(page.locator('#verificationInfo')).toContainText('1+2=3，1+1=2');
  await page.locator('#cell-0-0').fill('1');
  await expect(page.locator('#answer')).toBeHidden();
  await predict(page,1,1,1);
  await choose(page,'column',[0]); await choose(page,'row',[0]);
  await choose(page,'null',[1,2]); await choose(page,'left',[1]);
  await page.locator('#checkConstruction').click();
  await expect(page.locator('#constructionFeedback')).toContainText('再核 N(A) 维数');
  await expect(page.locator('#answer')).toBeHidden();
  await page.locator('#nullGuess').selectOption('2');
  await page.locator('#checkConstruction').click();
  await expect(page.locator('#constructionFeedback')).toContainText('四个基已构造');
  await expect(page.locator('#answer')).toBeVisible();
  expect(await page.evaluate(() => PageProgress.isDone('four-subspaces'))).toBe(true);
  await expect(page.locator('#answerGrid')).toContainText('[-2, 1, 0]');
  await expect(page.locator('#verificationInfo')).toContainText('行空间 ⟂ 零空间：成立');
  await expect(page.locator('#verificationInfo')).toContainText('列空间 ⟂ 左零空间：成立');
  await page.locator('#checkNullCandidate').click();
  await expect(page.locator('#nullCandidateResult')).toContainText('Ax = [0, 0]');
  await page.locator('#nullCandidate input').first().fill('0');
  await page.locator('#nullCandidate input').nth(1).fill('0');
  await page.locator('#nullCandidate input').nth(2).fill('0');
  await page.locator('#checkNullCandidate').click();
  await expect(page.locator('#nullCandidateResult')).toContainText('零向量不能作为基向量');
  await page.locator('#nullCandidate input').first().fill('1');
  await page.locator('#checkNullCandidate').click();
  await expect(page.locator('#nullCandidateResult')).toContainText('不属于该零空间');
  await page.locator('#leftCandidate input').first().fill('-2');
  await page.locator('#leftCandidate input').nth(1).fill('1');
  await page.locator('#checkLeftCandidate').click();
  await expect(page.locator('#leftCandidateResult')).toContainText('Aᵀy = [0, 0, 0]');
  expect(errors).toEqual([]);
});

test('矩形、零与满秩预设维数正确，替代原列原行基也被接受', async ({page}) => {
  await page.goto(topic);
  await page.locator('#preset').selectOption('wide');
  await predict(page,2,1,0);
  await choose(page,'column',[1,2]);
  await choose(page,'row',[0,1]);
  await choose(page,'null',[1]);
  await page.locator('#checkConstruction').click();
  await expect(page.locator('#answer')).toBeVisible();
  await expect(page.locator('#answerGrid')).toContainText('你选的原列');
  await expect(page.locator('#verificationInfo')).toContainText('2+1=3，2+0=2');

  await page.locator('#preset').selectOption('tall');
  await page.locator('#revealAnswer').click();
  await expect(page.locator('#verificationInfo')).toContainText('2+0=2，2+1=3');
  await expect(page.locator('#answerGrid')).toContainText('[-1, -1, 1]');
  await page.locator('#preset').selectOption('zero');
  await page.locator('#revealAnswer').click();
  await expect(page.locator('#verificationInfo')).toContainText('0+2=2，0+3=3');
  await expect(page.locator('#answerGrid')).toContainText('∅（只有零向量）');
  await page.locator('#preset').selectOption('identity');
  await page.locator('#revealAnswer').click();
  await expect(page.locator('#verificationInfo')).toContainText('3+0=3，3+0=3');
  await expect(page.locator('#spaceMap')).toContainText('维数 3');
});

test('自编矩阵保留精确分数，错误输入撤销旧答案并可恢复', async ({page}) => {
  await page.goto(topic);
  for (const [id,value] of Object.entries({'cell-0-0':2,'cell-0-1':1,'cell-0-2':0,'cell-1-0':4,'cell-1-1':2,'cell-1-2':0}))
    await page.locator('#'+id).fill(String(value));
  await page.locator('#revealAnswer').click();
  await expect(page.locator('#answerGrid')).toContainText('[-1/2, 1, 0]');
  await page.locator('#checkNullCandidate').click();
  await expect(page.locator('#nullCandidateResult')).toContainText('Ax = [0, 0]');
  await page.locator('#nullCandidate input').first().fill('1/0');
  await page.locator('#checkNullCandidate').click();
  await expect(page.locator('#nullCandidateResult')).toContainText('输入无效');
  await page.locator('#cell-0-1').fill('');
  await expect(page.locator('#cell-0-1')).toHaveAttribute('aria-invalid','true');
  await expect(page.locator('#answer')).toBeHidden();
  await expect(page.locator('#matrixStatus')).toContainText('矩阵输入无效');
  await page.locator('#revealAnswer').click();
  await expect(page.locator('#answer')).toBeHidden();
  await page.locator('#cell-0-1').fill('6');
  await expect(page.locator('#matrixStatus')).toContainText('矩阵输入无效');
  await page.locator('#cell-0-1').fill('1');
  await page.locator('#revealAnswer').click();
  await expect(page.locator('#answerGrid')).toContainText('[-1/2, 1, 0]');
  await page.locator('#rowCount').selectOption('3');
  await expect(page.locator('#answer')).toBeHidden();
  await expect(page.locator('#spaceMap')).toContainText('输出空间 R3');
});

test('大学目录、320px、键盘、文件直开与发布子路径可学习', async ({page}) => {
  test.skip(!!process.env.KV_PUBLISHED_BASE_URL,'本地文件与构建路径检查');
  await page.setViewportSize({width:320,height:700});
  await page.goto(pathToFileURL(resolve('math/uni/index.html')).href);
  await page.getByRole('link',{name:/四个基本子空间/}).click();
  await expect(page).toHaveURL(/four-subspaces\.html$/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await page.locator('#revealAnswer').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#answer')).toBeVisible();
  const release=await startReleaseServer();
  try {
    await page.goto(new URL('math/uni/four-subspaces.html',release.base).href);
    await page.locator('#preset').selectOption('zero');
    await page.locator('#revealAnswer').click();
    await expect(page.locator('#verificationInfo')).toContainText('0+2=2，0+3=3');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  } finally {await release.close();}
});
