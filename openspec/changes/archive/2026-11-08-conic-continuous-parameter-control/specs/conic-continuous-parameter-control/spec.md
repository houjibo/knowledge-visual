## ADDED Requirements

### Requirement: 参数控件支持连续操作

圆锥曲线参数滑块 SHALL 有关联的可见名称，参数变化时 SHALL 保持原有滑块节点并同步更新图示和公式。

#### Scenario: 键盘连续调整

- **WHEN** 学习者聚焦滑块并连续按方向键
- **THEN** 滑块保留焦点，每次按键都更新数值和公式

#### Scenario: 连续拖拽

- **WHEN** 学习者连续拖动滑块
- **THEN** 同一个滑块接收输入，显示结果跟随最终值
