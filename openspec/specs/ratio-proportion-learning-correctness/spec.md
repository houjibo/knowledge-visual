# ratio-proportion-learning-correctness Specification

## Purpose
确保小学数学比与比例的图示与数量一致，随机出题在重复随机值下仍能完成，比例尺题目使用正确的长度单位，并避免重复提交改变挑战成绩。

## Requirements

### Requirement: 比的图示与数量一致且出题可终止
比的演示 SHALL 显示与标注数量相同的物体，生成不同数量时 SHALL 不依赖随机数必然变化。

#### Scenario: 重复随机值
- **WHEN** 随机数持续相同
- **THEN** 页面正常载入且两组图标数量分别与各自标注一致

### Requirement: 挑战答案和计数可靠
挑战 SHALL 生成四个不同选项，比例尺题按厘米转米计算，选项支持键盘，单题只能计分一次。

#### Scenario: 比例尺换算
- **WHEN** 比例尺为 1:100 且图上距离为 2 cm
- **THEN** 正确答案为 2 m，解释说明单位换算

#### Scenario: 重复提交
- **WHEN** 学习者连续多次选择同一题的正确选项
- **THEN** 仅记录一次答对
