# polygon-area-learning Specification

## Purpose
TBD - created by archiving change polygon-area-geometry. Update Purpose after archive.

## Requirements

### Requirement: 剪拼图形和公式一致
推导 SHALL 显示平行四边形剪片平移成矩形、两个三角形及两个梯形各拼成平行四边形，最终共边且无重叠。

#### Scenario: 完成三个图形的动画
- **WHEN** 学习者分别播放三种剪拼动画到结束
- **THEN** 实际画布的图形顶点组成所述图形，且平移和旋转保持面积

### Requirement: 练习可靠出题
练习和挑战 SHALL 从有限候选生成不同选项，提交后锁定选项并记录一次答案。

#### Scenario: 固定随机数生成题目
- **WHEN** 随机数固定且学习者进入练习和挑战
- **THEN** 题目可生成，选项不同且包含正确面积

### Requirement: 可控制并理解剪拼过程
推导 SHALL 提供键盘可操作的步骤选择、播放和暂停，并同步展示当前图形与文字说明。

#### Scenario: 手动定位到中间和完成
- **WHEN** 学习者使用滑块选择中间步骤和结束步骤
- **THEN** 动画停止在对应位置，图形和文字说明同步更新

#### Scenario: 切换图形或离开推导
- **WHEN** 学习者切换图形或离开推导模式
- **THEN** 进行中的动画停止，图形切换时步骤重置并更新选中状态
