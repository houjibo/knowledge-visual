# cylinder-cone-concept-keyboard-access Specification

## Purpose
TBD - created by archiving change cylinder-cone-concept-keyboard-access. Update Purpose after archive.

## Requirements

### Requirement: 概念图形可用键盘选择
页面 SHALL 使用具名按钮选择圆柱与圆锥，并同步所选状态与详情。

#### Scenario: 键盘切换图形
- **WHEN** 学习者使用 Tab、回车或空格选择图形
- **THEN** 对应详情可见、另一详情隐藏，按钮的选中状态更新

#### Scenario: 切换模式后返回
- **WHEN** 学习者离开概念模式并返回
- **THEN** 此前选择与详情保持一致
