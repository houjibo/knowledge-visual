# mole-visualization Specification

## Purpose
TBD - created by archiving change mole-visual-scale-and-units. Update Purpose after archive.

## Requirements

### Requirement: 物质的量图示随数值变化
物质的量探索 SHALL 在完整滑块范围内以固定比例显示示意点，明确示意比例、所选粒子种类及计算所用的常数近似值。

#### Scenario: 增大物质的量
- **WHEN** 物质的量从 7 mol 增至 10 mol
- **THEN** 示意点从 252 增至 360，质量和粒子数同步更新

#### Scenario: 选择氯化钠
- **WHEN** 学习者选择 NaCl
- **THEN** 页面说明粒子计数以 NaCl 组合单元为对象，并显示该选项的选中状态

#### Scenario: 了解常数精度
- **WHEN** 学习者阅读常数说明
- **THEN** 页面区分 SI 精确值和本页计算使用的近似值
