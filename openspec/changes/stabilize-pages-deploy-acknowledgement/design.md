## Context

见 [proposal.md](proposal.md)。#207 的 Pages 部署从 job 开始到成功约 7 分 40 秒；#208 的 `deploy` job 运行约 10 分钟后被取消，deployment 状态转为 `error`，而同一提交已出现在公网清单。直接核验随后确认该提交及 6 个资源可访问。Actions job 日志接口当前返回 403，因此不能据此断言唯一根因；本变更以增加有界等待做一次可证伪的运行改进。

## Goals / Non-Goals

**Goals:**

- 将 deployment job 等待上限增加至 20 分钟，并用自动检查防止其回落到过短的窗口。
- 保留 `verify-deployment` 对成功部署的依赖和现有版本、资源、浏览器验收，不弱化发布标准。
- 通过下一次完整 Actions 运行观察状态确认时间是否改善。

**Non-Goals:**

- 不绕过 GitHub Pages deployment 状态，不把公网内容已可访问当作自动 job 成功的替代证据。
- 不引入 token、第三方发布服务、额外依赖或重试整个发布的后台任务。
- 不改变静态发布包内容、用户页面或本地学习进度。

## Decisions

- **提高 job 的有限超时，而非移除上限。** [GitHub 官方工作流语法](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax)允许配置 job 的最大运行分钟数；无上限可能长期占用 runner。20 分钟给部署状态传播留出比 #208 多一倍的窗口，同时仍保留失败边界。
- **由静态守卫检查 deploy job 专属配置。** 检查器解析 `deploy:` 区块内的 `timeout-minutes` 并要求至少 15 分钟，避免只在 YAML 其他位置出现数值就误通过；测试覆盖低于阈值、缺失和合规配置。
- **发布仍 fail closed。** 不加 `continue-on-error`，`verify-deployment` 继续依赖 `deploy` 成功；部署状态未终结或部署后核验失败时，流水线不报告自动发布完成。
- **观察后再决定是否需更深层修复。** 下一次 Pages 运行作为验收实验；若 20 分钟内仍失败，保留状态与时间证据，继续诊断 GitHub Pages 状态/API，而不是再扩大超时。

## Risks / Trade-offs

- [GitHub Pages 状态传播异常超过 20 分钟] → job 仍以失败/取消结束；保留部署状态和公网清单证据，进一步诊断平台确认链路。
- [较长超时使真实失败更晚暴露] → 仅增大 deploy job 上限，不改变检查、构建和部署后核验；本地用户继续看到当前线上版本。

## Migration Plan

修改工作流超时和守卫测试，运行发布者专项及静态门禁，再推送观察完整 Actions。若 deploy 与 verify 均成功且公网清单匹配当前提交，归档变更；若失败，保持 OpenSpec change 活跃并据新证据调整设计。
