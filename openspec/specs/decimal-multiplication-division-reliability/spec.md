# decimal-multiplication-division-reliability Specification

## Purpose
确保小数乘除法的示例、输入和答案一致，使学习者能获得可靠的逐题反馈、可暂停的挑战和可恢复的主题完成记录。

## Requirements

### Requirement: 小数示例和输入正确
页面 SHALL 对乘法与除法示例显示正确运算符，接受数值相等的小数写法，并保留反馈至主动换题。

#### Scenario: 小数末尾零
- **WHEN** 正确答案是 0.2，学习者输入 0.20
- **THEN** 页面判为正确并保留反馈

### Requirement: 挑战与完成记录可靠
挑战 SHALL 使用有限选项，单题只计分一次，并在离开模式或页面隐藏时暂停；三类活动各答对一题后 SHALL 保存主题完成记录，失败可重试。

#### Scenario: 暂停与恢复
- **WHEN** 学习者暂时离开挑战并返回
- **THEN** 离开期间倒计时不减少，返回后继续
