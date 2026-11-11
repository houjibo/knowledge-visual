## Why

高中化学“元素周期律”页面的三个主题入口是不可聚焦的 `div`，键盘用户按 Tab 会直接跳过它们，也无法获知当前主题。将主题入口改为可访问的页签导航，能让学习者用键盘进入页面的三个主要内容区，并由辅助技术读出选中状态。

## What Changes

- 为“周期表结构、性质递变、规律预测”三个主题入口提供页签列表语义、名称、选中状态和对应内容面板关系。
- 支持鼠标、触屏及键盘切换；左右方向键循环移动并自动切换内容，Home/End 到达首尾，Enter/Space 使用原生按钮激活。
- 为当前页签提供 roving tabindex 和可见焦点，在窄屏保留可用布局。
- 保留周期表数据、趋势图、测验、页面路径和既有内容。

## Capabilities

### New Capabilities
- `chemistry-periodic-table-tab-navigation`: 定义元素周期律页面的页签语义、键盘操作和内容面板状态。

### Modified Capabilities

无。

## Impact

影响 `chemistry/high/02-periodic.html`、对应 Playwright 浏览器测试、交互证据索引及 OpenSpec 能力契约；不增加运行时依赖，不改变导航 URL、学科进度或教学内容。
