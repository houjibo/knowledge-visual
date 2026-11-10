# angle-measurement-model-correctness Specification

## Purpose
本规格规范角度图示与度数一致；练习可独立解答并有限生成；作答后反馈持续可读，核心边界为：页面必须按所选度数绘制角的射线和弧，分类示意必须对应所标的角类型。

## Requirements

### Requirement: 角度图示与度数一致
页面 SHALL 按所选度数绘制角的射线和弧，分类示意 SHALL 对应所标的角类型。

#### Scenario: 观察三十度
- **WHEN** 学习者将角度设置为 30°
- **THEN** 从右侧零度边起算的射线为 30°，而不是 150°

### Requirement: 练习可独立解答并有限生成
读角题 SHALL 显示可用刻度而不直接标出答案，计算题 SHALL 隐藏未知角并标明非比例示意。

#### Scenario: 重复随机值
- **WHEN** 随机值持续相同
- **THEN** 读角与计算题仍能生成四个不同选项

### Requirement: 作答后反馈持续可读
每题 SHALL 最多计数一次，结果 SHALL 保留至学习者主动换题。

#### Scenario: 成功画角
- **WHEN** 学习者成功画出目标角并重复确认
- **THEN** 成功次数只增加一次
