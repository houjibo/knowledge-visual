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
