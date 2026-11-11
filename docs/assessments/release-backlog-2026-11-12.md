# 发布队列与平台恢复核查

本记录区分仓库质量检查、GitHub调度和公开部署；时间均为2026-11-11 UTC，对应本地11月12日。

## 当前发布已恢复

最新main提交 `a18061841c2b1b58aae5fb052c5a7e51cf81645d` 的 [Actions #262](https://github.com/houjibo/knowledge-visual/actions/runs/43103626270) 已完成：core、两matrix、checks、构建、部署和部署后核验七个job全部成功。运行于21:30:23创建，三个质量job于21:30:25开始；Pages于21:38:19完成，最后核验于21:39:00成功。当前版本已通过既有完整门禁完成自动发布，原排队异常不再阻塞最新目标版本。

公开实际执行注释为 [desktop 947通过/2跳过](https://api.github.com/repos/houjibo/knowledge-visual/check-runs/130801166425/annotations)、[mobile 949通过](https://api.github.com/repos/houjibo/knowledge-visual/check-runs/130801166540/annotations)，合计1896通过/2跳过；[core摘要](https://api.github.com/repos/houjibo/knowledge-visual/check-runs/130801167036/annotations)确认开发站363页、发布路径8项、发布包363页通过。直接读取[公开清单](https://houjibo.github.io/knowledge-visual/release-version.json?verify=a18061841c2b1b58aae5fb052c5a7e51cf81645d)为HTTP200、revision精确匹配该提交且 `site_files_modified:false`；工业HTML、模型和控制器均HTTP200并与提交逐字节相同，详见[工业资源核验](assembly-line-2026-11-12.md)。工业44/20秒批次对照及条件六步、目录3/3的公开人工验收已通过，相关变更已归档。

本轮不延用旧性能组的同量结论：当前949+949清单包含工业与条件主题，与早期922+922负载不同。此前排队时间继续保留为运营历史，工作阶段耗时不能代替包含排队的端到端等待。

## 历史运行快照

| 运行 | ref与提交 | 截至21:22:24的状态 | 执行/发布证据 |
| --- | --- | --- | --- |
| [#258](https://github.com/houjibo/knowledge-visual/actions/runs/43095587329) | main / d183397 | queued、jobs为空，20:21:50创建 | 尚无测试执行或失败证据 |
| [#259](https://github.com/houjibo/knowledge-visual/actions/runs/43097263476) | main / cce508d | queued、jobs为空，20:38:35创建 | 尚无测试执行或失败证据 |
| [#260](https://github.com/houjibo/knowledge-visual/actions/runs/43100973643) | codex/primary-condition-branches / d8186ef | completed/success，21:21:07完成 | 功能1896通过/2跳过、core363/8/363通过；三个发布job按非main条件跳过 |

截至表中核查时，前两次main运行沿用已有句柄持续观察；#259来自记录真实排队异常的两文件文档提交，该快照之前没有再次触发main。#260是独立课程功能分支的实际交付，并发组与main不同；它能执行不能单独证明main锁的具体原因。后续正常功能集成对应 #262 的发布结果记录在本页当前状态中。

## 平台证据与结论边界

[GitHub官方事件](https://stspg.io/jdjlq5zjyl48) `dvy0t3mvh1lg`于20:48:12公布多产品故障，涉及Actions、Pages等。21:07:24–26进入恢复监控，官方明确积压Actions任务正在处理。随后加no-cache与新查询参数直接读取[官方摘要API](https://www.githubstatus.com/api/v2/summary.json)时，Actions/Pages组件为operational、事件为monitoring；这里保留该次读取的历史状态，不把此前缓存中的major_outage当作当前状态。

#258/#259在事件公布前已等待，因此该事件不能证明全部初始延迟的原因。公开页面没有给出具体锁持有者；active列表的总数和明细也曾不一致，不能只凭单次列表宣称没有其他运行。

仓库文件和workflows API只显示一个有效工作流。#257–#260对应的checks.yml Git blob均为`adc7fc83bd0359f1341005bbfb27c3c23bd98d2d`，没有提交间配置差异或第二workflow的同组冲突证据。并发配置仍为按ref分组、cancel-in-progress:false。[官方并发说明](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency)中的pending与REST queued需区分；两项queued本身不能证明占了两个pending槽。

在21:22:24历史核查附近，分支质量完成后读取的公开release-version.json为`18ef7b479a213140ff3e62ad2c6e39886ddbd3d0`且site_files_modified:false，当时尚未满足新场景目标版本；当前已更新为本页记录的a180618版本。

本次调查没有取得足以支持修改并发配置的仓库缺陷证据。串行发布、main头校验、来源核验和完整质量门禁均保留，最新main已正常完成该发布链。公开验收继续以目标revision、实际资源及场景操作为依据，独立分支的质量成功或条件跳过发布分别记录。

条件主题通过完整本地与独立分支远端质量检查后，按正常功能交付快速前进合入main；随后 #262 沿用原质量门禁完成自动部署与公开版本、资源验证，人工操作记录亦已完成。
