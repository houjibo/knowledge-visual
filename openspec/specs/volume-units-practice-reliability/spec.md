# volume-units-practice-reliability Specification

## Purpose
TBD - created by archiving change volume-units-practice-reliability. Update Purpose after archive.

## Requirements

### Requirement: 换算和挑战逐题可靠计分
页面 SHALL 对每题只计一次分，换算答案使用精确数值判定。

#### Scenario: 重复点击限时挑战选项
- **WHEN** 学习者在切题前再次点击
- **THEN** 不重复计分且只推进一次

### Requirement: 估测与完成进度状态准确
页面 SHALL 显示实际估测题目数量，并在存储失败时提示完成记录尚未保存。

#### Scenario: 估测结束
- **WHEN** 所有估测题回答完毕
- **THEN** 显示最终得分并隐藏下一题按钮

#### Scenario: 保存恢复
- **WHEN** 完成条件达标但存储失败
- **THEN** 学习者可继续操作并在恢复后重试保存
