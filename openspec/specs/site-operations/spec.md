# site-operations Specification

## Purpose
规范面向学习者的独立公开站点目标、自动化质量门禁、唯一可追溯的静态发布流程、线上版本验证与运维责任边界。

## Requirements

### Requirement: 项目明确独立站点和专业运营目标
项目文档 SHALL 将独立公开学习站、可验证发布和持续维护作为目标，并记录当前状态和分阶段验收。

#### Scenario: 制定发布计划
- **WHEN** 维护者准备公开站点
- **THEN** 可查阅发布产物、质量检查、上线验证、回退和域名迁移的实施计划，并能区分目标与已实现状态

### Requirement: 主分支发布须经质量门禁
项目 SHALL 配置仅在主分支推送或手动运行且完整检查成功后构建发布包和执行 Pages 部署的工作流。

#### Scenario: 拉取请求检查
- **WHEN** 拉取请求触发检查
- **THEN** 检查运行但不构建或部署公开站点

#### Scenario: 主分支检查失败
- **WHEN** 主分支提交的检查失败
- **THEN** 发布包构建和部署不运行

#### Scenario: 过时提交不得部署
- **WHEN** 较新的主分支提交已成为当前版本，而较早提交仍在检查或等待发布
- **THEN** 较早提交 SHALL 跳过构建或部署，不得覆盖当前版本

### Requirement: Pages deployment uses one verified static publisher
The project SHALL use exactly one automatic GitHub Pages deployment workflow, and that workflow SHALL publish only a static artifact built after project checks and verified against its source revision.

#### Scenario: Main branch update is published
- **WHEN** a current `main` commit passes the project checks and release provenance validation
- **THEN** the sole Pages workflow SHALL deploy the generated static artifact and verify the deployed revision and representative learning paths

#### Scenario: A second Pages publisher is introduced
- **WHEN** another workflow is configured to deploy to GitHub Pages
- **THEN** the static validation SHALL fail before the repository accepts that configuration

### Requirement: 完整质量门禁具有充分的运行窗口

唯一 Pages 工作流实际执行 core 检查及 desktop/mobile 功能回归的重载 job SHALL 各自配置显式且不少于 25 分钟的运行上限，以完整执行静态、两项目浏览器、全站冒烟和发布包检查。稳定的 `checks` 汇总 job SHALL 显式配置一至五分钟上限并仅在全部必需上游成功时通过。任一检查超时、取消、跳过或失败时，发布 SHALL 保持失败或未验证状态，后续构建和部署 SHALL 不得运行。

#### Scenario: 完整检查在运行窗口内完成
- **WHEN** 主分支提交的全部质量门禁在配置上限内通过
- **THEN** 汇总 checks 成功，工作流继续构建和发布核验对应提交的静态站点

#### Scenario: 检查运行超过上限
- **WHEN** 任一重载检查 job 超时、取消、跳过或任一检查失败
- **THEN** 汇总明确失败，工作流不进入发布构建或部署，并保留未通过或未完成的状态
