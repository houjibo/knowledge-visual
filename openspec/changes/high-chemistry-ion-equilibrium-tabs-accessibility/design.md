## Context

页面已有同步显示/隐藏四个 `.section` 面板的点击处理器，面板都在当前 DOM 中。页内包含电离和 pH 滑块、盐类选择按钮、滴定控制与信息卡。窄屏页宽超出来源已定位为首个面板的 `.slider-group`，其固定 130px 滑块和 50px 数值标签无法在 controls 中收缩。

## Goals / Non-Goals

**Goals:**
- 使用有名称的单停靠点页签组，使选中状态、焦点和可见面板一致。
- 保留各个面板的现有交互和化学内容。
- 让 320px 页面无横向溢出，并避免用裁切隐藏问题。

**Non-Goals:**
- 重写电离度、酸碱性、水解或滴定计算逻辑。
- 重构绘图算法、进度记录或导航。
- 新增无障碍运行时依赖。

## Decisions

- 在 `role=tablist` 中采用原生 `button` 和 `role=tab`，使用 `aria-selected`、roving `tabindex`、`aria-controls` 与 `aria-labelledby` 连接当前面板。原生按钮保留 Enter、Space、点击和触屏；小型键盘处理器负责方向键循环与 Home/End。
- 将同步 `.active` 切换、ARIA 状态与 roving `tabindex` 集中到 `activateTab` 函数。当前四个面板均已即时可用，采用自动激活，符合 [WAI-ARIA APG Tabs Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/)。
- 面板设置 `tabindex=0`，使面板标题可在页签之后聚焦；隐藏面板继续通过 `display:none` 从辅助技术视图中移除。
- 在窄屏将滑块控件组改为可收缩宽度、缩短面板间距，并将四列信息卡改为自适应两列；删除 `overflow-x:hidden` 避免裁掉超宽内容。

## Risks / Trade-offs

- 按钮默认样式可能影响原主题 → 显式继承字体/颜色并测试焦点和选中视觉。
- `.active` 与 ARIA 状态可能漂移 → 同一状态函数更新所有页签和面板，并在浏览器测试中断言。
- 隐藏后才显示的面板可能有不同溢出源 → 320px 测试逐一切换四个面板并在每个状态检查实际页面宽度。

## Migration Plan

仅改造页签元素、切换处理器和窄屏 CSS。无 URL 或持久化迁移；失败时一起还原结构与状态处理器。
