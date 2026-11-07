# sound-echo-time-consistency Specification

## Purpose
TBD - created by archiving change sound-echo-time-consistency. Update Purpose after archive.

## Requirements

### Requirement: 回声示意反映理想往返时间
页面 SHALL 按当前距离与温度近似计算声速和往返时间，并使位置与去程及回程一致。

#### Scenario: 改变距离和温度
- **WHEN** 学习者更改距离或气温
- **THEN** 页面重置旧传播过程并显示新的理想声速与往返时间

### Requirement: 回声过程可操作和分步观察
页面 SHALL 提供发出、暂停、分步和重置操作，减少动态效果时默认暂停。

#### Scenario: 分步观察回声
- **WHEN** 学习者发出声波并依次执行下一阶段
- **THEN** 页面显示去程、反射返回和声波已返回，且阶段对应位置正确
