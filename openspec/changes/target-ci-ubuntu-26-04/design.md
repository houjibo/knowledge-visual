## Context

见 proposal.md - Why。`.github/workflows/checks.yml` 的四个 job 均使用 `ubuntu-latest`。检查链依赖系统 Python、Node.js 22、Playwright 浏览器及 `--with-deps` 安装的系统库；构建、部署也必须在 GitHub-hosted runner 上运行。GitHub 官方已宣布 Ubuntu 26.04 可用于生产，并提供显式 `ubuntu-26.04` 标签；`ubuntu-latest` 的迁移分阶段进行至 2026-11-19。

## Goals / Non-Goals

**Goals:**

- 在所有工作流 job 中显式选择 Ubuntu 26.04 LTS，使检查、产物构建和发布验证使用一致的大版本。
- 通过完整 GitHub Actions 工作流证明脚本、依赖安装、Playwright 与 Pages 发布均适配新镜像。

**Non-Goals:**

- 不固定 GitHub-hosted image 的具体补丁/构建号；`ubuntu-26.04` 仍会接收该 LTS 镜像维护更新。
- 不改变 Node.js 22 的应用测试运行时、npm 依赖、Playwright 版本或站点行为。
- 不为旧 Ubuntu 24.04 保留矩阵，也不引入额外 runner/服务。

## Decisions

1. **四个 job 全部从 `ubuntu-latest` 切到 `ubuntu-26.04`。** 只改检查 job 会导致构建、部署和部署后验收继续受到别名迁移影响；全链统一显式标签才能验证用户最终会经历的完整发布。官方确认 Ubuntu 26.04 已 GA，且可直接用 `ubuntu-26.04` 选择；公告说明 `ubuntu-latest` 迁移至 11 月 19 日完成。参考：[Ubuntu 26 GA 公告](https://github.com/actions/runner-images/issues/14747)、[`ubuntu-latest` 迁移计划](https://github.com/actions/runner-images/issues/14748)。
2. **现在验证目标镜像，不固定在 Ubuntu 24.04。** 固定 24.04 能保留近期已知环境，但会延后迁移且无法证明目标 26.04 可用；当前使用正式 GA 的 26.04 标签并执行完整工作流，可以提前暴露 Python、apt/Playwright 系统依赖和发布 Action 的兼容问题。
3. **保持步骤与应用运行时不变。** 让全量静态、浏览器、加载冒烟和部署后验证维持原门槛，避免把镜像迁移与测试范围变化混在一起。

## Risks / Trade-offs

- [Ubuntu 26.04 的 Python、apt 包或系统库变化可能使当前验证链失败] → 以完整 GitHub Actions 失败证据定位并修复兼容点；只有出现无法合理修复的阻断时才临时回退到 `ubuntu-24.04`。
- [显式 LTS 标签仍随上游更新补丁镜像] → 本次控制操作系统大版本漂移，后续依赖更新仍由 CI 回归捕获。

## Migration Plan

将四个 `runs-on` 标签改为 `ubuntu-26.04`，本地运行静态/OpenSpec 校验并推送。确认检查、发布构建、部署、部署后资源和浏览器验收全部成功，且 release manifest revision 匹配当前提交。若失败，按首个失败步骤修复并重跑；必要时短期回退至明确的 `ubuntu-24.04` 标签。
