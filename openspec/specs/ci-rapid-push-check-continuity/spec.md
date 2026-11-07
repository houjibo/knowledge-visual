# ci-rapid-push-check-continuity Specification

## Purpose
让快速小步推送时正在运行的持续集成检查能够完成，同时避免检查期间被后续提交取代的版本进入公开发布流程。

## Requirements

### Requirement: 保留运行中的检查
同一分支新运行 SHALL 不取消已运行的检查；等待队列 MAY 用新的运行取代之前等待的运行。

#### Scenario: 连续推送
- **WHEN** 同分支检查运行中又收到新推送
- **THEN** 当前检查继续，最新等待运行可在其后执行

### Requirement: 仅允许当前版本进入发布
成功检查后，发布流程 SHALL 在构建前核对远端 main，过时提交跳过发布，获取远端失败则失败；部署前 SHALL 再次核对当前提交。

#### Scenario: 检查中出现新提交
- **WHEN** 检查完成时远端 main 已不再指向本次提交
- **THEN** 本次运行跳过发布构建和部署

#### Scenario: 无法确认远端
- **WHEN** 获取远端 main 失败
- **THEN** 发布门禁失败，不允许发布
