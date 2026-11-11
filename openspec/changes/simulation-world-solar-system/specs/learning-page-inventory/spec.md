## MODIFIED Requirements

### Requirement: 从站点路径静态盘点页面

静态页面库存 MUST 按站点路径确定页面类别、内容分类、学段、控件信号和静态可达性；无法推断的学段 SHALL 为 null。`simulation-world/` 目录页 MUST 识别为导航页，目录中的太阳系模拟 MUST 识别为 `topic`，`subject` 为 `simulation-world` 且 `stage` 为 null。盘点结果不得把静态标记当成功能验收。

#### Scenario: 盘点模拟世界

- **WHEN** 重新生成页面库存
- **THEN** `simulation-world/index.html` 与 `simulation-world/solar-system.html` 被分别分类为导航页和无学段主题页，且主题从首页静态链接可达
