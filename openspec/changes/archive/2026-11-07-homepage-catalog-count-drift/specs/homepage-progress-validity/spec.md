## ADDED Requirements

### Requirement: 首页学科数量与主题目录一致
项目 SHALL 在静态检查中验证首页学科进度总数及数量徽标与主题目录一致。

#### Scenario: 主题数量变化但首页未更新
- **WHEN** 首页某学科进度总数或徽标与主题目录数量不同
- **THEN** 静态检查失败并指出不一致的学科
