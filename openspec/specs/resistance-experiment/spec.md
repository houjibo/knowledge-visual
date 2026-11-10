# resistance-experiment Specification

## Purpose
本规格规范理想电路图与计算模型一致；动画可暂停且不重复调度，核心边界为：电源、导体、灯泡和电流表必须串联，电压表必须跨接导体两端，电路必须说明定值元件和温度假设。

## Requirements

### Requirement: 理想电路图与计算模型一致
电源、导体、灯泡和电流表 SHALL 串联，电压表 SHALL 跨接导体两端，电路 SHALL 说明定值元件和温度假设。

#### Scenario: 改变导体长度
- **WHEN** 学习者将导体长度调整到边界
- **THEN** 图示导体及电压表接线同步变化，电阻与电流读数按模型更新

### Requirement: 动画可暂停且不重复调度
模拟 SHALL 只维持一个动画循环，暂停和离开探究模式 SHALL 停止该循环。

#### Scenario: 多次调参后暂停
- **WHEN** 学习者反复调整滑块并暂停
- **THEN** 不再有待执行的动画帧，参数仍可调整并刷新静态图示
