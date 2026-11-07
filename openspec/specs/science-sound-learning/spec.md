# science-sound-learning Specification

## Purpose
TBD - created by archiving change science-sound-learning. Update Purpose after archive.

## Requirements

### Requirement: 声音图示不伪装成实际测量
系统 SHALL 将未标定的频率与振幅标为示意档位，且将声速数据限定为具体材料与条件。

#### Scenario: 调整音调和响度
- **WHEN** 学习者调整频率或振幅
- **THEN** 波形相应变化，页面明确该数值并非实际赫兹或分贝

#### Scenario: 比较介质
- **WHEN** 学习者比较空气、淡水与钢铁
- **THEN** 页面说明数据为具体示例，真空不能传播声波，不能将速度顺序推广到所有材料

### Requirement: 交互及测验可重复使用
系统 SHALL 提供键盘操作和动画暂停，并按题保存本轮首次作答。

#### Scenario: 回看已答题目
- **WHEN** 学习者返回已作答的题目
- **THEN** 页面保留答案及反馈，不允许重复计分
