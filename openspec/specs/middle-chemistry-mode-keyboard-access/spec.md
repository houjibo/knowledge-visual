# middle-chemistry-mode-keyboard-access Specification

## Purpose
让初中化学原子与元素、化学式和化学方程式主题的学习模式入口能够通过键盘和触摸操作，并清晰表达当前所选模式，帮助学习者进入可视化活动和练习。

## Requirements

### Requirement: 三个化学主题的模式入口可访问
三个主题的每个模式入口 SHALL 是可聚焦的原生按钮，具有可见焦点，并支持键盘和指针操作，切换时同步内容与选中状态。

#### Scenario: 使用键盘切换模式
- **WHEN** 学习者使用 Enter 或空格激活模式按钮
- **THEN** 对应内容显示，所选按钮标为已按下，其余按钮标为未按下

#### Scenario: 使用触摸或鼠标切换模式
- **WHEN** 学习者触摸或点击另一模式按钮
- **THEN** 对应内容和选中状态更新
