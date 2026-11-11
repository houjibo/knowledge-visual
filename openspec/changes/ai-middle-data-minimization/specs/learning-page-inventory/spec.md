## ADDED Requirements

### Requirement: 盘点初中人工智能信息最小化主题

静态页面库存 SHALL 将新增的信息最小化实验分类为 `topic`，内容分类为 `ai`，学段为 `middle`，并可从首页的静态导航链路到达；库存只表示静态盘点，不表示交互已验证。

#### Scenario: 重新生成信息最小化页面库存
- **WHEN** 维护者重新生成页面库存
- **THEN** `ai/middle/data-minimization.html` 被列为初中人工智能主题，且静态可达状态与首页/目录链接一致
