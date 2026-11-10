const {test, expect} = require('@playwright/test');

const url = '/math/topics/compound-statistical-tables/index.html';

for (const seed of [0, 0.999999]) {
  test(`固定随机值 ${seed} 下读表题有限生成并可正确计分`, async ({page}) => {
    await page.addInitScript(value => { Math.random = () => value; }, seed);
    await page.goto(url, {waitUntil: 'domcontentloaded', timeout: 5000});
    await page.locator('.mode-tab[data-mode="read"]').click();

    const question = await page.locator('#read-question').innerText();
    const expected = await page.evaluate(() => {
      const prompt = document.getElementById('read-question').textContent;
      const rows = Array.from(document.querySelectorAll('#read-table tr')).slice(2);
      if (prompt.includes('一共有')) {
        const name = prompt.split('一共有')[0];
        const row = rows.find(candidate => candidate.cells[0].textContent === name);
        return Array.from(row.querySelectorAll('td')).slice(1).reduce((sum, cell) => sum + Number(cell.textContent), 0);
      }
      const [, rowName, colName] = prompt.match(/^(.+)在(.+)的数据是多少/);
      const columnIndex = Array.from(document.querySelectorAll('#read-table tr:nth-child(2) th')).findIndex(cell => cell.textContent === colName);
      const row = rows.find(candidate => candidate.cells[0].textContent === rowName);
      return Number(row.querySelectorAll('td')[columnIndex + 1].textContent);
    });

    const options = page.locator('#read-options button');
    const labels = await options.allTextContents();
    expect(labels, question).toHaveLength(4);
    expect(new Set(labels).size, question).toBe(4);
    for (const label of labels) expect(label).toMatch(/^\d+人$/);
    expect(labels.filter(label => label === `${expected}人`), question).toHaveLength(1);

    await options.filter({hasText: new RegExp(`^${expected}人$`)}).click();
    await expect(page.locator('#read-feedback')).toContainText('正确');
    await expect(page.locator('#read-correct')).toHaveText('1');
    await page.waitForTimeout(1550);
    await expect(page.locator('#read-question')).not.toBeEmpty();
    await expect(page.locator('#read-options button')).toHaveCount(4);
  });
}
