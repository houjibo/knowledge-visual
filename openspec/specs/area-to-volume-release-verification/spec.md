# area-to-volume-release-verification Specification

## Purpose
TBD - created by archiving change area-to-volume-release-verification. Update Purpose after archive.

## Requirements

### Requirement: 面积到体积路线在发布子路径可用
发布验证 SHALL 检查从首页进入路线、依次访问五个主题、操作体积探索并返回路线。

#### Scenario: 发布包或部署站点子路径
- **WHEN** 运行发布浏览器检查
- **THEN** 相对链接保持在站点路径下，各主题可打开且代表交互可操作

### Requirement: 本地静态文件路径可导航
浏览器回归 SHALL 验证直接打开本地主题时相邻主题和返回路线链接。

#### Scenario: 本地文件入口
- **WHEN** 浏览器直接打开认识面积页面并导航
- **THEN** 可进入面积与周长并返回路线锚点
