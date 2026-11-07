# ci-failure-diagnostics Specification

## Purpose
TBD - created by archiving change improve-ci-failure-diagnostics. Update Purpose after archive.

## Requirements

### Requirement: 远端浏览器失败可定位

GitHub Actions 的浏览器测试 SHALL 保留列表报告，并为失败测试输出包含测试位置和错误信息的 GitHub 检查注释。

#### Scenario: 浏览器断言失败

- **WHEN** GitHub Actions 中的浏览器断言失败
- **THEN** 报告器输出 GitHub 错误注释，包含失败测试位置及错误描述，并且测试命令以非零状态退出

#### Scenario: 本地测试

- **WHEN** 在 GitHub Actions 以外运行浏览器测试
- **THEN** 继续使用列表报告，不输出 GitHub 工作流命令
