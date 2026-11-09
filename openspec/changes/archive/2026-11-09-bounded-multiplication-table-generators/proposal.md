## Why

乘法口诀表页在加载时会生成填空题和看积找口诀题，两处无界随机重抽在固定随机值下可能始终无法补齐选项，进而阻塞整个页面。交互风险盘点已定位到对应循环，需要把这两种练习改为可证明结束的出题行为。

## What Changes

- 为填空练习使用有限、互异的干扰项候选，保证答案与题干缺项一致。
- 为看积找口诀题从有限因数对中补齐选项，保留该乘积的全部正确口诀。
- 增加固定随机值的桌面和移动端浏览器回归，并更新交互证据及差距记录。

## Capabilities

### New Capabilities

- `bounded-multiplication-table-practice`: 乘法口诀表填空和看积找口诀练习的有限出题及答案语义。

### Modified Capabilities

无。

## Impact

- 修改 `math/topics/multiplication-tables/index.html` 两种练习的候选生成。
- 新增并注册 Playwright 回归；不新增依赖，不改变练习计分规则或静态站点部署方式。
