## Why

高中化学“反应速率与平衡”页把仅适用于 1:1 反应的速率关系写成通式，把人为构造的粒子指标标为反应速率，并断言催化剂“不参与反应”。这些表达会让学习者误把示意模型当作实测规律。主题和测验选项也无法可靠地用键盘操作。

## What Changes

- 明确恒容、化学计量和单位前提，区分模型粒子指标与实测速率；修正催化剂与温度影响的说明及单位题。
- 将五个主题入口和四道题的选项改为原生按钮，提供可见焦点、状态和存储失败反馈。
- 为概念边界、键盘操作、作答锁定和完成记录补浏览器回归，并更新核查台账。

## Capabilities

### New Capabilities
- `chemistry-reaction-rate-concept-access`: 反应速率页以可核对的前提解释模型和概念，并支持键盘完成主题切换与测验。

### Modified Capabilities

## Impact

影响 `chemistry/high/reaction-rate.html`、专项 Playwright 测试、测试入口和交互证据。沿用原页面路径及 `reaction-rate` 进度键，不引入新依赖。
