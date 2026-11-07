# area-to-volume-resume-learning Specification

## Purpose
TBD - created by archiving change area-to-volume-resume-learning. Update Purpose after archive.

## Requirements

### Requirement: 学习路线支持继续未完成主题
路线 SHALL 根据已保存的主题记录显示完成数并建议第一个未完成的主题，不限制其他步骤的访问。

#### Scenario: 跳着完成主题
- **WHEN** 学习者完成非连续的路线主题
- **THEN** 完成数反映已完成主题，继续入口指向按路线顺序第一个未完成主题

#### Scenario: 全部完成或存储不可读
- **WHEN** 五个主题均已完成或进度无法读取
- **THEN** 页面分别显示完成总数或不可读取提示，不提供误导性的继续入口
