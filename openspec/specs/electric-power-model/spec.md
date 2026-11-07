# electric-power-model Specification

## Purpose
TBD - created by archiving change electric-power-model-clarity. Update Purpose after archive.

## Requirements

### Requirement: 电功率模型显示准确的额定状态
模型 SHALL 使用明确的恒定电阻假设，并仅在实际电压等于 220 V 时显示额定电压状态；功率条 SHALL 标出 150% 满刻度。

#### Scenario: 调整电压
- **WHEN** 学习者选择 110 V、220 V 和 264 V
- **THEN** 显示 25 W、100 W 和 144 W，状态及比例尺与计算一致

### Requirement: 计算反馈不接受无效字符
计算题 SHALL 拒绝数字后附加的无效字符，并按题目要求判断数值。

#### Scenario: 输入格式不完整
- **WHEN** 学习者提交带字母后缀的电阻值
- **THEN** 页面显示提示而不是判为正确
