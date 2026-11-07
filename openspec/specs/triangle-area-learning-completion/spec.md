# triangle-area-learning-completion Specification

## Purpose
TBD - created by archiving change triangle-area-learning-completion. Update Purpose after archive.

## Requirements

### Requirement: 三角形面积的完成条件可见且可保存
页面 SHALL 跟踪探索图形或拼图、答对三道练习和答对一道生活题，全部达标后保存小学主题完成记录。

#### Scenario: 部分完成
- **WHEN** 学习者只完成部分条件
- **THEN** 页面显示剩余条件，不保存完成记录，并说明刷新会清空本次阶段进度

#### Scenario: 全部完成
- **WHEN** 学习者完成三项条件
- **THEN** 页面和知识地图显示完成，刷新后记录仍存在

### Requirement: 完成进度保存失败可恢复
页面 SHALL 区分达标和持久保存成功，并允许重试。

#### Scenario: 存储暂时失败
- **WHEN** 达标时写入失败，存储恢复后学习者重试
- **THEN** 页面先提示未保存，成功后显示完成且刷新恢复
