# high-chemistry-ion-equilibrium-tabs-accessibility Specification

## Purpose
确保高中化学水溶液中的离子平衡页面四个实验主题可由键盘和辅助技术发现、操作与确认，并让当前选中主题与内容面板保持同步。

## ADDED Requirements

### Requirement: 高中化学离子平衡主题页签可访问

离子平衡页面 MUST 将弱电解质电离、pH 可视化、盐类水解和综合实验作为同一水平页签组呈现。页签组 MUST 有可访问名称，每个页签 MUST 暴露 `tab` 语义、可访问名称、选中状态和关联面板；当前内容 MUST 作为有标签的 `tabpanel` 提供。页签组 MUST 只有一个 Tab 停靠点，支持 Left/Right Arrow 循环移动且自动显示对应内容；Home 和 End MUST 分别移动并激活首个和末个页签。原生 Enter、Space、点击和触屏激活 MUST 保持可用。页面 MUST 显示键盘焦点。

#### Scenario: 初始主题状态可识别
- **WHEN** 学习者打开离子平衡页面
- **THEN** 四个主题入口位于命名页签组中，只有“弱电解质电离”被选中，且当前面板标记其标题来源

#### Scenario: 键盘切换主题
- **WHEN** 键盘焦点位于任一页签并按 Left/Right Arrow、Home 或 End
- **THEN** 焦点移动到对应页签，选中状态同步更新，面板显示匹配的主题

#### Scenario: 原生键盘与指针激活
- **WHEN** 学习者通过 Enter、Space、鼠标或触屏激活一个主题
- **THEN** 该页签成为唯一选中项并展示对应面板

### Requirement: 离子平衡主题在窄屏内完整显示

四个主题面板 MUST 在 320 CSS 像素宽度内显示，不得产生横向页面溢出或通过裁切隐藏必要内容。

#### Scenario: 窄屏访问四个主题
- **WHEN** 学习者在 320 CSS 像素宽度逐一访问四个主题
- **THEN** 所有页签均可见、可操作，每个面板及其控件均在页面宽度内
