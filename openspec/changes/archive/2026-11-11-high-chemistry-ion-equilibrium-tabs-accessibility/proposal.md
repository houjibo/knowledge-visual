## Why

高中化学“水溶液中的离子平衡”页面的四个主题入口是不可聚焦的 `div`。键盘用户按 Tab 会跳过页签，首次聚焦落到“重置”按钮；辅助技术无法读出当前主题。320px 视口的离子化控制组超出页面宽度 5px，且 `overflow-x:hidden` 会掩盖部分内容。

## What Changes

- 将弱电解质电离、pH 可视化、盐类水解和综合实验改为命名且状态可感知的页签组，并关联各自内容面板。
- 支持鼠标、触屏及原生 Enter/Space 激活；方向键循环切换，Home/End 定位首尾，并显示键盘焦点。
- 修复窄屏控制和信息卡布局，使 320 CSS 像素下四个面板均无横向溢出。
- 保留动画、pH 探索、盐类水解及酸碱滴定逻辑。

## Capabilities

### New Capabilities
- `high-chemistry-ion-equilibrium-tabs-accessibility`: 定义离子平衡四主题的页签交互与窄屏布局要求。

### Modified Capabilities

无。

## Impact

影响 `chemistry/high/ion-equilibrium.html`、对应浏览器测试、交互证据与 OpenSpec 能力契约；不增加运行时依赖，不改变页面路径、存储或教学模型。
