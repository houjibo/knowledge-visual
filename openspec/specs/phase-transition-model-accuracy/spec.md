# phase-transition-model-accuracy Specification

## Purpose
TBD - created by archiving change phase-transition-model-accuracy. Update Purpose after archive.

## Requirements

### Requirement: 相变图反映模型局限
页面 SHALL 将范德瓦尔斯曲线标为未平衡修正的模型，不将未经等面积构造的线段标为共存平台。

#### Scenario: 低于临界温度
- **WHEN** 用户调节低于临界温度的模型参数
- **THEN** 页面说明相态需结合共存条件判断，并说明图中未计算共存平台

### Requirement: 区分临界温度与超临界区域
页面 SHALL 区分温度高于临界温度与温度、压力均高于临界值的状态。

#### Scenario: 改变摩尔体积
- **WHEN** 温度高于临界温度而压力跨过临界压力
- **THEN** 模型状态随计算压力变化，不将两侧均标为超临界区
