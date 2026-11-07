# derivative-log-domain-accuracy Specification

## Purpose
TBD - created by archiving change derivative-log-domain-accuracy. Update Purpose after archive.

## Requirements

### Requirement: 自然对数定义域清晰

选择 ln(x) 时页面 SHALL 说明定义域 x > 0；当切点不在定义域时 SHALL 用可理解的未定义提示替代 NaN，且不绘制无效点或切线。

#### Scenario: 非正切点

- **WHEN** 选择 ln(x) 且切点为零或负数
- **THEN** 函数值、导数和切割线斜率显示未定义，并且画布不显示无效数值标签

#### Scenario: 返回定义域内

- **WHEN** 切点从非正数调整为正数
- **THEN** 页面恢复显示正确函数值、导数、割线斜率和对应图示
