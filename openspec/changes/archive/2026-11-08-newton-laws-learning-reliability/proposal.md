## Why

高中物理“牛顿运动定律”页在初始化时绘制隐藏分区画布并把内部尺寸设为零，切换到“连接体问题”后没有重绘；测验循环复用题目索引，重复答对同一题也会累计到三题完成门槛。两处问题已从代码路径和本地交互复现，影响图示学习与知识地图进度可信度。

## What Changes

- 按活动分区绘制五张画布，保存可恢复的逻辑高度，并在切换、视口变化和动画跨分区后用当前状态重绘。
- 将主题完成门槛改为至少三道不同题目各答对一次；重复题不增加不同题完成数。
- 为桌面和窄屏添加画布、参数状态和测验进度回归，更新交互证据与差距记录。

## Capabilities

### New Capabilities
- `newton-laws-learning-reliability`: 确保牛顿定律页面的可视化画布与学习进度反馈可靠。

### Modified Capabilities

## Impact

影响 `physics/high/newton-laws.html`、对应 Playwright 回归、`package.json`、主题交互证据索引和 `docs/gaps.md`；不新增依赖，不改变运动方程或全站进度存储格式。
