# university-physics-mode-accessibility Specification

## Purpose
本规格规范大学物理主题的模式按钮可访问，核心边界为：五个同构大学物理主题必须提供可聚焦的原生按钮，以键盘或指针切换学习、练习及测验，并同步可见面板和按钮状态。

## Requirements

### Requirement: 大学物理主题的模式按钮可访问
五个同构大学物理主题 SHALL 提供可聚焦的原生按钮，以键盘或指针切换学习、练习及测验，并同步可见面板和按钮状态。

#### Scenario: 使用键盘切换模式
- **WHEN** 用户聚焦练习或测验按钮并按 Enter 或空格
- **THEN** 对应面板可见、其他面板隐藏，按钮状态与焦点可辨识

#### Scenario: 返回学习模式
- **WHEN** 用户点击学习按钮
- **THEN** 学习面板显示且学习按钮被标记为选中
