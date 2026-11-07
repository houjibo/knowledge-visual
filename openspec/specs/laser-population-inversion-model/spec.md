# laser-population-inversion-model Specification

## Purpose
TBD - created by archiving change laser-population-inversion-model. Update Purpose after archive.

## Requirements

### Requirement: 反转与阈值示意符合模型假设
页面 SHALL 使用明确简化假设的三能级模型，使反转和阈值随泵浦、寿命及镜面反射率变化，并说明不计算实际输出功率。

#### Scenario: 泵浦跨过反转条件
- **WHEN** 学习者增大泵浦使 Wτ 从小于或等于 1 变为大于 1
- **THEN** 上能级粒子数从不大于下能级变为大于下能级

#### Scenario: 达到阈值练习
- **WHEN** 学习者调节泵浦、寿命和反射率使模型增益达到阈值
- **THEN** 页面标记目标达成并说明光束只是示意
