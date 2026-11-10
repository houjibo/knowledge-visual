## ADDED Requirements

### Requirement: 部署确认具有充分的有界等待窗口

唯一 Pages 发布流水线 SHALL 为 deployment job 配置不少于 15 分钟的显式运行上限；该上限内仍未获得成功终态时，发布 SHALL 保持失败或未验证状态，不得跳过部署后门禁并报告发布成功。

#### Scenario: 部署确认在等待窗口内成功

- **WHEN** Pages deployment 在配置的有界窗口内进入成功终态
- **THEN** 流水线继续执行版本清单、资源和浏览器核验，全部通过后才报告发布成功

#### Scenario: 部署确认超出有界窗口或报错

- **WHEN** Pages deployment 超时、被取消或进入错误终态
- **THEN** 自动发布保持失败或未验证状态，保留流水线诊断，且不得把公网可访问单独视为自动门禁通过
