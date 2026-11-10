# surface-area-learning-completion Specification

## Purpose
本规格规范表面积计算题只计分一次；学习进度按不同活动保存，核心边界为：页面必须对每道计算题首次有效提交计分，并保留反馈直到学习者主动换题。

## Requirements

### Requirement: 表面积计算题只计分一次
页面 SHALL 对每道计算题首次有效提交计分，并保留反馈直到学习者主动换题。

#### Scenario: 重复提交或非整数
- **WHEN** 学习者重复提交已回答的题目或输入非整数
- **THEN** 得分不重复增加，非整数不计分

### Requirement: 学习进度按不同活动保存
页面 SHALL 在切换展开图、答对三道计算题及三道不同应用题后保存主题完成记录。

#### Scenario: 重复同一应用题
- **WHEN** 学习者多次答对同一道应用题
- **THEN** 此题在完成条件中只计算一次

#### Scenario: 保存失败恢复
- **WHEN** 全部达标但存储暂时失败
- **THEN** 页面提示未保存，并允许恢复存储后重试
