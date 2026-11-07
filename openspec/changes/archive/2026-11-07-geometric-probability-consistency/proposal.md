## Why
缩短线段时，子区间端点可能超过总长度，产生负概率；蒙特卡洛重置后仍显示旧估算和误差。线段采样也没有显示命中次数，难以比较频率与理论值。

## What Changes
联动线段及端点范围，改变长度时清空旧样本，改变子区间时重算已有点的频率；重置时清除 π 估算，明确均匀取样条件和相对误差。

## Capabilities
### New Capabilities
- `geometric-probability`: 线段取点与蒙特卡洛估算的状态一致性。

### Modified Capabilities

## Impact
高中概率页面、测试及交互证据。
