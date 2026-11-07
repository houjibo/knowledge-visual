# measurement-estimation-reliability Specification

## Purpose
TBD - created by archiving change measurement-estimation-reliability. Update Purpose after archive.

## Requirements

### Requirement: 换算与估算可靠计分
系统 SHALL 有限生成换算选项，并对每道换算或估算题最多记录一次提交。

#### Scenario: 随机值重复
- **WHEN** 随机数持续重复
- **THEN** 页面仍可初始化，换算题显示四个互异选项和正确答案

#### Scenario: 反馈期间重复提交或换题
- **WHEN** 学习者重复提交或在反馈期间手动换题
- **THEN** 旧题只计一次，旧回调不会替换手动生成的新题

### Requirement: 明确图示和估算边界
系统 SHALL 将屏幕尺子、非比例柱形和物体示例长度标为示意或参考值。

#### Scenario: 估算生活物体
- **WHEN** 学习者提交长度估算
- **THEN** 反馈说明参考长度及实际物体尺寸可能不同
