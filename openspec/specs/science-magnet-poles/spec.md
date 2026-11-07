# science-magnet-poles Specification

## Purpose
TBD - created by archiving change science-magnet-poles. Update Purpose after archive.

## Requirements

### Requirement: 磁极预设与画面一致
系统 SHALL 使异极预设的相对磁极为 N 和 S，同极预设的相对磁极相同；距离控件 SHALL 与画面中的中心间距同步。

#### Scenario: 切换与翻转
- **WHEN** 学习者选择同极并翻转右侧磁铁
- **THEN** 图示及文字从同极相斥变为异极相吸

#### Scenario: 拖动与滑杆
- **WHEN** 学习者拖动右侧磁铁或调整滑杆
- **THEN** 显示的中心距离与画面一致，磁铁不重叠

### Requirement: 模型限制及物品反馈清晰
系统 SHALL 提供键盘可用的物品测试，并说明示意曲线和铁粉动画不是精确计算结果。

#### Scenario: 选择测试物品
- **WHEN** 学习者选择铁钉或木块
- **THEN** 页面展示对应的定性吸引反馈，且重置后恢复初始状态
