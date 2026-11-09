# length-comparison-reliability Specification

## Purpose
确保小学长度比较练习能在随机值重复时有限生成题目，比较对象长度不同，并让线段图示、题意、正确选项与答题反馈始终保持一致。

## Requirements

### Requirement: 长度比较题有限生成且答案一致

长度比较练习 MUST 在有限步骤内呈现两件长度不同的物品，且 SHALL 将较长物品对应的一侧作为正确答案。生成过程 MUST 在随机值重复时仍能完成。

#### Scenario: 随机值使初始物品长度相同
- **WHEN** 换题时随机排列得到长度相同的两件物品，后续随机值持续重复
- **THEN** 页面 SHALL 在有限步骤内选出长度不同的比较对象，并显示与画面线段长度一致的正确侧

#### Scenario: 答对长度比较题
- **WHEN** 学习者选择线段较长的一侧
- **THEN** 页面 SHALL 显示答对反馈并只记录一次正确作答
