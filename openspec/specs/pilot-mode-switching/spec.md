# pilot-mode-switching Specification

## Purpose
让键盘和辅助技术使用者能够发现并操作三个代表性科学主题的学习模式，明确当前模式并访问对应的可视化、计算和练习内容。

## Requirements

### Requirement: 可操作的模式切换
机械运动、物质的量和沉与浮页面 SHALL 提供可通过键盘聚焦及使用 Enter 或 Space 激活的模式按钮，并向辅助技术暴露当前选中状态。

#### Scenario: 使用键盘打开计算
- **WHEN** 用户聚焦物质的量页面的计算按钮并按 Enter
- **THEN** 页面显示计算内容，并将该按钮标记为选中、其他模式按钮标记为未选中

#### Scenario: 使用指针切换物理模式
- **WHEN** 用户点击机械运动页面的运动图像按钮
- **THEN** 页面显示对应内容，并更新按钮选中状态

### Requirement: 键盘焦点可见
三个试点主题的模式按钮 SHALL 在键盘聚焦时提供可见的焦点指示。

#### Scenario: 键盘聚焦模式
- **WHEN** 用户通过 Tab 聚焦一个模式按钮
- **THEN** 该按钮显示可辨认的焦点轮廓
