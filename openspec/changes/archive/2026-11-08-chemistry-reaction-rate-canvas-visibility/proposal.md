## Why

高中化学“反应速率与平衡”页把画布尺寸绑定到父容器的可见尺寸，但多个主题在页面加载时处于 `display: none`；切换主题只改变 CSS 状态，导致“影响因素”等主题首次打开时显示空白图表。本地实测已复现，且窗口缩放也可能把隐藏画布重新置为零尺寸。

## What Changes

- 首次加载、主题切换和视口变化时，只绘制当前可见主题的画布。
- 为反应速率、影响因素、化学平衡、勒夏特列原理中的画布添加桌面和窄屏回归，检查可见尺寸及绘制像素。
- 更新主题交互证据索引与差距记录，明确未覆盖范围。

## Capabilities

### New Capabilities
- `chemistry-reaction-rate-canvas-visibility`: 确保反应速率与平衡页的当前主题画布在显示和缩放后正确绘制。

### Modified Capabilities

## Impact

影响 `chemistry/high/reaction-rate.html`、对应 Playwright 回归、`package.json` 测试入口、交互证据索引及项目差距记录；不新增依赖，也不改变化学模型、题目或进度存储。
