## Why

恒定电流页在隐藏标签初始化时把画布尺寸设为零，切换到相关模块后仍显示空白；测验又按答对次数而不是不同题目计分，重复同一题即可误记完成。电动机功率题还省略了忽略其他损耗的理想化条件。

## What Changes

- 切入四个可视化模块时绘制该模块的全部画布，并在活动模块尺寸变化时重绘。
- 仅在四道不同测验题均至少答对一次后记录主题完成。
- 明确电动机题只考虑线圈焦耳热、忽略其他损耗的计算前提。
- 为画布、参数交互、测验进度及电动机题条件添加桌面和窄屏回归。

## Capabilities

### New Capabilities
- `constant-current-learning-reliability`: 恒定电流互动页的画布呈现、测验完成和理想化模型边界。

### Modified Capabilities

## Impact

影响 `physics/high/constant-current.html`、Playwright 浏览器回归、交互证据索引和差距文档；不新增依赖或改变共享进度存储格式。
