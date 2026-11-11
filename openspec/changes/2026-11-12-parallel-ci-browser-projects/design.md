## Context

原 checks job 将四层质量检查串在单一步骤中，发布依赖稳定的 checks 状态。#253 的运行窗口为 16分45秒，综合检查步骤为14分56秒；该元数据不含排队，也无法进一步归因。用户要求小步、快速推送，同时完整功能和发布验证不能被削减。

## Goals / Non-Goals

缩短完整质量反馈的关键路径，显示各层状态并保持原测试集合与发布保护。当前切片不更改顶层并发、浏览器项目或功能测试清单，不通过增加跳过、重试或忽略失败提速。

## Decisions

- core-checks 运行静态、真实清单等价、开发站全页及完整发布包检查；browser-interactions 用固定 desktop/mobile 矩阵复用同一 package 入口，各自保留 CI 两 worker、30分钟上限和独立失败产物，fail-fast:false。
- checks 仅直接依赖两组结果，if always、两分钟上限，无 checkout。实际内联 shell 严格检查两值为 success；真值表执行工作流中的真实脚本，覆盖失败、取消、跳过、空与缺失，不维护一个仅供测试的副本。
- build-release 继续只依赖 checks，主分支/事件及两次 main 校验、来源校验、部署权限和后置核验保持现有结构。矩阵任何未成功状态都不能越过汇总。
- 收集完整与两个项目的 JSON 清单，按项目、相对文件、行列和完整标题比较多重集合。清单不启动学习操作，必须同时执行既有全量浏览器检查以验证运行结果和原有两项桌面跳过原因。
- 本地完整 check 增加轻量清单预检；保留 test:browser 的显式唯一文件列表供交互证据检查使用。
- 发布守卫继续不引入第三方 YAML 运行依赖：明确约束仓库采用的固定 job/命令结构，以变异回归拒绝漏项、条件跳过与失败容忍；它不是通用 YAML 解释器，GitHub 的实际展开与执行仍须核验。

## References

[GitHub 工作流语法](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax)、[needs 结果](https://docs.github.com/en/actions/reference/workflows-and-actions/contexts#needs-context)、[always 与取消](https://docs.github.com/en/actions/reference/workflows-and-actions/expressions#always)及[Playwright CLI](https://playwright.dev/docs/test-cli)支持矩阵、直接依赖结果和按项目收集。always 只负责执行判定，不意味着成功；取消整条流水线不能凭一个绿色子任务宣称发布完成。

## Risks / Trade-offs

三个检查 VM 增加安装总量，提速取决于实际并发资源与各项目耗时。固定矩阵需与 Playwright 配置同步，真实清单守卫发现新项目遗漏。状态真值表不能模拟 GitHub 的完整取消调度；没有平台故障注入证据时如实标注。保留当前发布串行策略，避免把检查拆分与发布/核验竞态同时改动。

## Validation

通过配置变异测试、实际汇总脚本状态组合、清单正常/缺失/额外/重复/新项目/错误报告单元测试及当前真实清单比较。运行本地完整 check；推送后记录矩阵两项目、core、checks 与完整发布结果和公开 revision。至少三轮记录覆盖指纹和时长，再判断25%关键路径改善目标；未达到或不可比时继续保留速度差距。
