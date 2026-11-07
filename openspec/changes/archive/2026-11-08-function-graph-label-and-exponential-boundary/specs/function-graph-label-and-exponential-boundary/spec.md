## ADDED Requirements

### Requirement: 绘图公式和参数边界明确

函数图像探索 SHALL 显示实际绘制的公式，参数控件 SHALL 具有可识别名称；指数底数为 1 时 SHALL 显示常数函数的性质。

#### Scenario: 二次式零系数

- **WHEN** 选择 ax² 并将 a 调为 0
- **THEN** 显示零函数并与值域及图示一致

#### Scenario: 指数底数为一

- **WHEN** 选择 aˣ 并将 a 调为 1
- **THEN** 显示常数 1、值域 {1} 和偶函数，并说明不属于通常定义的指数函数
