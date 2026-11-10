# published-release-verification Specification

## Purpose
TBD - created by archiving change published-release-verification. Update Purpose after archive.

## Requirements

### Requirement: 部署后核对公开版本和资源
发布后检查 SHALL 核对公网清单所记录的提交和未修改状态，并检查首页、目录资源及四学科代表主题。

#### Scenario: 版本过旧或资源错误
- **WHEN** 公网返回旧版本、缺失资源或不符合预期的主题内容
- **THEN** 检查有限重试后失败，不报告验证通过

### Requirement: 公网代表路径通过浏览器验证
部署完成后流水线 SHALL 在桌面与窄屏浏览器运行代表学习路径并保留失败诊断。

#### Scenario: 已部署版本可用
- **WHEN** 公网版本匹配且首页至四学科的代表交互通过
- **THEN** 部署后检查成功，并记录对应工作流提交

### Requirement: 公网核验覆盖计算机与人工智能
发布后检查 SHALL 在版本清单匹配当前提交时，验证计算机与人工智能学科入口、可检索主题及至少一个核心交互主题能够从公网完成操作。

#### Scenario: 核验已发布 AI 交互
- **WHEN** GitHub Pages 部署当前提交且新学科资源可访问
- **THEN** 部署后浏览器测试可从首页搜索进入新主题、执行核心操作并收到反馈
