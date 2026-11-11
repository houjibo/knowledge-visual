## Why

高中化学“电化学”页面的原电池、电解池、腐蚀与防护和互动练习入口是不可聚焦的 `div`。键盘用户按 Tab 会跳过这些入口并进入原电池参数选择框，辅助技术也无法读出当前主题。320px 视口下页面内容超出视口 9px。

## What Changes

- 将四个主题入口改为名称清晰、状态可感知、面板关联明确的页签组。
- 支持鼠标、触屏和原生 Enter/Space 激活，左右方向键循环移动，Home/End 定位首尾，并保持可见焦点。
- 在 320 CSS 像素宽度下保留四个入口的可见可操作性，并消除横向溢出。
- 保留现有电化学模型、动画、练习内容及导航。

## Capabilities

### New Capabilities
- `high-chemistry-electrochemistry-tabs-accessibility`: 定义电化学四个主题入口的页签语义、键盘操作和响应式验收要求。

### Modified Capabilities

无。

## Impact

影响 `chemistry/high/electrochemistry.html`、对应浏览器测试、交互证据及 OpenSpec 能力契约；不增加运行时依赖，不改变页面路径、学习进度或教学内容。
