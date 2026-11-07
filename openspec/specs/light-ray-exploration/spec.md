# light-ray-exploration Specification

## Purpose
TBD - created by archiving change light-ray-geometry. Update Purpose after archive.

## Requirements

### Requirement: 反射光与法线对称
反射模式 SHALL 将入射与反射光绘制在镜面同侧，并显示相对于法线的相等角度。

#### Scenario: 选择三十度入射
- **WHEN** 学习者选择 30° 入射角
- **THEN** 实际画布两条光线在镜面同侧并关于法线对称，显示相等角度

### Requirement: 空气到水的折射方向正确
折射模式 SHALL 按折射率近似计算折射角，并说明零度入射时传播方向不变。

#### Scenario: 沿法线入射
- **WHEN** 学习者选择 0°
- **THEN** 入射和折射光在同一直线上，折射角为 0°

### Requirement: 角度可键盘操作
学习者 SHALL 可以使用原生滑块选择反射或折射的入射方向，文字显示角度并同步图示。

#### Scenario: 调整至极限角度
- **WHEN** 使用键盘选择滑块的两端
- **THEN** 光线保持在对应介质并显示不超过 80° 的入射角

### Requirement: 不透明障碍物形成正确的点光源影子
直线传播模式 SHALL 将中心光线限制在障碍物前，并根据点光源到障碍物的几何关系绘制后方阴影。

#### Scenario: 移动障碍物
- **WHEN** 学习者将障碍物从靠近光源移动到远离光源
- **THEN** 光线始终停在障碍物处，固定屏幕位置的阴影变小

### Requirement: 障碍物位置可使用键盘调整
学习者 SHALL 能通过原生滑块调整障碍物位置，状态文字和画布同步。

#### Scenario: 使用键盘到达两端并重置
- **WHEN** 学习者用 Home、End 调整障碍物后选择重置
- **THEN** 状态反映远近变化，重置后恢复中间位置
