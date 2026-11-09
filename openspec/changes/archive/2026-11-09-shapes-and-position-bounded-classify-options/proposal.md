## Why

“认识图形与位置”页会在页面加载时初始化隐藏的分类游戏；当随机源连续给出同一形状时，选项补齐循环无法结束，导致整个页面无法使用。分类选项目前还是只能点击的 `div`，键盘学习者无法参与这项视觉辨形练习。

## What Changes

- 用有限候选生成四个互异分类选项，随机值重复时页面仍能完成初始化。
- 将图形选项改为有名称的原生按钮，让鼠标、Enter 和 Space 采用相同判题路径。
- 窄屏改为两列图形选项，保证图形完整可见且不产生横向溢出。
- 每题答对后立即锁定选项，避免等待下一题期间重复增加连续答对数。
- 增加固定随机值、选项正确性、键盘操作及单题计分的桌面和移动浏览器回归。

## Capabilities

### New Capabilities
- `shape-classification-practice`: 形状识别练习的有限选项、语义键盘操作和单题计分行为。

### Modified Capabilities

## Impact

- 页面：`math/topics/shapes-and-position/index.html`
- 回归：`tests/browser/shapes-and-position-classification.spec.js`，并纳入 `package.json` 浏览器测试命令。
- 证据：交互覆盖索引、交互风险线索及 `docs/gaps.md`。
