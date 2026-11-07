## ADDED Requirements

### Requirement: 固液压强图示与计算一致
固体压力箭头 SHALL 指向受力面，静止液体显示的深度单位及压强增量 SHALL 与当前密度和深度一致。

#### Scenario: 选择液体和深度
- **WHEN** 学习者选择水并设置 400 mm 深度
- **THEN** 页面显示 40.0 cm 和 3.92 kPa，所选密度与计算相同

### Requirement: 练习进度基于独立首次作答
练习 SHALL 保留每题首次选择，答对三道不同题后尝试记录完成；存储失败 SHALL 提供重试。

#### Scenario: 错误答案已揭晓
- **WHEN** 学习者答错并返回该题
- **THEN** 原选择和反馈保留，不能通过再次点击已揭晓答案增加正确数
