# middle-physics-mode-keyboard-access Specification

## Purpose
让初中物理浮力、简单机械和功与机械能页面的学习模式入口可以通过键盘或触摸操作，并清楚表达当前选择，帮助学习者进入各个可视化活动和练习。

## Requirements

### Requirement: 模式入口可访问并同步内容
三个主题的每个模式入口 SHALL 是可聚焦按钮，支持键盘和指针操作，显示可见焦点，并同步当前模式的面板与选中状态。

#### Scenario: 键盘切换模式
- **WHEN** 学习者用 Enter 或空格激活模式入口
- **THEN** 对应内容显示，所选按钮标记为已按下，其他入口标记为未按下

#### Scenario: 触摸或点击切换模式
- **WHEN** 学习者点击或触摸另一模式入口
- **THEN** 内容及按钮选中状态随模式更新
