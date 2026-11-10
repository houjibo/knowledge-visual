# time-units-practice-reliability Specification

## Purpose
本规格规范时分秒练习有限生成；换算和计分可持续操作；挑战选项可判断，核心边界为：页面必须在随机值持续重复时完成初始化，并生成足够数量的不同选项。

## Requirements

### Requirement: 时分秒练习有限生成
页面 SHALL 在随机值持续重复时完成初始化，并生成足够数量的不同选项。

#### Scenario: 重复随机值
- **WHEN** 随机值持续相同
- **THEN** 经过时间题、排序题及挑战题仍可生成且候选不同

### Requirement: 换算和计分可持续操作
换算题 SHALL 在各种题型间切换，每题 SHALL 最多计分一次，答题后由学习者主动换题。

#### Scenario: 混合单位后继续
- **WHEN** 学习者从分秒混合换算切换到普通单位换算
- **THEN** 页面显示新的输入行并可继续答题

#### Scenario: 重复提交
- **WHEN** 学习者重复提交同一道题
- **THEN** 分数与挑战结果不重复增加

### Requirement: 挑战选项可判断
四类挑战 SHALL 提供四个不同选项且比较题只有一个正确的关系。

#### Scenario: 比较时长
- **WHEN** 学习者查看比较题
- **THEN** 四个关系中恰有一个成立
