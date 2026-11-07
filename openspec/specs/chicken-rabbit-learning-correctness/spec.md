# chicken-rabbit-learning-correctness Specification

## Purpose
确保鸡兔同笼的挑战题、假设法解释和探索图示与头数脚数一致，在重复随机值下也能出题，并可靠记录不同题目的学习结果。

## Requirements

### Requirement: 挑战题可终止且按题计分
挑战 SHALL 从有限候选生成四个不同选项，提示正确描述假设脚数与实际值的差异，同一题只计一次并保留反馈直到主动换题。

#### Scenario: 重复提交
- **WHEN** 学习者重复触发已作答的选项
- **THEN** 题数和得分只增加一次，不会提前记录完成

### Requirement: 探索图示与解一致
探索 SHALL 在不存在整数解时说明原因并避免绘制暗示有效解的动物组合；存在整数解时图示数量 SHALL 与计算结果一致。

#### Scenario: 奇数脚数
- **WHEN** 头数为十且脚数为三十一
- **THEN** 页面说明无整数解，且不显示鸡兔组合图
