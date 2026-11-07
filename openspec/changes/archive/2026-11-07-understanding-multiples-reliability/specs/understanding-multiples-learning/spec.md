## ADDED Requirements

### Requirement: 题目可靠生成且摆放与输入一致
页面 SHALL 在固定随机值下正常初始化，摆放图形数量 SHALL 与有效倍数输入一致。

#### Scenario: 超出摆放范围
- **WHEN** 输入使数量超过上限的倍数
- **THEN** 提示允许范围且不静默改变图示为另一倍数

### Requirement: 每题只计一次
摆放、挑战和应用题 SHALL 阻止对已完成题目重复计分。

#### Scenario: 八次独立作答
- **WHEN** 学习者答对七次独立作答并重复提交同一题
- **THEN** 不记录完成；答对第八次独立作答后记录完成
