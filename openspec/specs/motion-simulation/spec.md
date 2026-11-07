# motion-simulation Specification

## Purpose
TBD - created by archiving change motion-simulation-controls. Update Purpose after archive.

## Requirements

### Requirement: 模式切换和动画状态一致
机械运动模拟 SHALL 在切换模式时暂停当前动画并保留读数，按钮显示可继续；暂停和重置 SHALL 取消待执行动画帧。

#### Scenario: 返回已暂停的运动
- **WHEN** 学习者运行速度概念后切换到其他模式再返回
- **THEN** 数值保持不变、按钮显示继续，激活后动画恢复

### Requirement: 匀速图像反映所选速度
运动图像 SHALL 在速度调整时清除旧轨迹并提示重新绘制，坐标范围容纳最大速度在十秒内的路程。

#### Scenario: 绘图中修改速度
- **WHEN** 学习者调整速度
- **THEN** 原图和时间清零，动画暂停，重新绘制使用新速度

#### Scenario: 完成后再次绘制
- **WHEN** 图像绘制到十秒后再次启动
- **THEN** 从零开始绘制新的轨迹
