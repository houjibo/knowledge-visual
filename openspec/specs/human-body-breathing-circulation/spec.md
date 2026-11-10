# human-body-breathing-circulation Specification

## Purpose
本规格规范呼吸示意与阶段一致；血液循环示意区分肺和全身，核心边界为：页面必须使肺在吸气示意中扩张、呼气示意中缩小，并提供暂停、分步和文字状态。

## Requirements

### Requirement: 呼吸示意与阶段一致
页面 SHALL 使肺在吸气示意中扩张、呼气示意中缩小，并提供暂停、分步和文字状态。

#### Scenario: 推进到呼气
- **WHEN** 学习者将呼吸示意推进到呼气阶段
- **THEN** 状态提示呼气且肺部图形按阶段逐渐缩小

### Requirement: 血液循环示意区分肺和全身
页面 SHALL 表示心脏、肺和全身之间的循环方向，并说明颜色与比例为示意。

#### Scenario: 查看循环
- **WHEN** 学习者选择血液循环
- **THEN** 画面与文字体现心脏到肺再返回及心脏到全身再返回的方向
