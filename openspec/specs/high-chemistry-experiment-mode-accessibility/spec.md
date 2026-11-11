# high-chemistry-experiment-mode-accessibility Specification

## Purpose
确保高中化学实验页面的四种实验模式可被键盘和辅助技术发现、切换与确认，同时维持指针操作和对应实验内容的一致性。

## Requirements

### Requirement: 高中化学实验模式页签可访问

化学实验页面 MUST 将物质制备、性质验证、定量实验和实验设计作为同一横向页签组呈现。页签组 MUST 有可访问名称，每个页签 MUST 暴露 `tab` 语义、可访问名称、选中状态和关联面板；当前内容 MUST 作为有标签的 `tabpanel` 提供。页签组 MUST 使用一个 Tab 停靠点，并支持方向键循环移动且自动显示对应内容；Home 和 End MUST 分别移动并激活首个和末个页签。原生 Enter、Space、点击和触屏激活 MUST 保持可用。页面 MUST 显示键盘焦点。

#### Scenario: 初始页签状态可识别
- **WHEN** 学习者打开化学实验页面
- **THEN** 四个有名称的页签位于命名页签组中，只有“物质制备”被选中，且内容面板标记其标题来源

#### Scenario: 键盘循环切换实验模式
- **WHEN** 键盘焦点位于任一页签并按 Left/Right Arrow、Home 或 End
- **THEN** 焦点移动到对应页签，选中状态同步更新，面板显示匹配的实验模式

#### Scenario: 原生键盘及指针激活
- **WHEN** 学习者通过 Enter、Space、鼠标点击或触屏激活一个实验模式
- **THEN** 该页签成为唯一选中项，并展示对应实验内容

#### Scenario: 窄屏使用模式页签
- **WHEN** 学习者在 320 CSS 像素宽视口打开页面
- **THEN** 四个页签均可见、可操作，页面不产生横向溢出
