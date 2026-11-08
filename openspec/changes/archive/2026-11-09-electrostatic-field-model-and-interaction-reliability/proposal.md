## Why

静电场页把滑块的像素距离当作物理距离计算，默认库仑力因此偏离正确值许多数量级；零电荷、重复答题和鼠标专用画布也会误导概念或阻断学习。现在修正模型和输入反馈，可让可视化读数、场的方向与练习进度共同支持可靠学习。

## What Changes

- 用微库仑和米计算牛顿单位的库仑力，明确示意图中像素与米的映射，并正确表示零电荷、吸引与排斥。
- 让电场与电势图依据点电荷叠加，明确显示色标、等势线及点电荷核心区域的示意限制。
- 将主题切换改为语义化、可键盘操作的标签；为画布提供名称、操作说明和键盘移动电荷的方式。
- 锁定每题首次作答，按不同题目统计得分与页面完成进度，重练不重复计入同一题。
- 增加可单独验证的静电场模型和桌面/窄屏浏览器回归。

## Capabilities

### New Capabilities
- `electrostatic-field-learning`: 静电场定量模型、可视化标注、可访问交互和稳定的练习完成规则。

### Modified Capabilities

## Impact

- 修改 `physics/high/electrostatic-field.html`，新增 `physics/high/assets/electrostatic-model.js`。
- 新增模型单元测试和 Playwright 浏览器回归，并把浏览器用例登记到交互证据索引。
- 更新页面清单、交互覆盖与风险评估、`docs/gaps.md` 及 OpenSpec 主规格。
- 不新增运行时依赖；GitHub Pages 继续发布静态文件。
