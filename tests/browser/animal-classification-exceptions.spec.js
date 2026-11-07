const {test, expect} = require('@playwright/test');

test('键盘选择动物类群，文字与图示同步并保留例外', async ({page}) => {
  await page.goto('/science/animals.html');
  await expect(page.locator('#groupDetails')).toContainText('鸭嘴兽产卵，也是哺乳动物');
  await expect(page.locator('#animalCanvas')).toHaveAttribute('aria-label', /哺乳动物/);
  const reptile = page.getByRole('button', {name: '🦎 爬行动物'});
  await reptile.focus(); await page.keyboard.press('Enter');
  await expect(reptile).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', {name: '🐱 哺乳动物'})).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('#groupDetails')).toContainText('多数产卵，也有胎生');
  await expect(page.locator('#groupDetails')).toContainText('卵壳较柔韧');
  await expect(page.locator('#animalCanvas')).toHaveAttribute('aria-label', /爬行动物/);
  await page.getByRole('button', {name: '🐸 两栖动物'}).click();
  await expect(page.locator('#groupDetails')).toContainText('其他两栖动物的生活方式不同');
});

test('分类计算反馈及测验解释可用', async ({page}) => {
  await page.goto('/science/animals.html');
  await page.locator('[data-mode="practice"]').click();
  await page.getByRole('spinbutton', {name: '昆虫有几种'}).fill('2');
  await page.locator('[data-check="a2"]').click();
  await expect(page.locator('#fb-a2')).toContainText('结合身体结构');
  await page.getByRole('spinbutton', {name: '昆虫有几种'}).fill('3');
  await page.locator('[data-check="a2"]').click();
  await expect(page.locator('#fb-a2')).toContainText('正确');
  await page.locator('[data-mode="quiz"]').click();
  await page.locator('#quizStart').click();
  await page.locator('#quizNext').click(); await page.locator('#quizNext').click();
  await page.locator('#quizOpts button').nth(1).click();
  await expect(page.locator('#quizFb')).toContainText('其他两栖动物');
});
