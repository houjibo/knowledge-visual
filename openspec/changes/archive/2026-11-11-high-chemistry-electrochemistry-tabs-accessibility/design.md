## Context

电化学页面已有同步显示/隐藏四个 `.section` 面板的点击处理器；面板内容都已在本页 DOM 中，无需异步加载。它们包含电池类型和电解液选择、动画按钮、腐蚀条件控制及练习选项。

## Goals / Non-Goals

**Goals:**
- 使用水平单停靠点页签模式，并让焦点、选中状态与可见面板在同一次状态切换中保持一致。
- 保留原有指针交互、图表及实验内容。
- 消除已复现的 320px 横向溢出。

**Non-Goals:**
- 重构电化学计算模型、动画或测验数据。
- 将练习选项和本页其他非原生交互一并改造。
- 新增运行时依赖或另设导航路径。

## Decisions

- 在有名称的 `role=tablist` 中使用原生 `button` 页签，使用 `role=tab`、`aria-selected`、roving `tabindex` 与 `aria-controls` 表达状态和面板关系。按钮原生支持 Enter、Space、鼠标和触屏；轻量键盘处理器提供左右循环及 Home/End。
- 面板使用 `role=tabpanel` 和 `aria-labelledby`，设置 `tabindex=0`，让标题与图示也能通过键盘读取；隐藏面板继续使用现有 `display:none` 状态。
- 四个面板都已在页面中且切换同步，因此方向键移动时自动选中并显示目标面板，避免焦点和内容分离。交互遵循 [WAI-ARIA APG Tabs Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/)。
- 通过窄屏媒体规则缩小面板内边距并允许栏位收缩；保持四项顺序和换行，不重做桌面布局。

## Risks / Trade-offs

- 原生按钮会应用浏览器默认文字样式 → 在 `.tab` 样式中继承页面字体和颜色，并回归按钮的视觉状态。
- CSS `.active` 可能与 ARIA 状态不同步 → 将类名、`aria-selected`、`tabindex` 和面板切换统一放入一个 `activateTab` 函数并同时断言。
- 面板窄屏最小宽度造成溢出 → 对 320px 视口测试页面 `scrollWidth` 及四个页签可见性。

## Migration Plan

只修改现有页签元素、同步状态处理器和必要的窄屏 CSS。无 URL 或持久化数据迁移；如浏览器回归失败，可一起还原页签结构与状态处理器。
