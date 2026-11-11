# 发布队列与平台恢复核查

本记录区分仓库质量检查、GitHub调度和公开部署；时间均为2026-11-11 UTC，对应本地11月12日。

## 已取得的运行证据

| 运行 | ref与提交 | 截至21:22:24的状态 | 执行/发布证据 |
| --- | --- | --- | --- |
| [#258](https://github.com/houjibo/knowledge-visual/actions/runs/43095587329) | main / d183397 | queued、jobs为空，20:21:50创建 | 尚无测试执行或失败证据 |
| [#259](https://github.com/houjibo/knowledge-visual/actions/runs/43097263476) | main / cce508d | queued、jobs为空，20:38:35创建 | 尚无测试执行或失败证据 |
| [#260](https://github.com/houjibo/knowledge-visual/actions/runs/43100973643) | codex/primary-condition-branches / d8186ef | completed/success，21:21:07完成 | 功能1896通过/2跳过、core363/8/363通过；三个发布job按非main条件跳过 |

前两次main运行沿用已有句柄持续观察；#259来自记录真实排队异常的两文件文档提交，之后没有再次触发main。#260是独立课程功能分支的实际交付，并发组与main不同；它能执行不能单独证明main锁的具体原因。

## 平台证据与结论边界

[GitHub官方事件](https://stspg.io/jdjlq5zjyl48) `dvy0t3mvh1lg`于20:48:12公布多产品故障，涉及Actions、Pages等。21:07:24–26进入恢复监控，官方明确积压Actions任务正在处理。加no-cache与新查询参数直接读取[官方摘要API](https://www.githubstatus.com/api/v2/summary.json)后，Actions/Pages组件已是operational，事件仍monitoring；不能沿用此前缓存中的major_outage作为当前状态。

#258/#259在事件公布前已等待，因此该事件不能证明全部初始延迟的原因。公开页面没有给出具体锁持有者；active列表的总数和明细也曾不一致，不能只凭单次列表宣称没有其他运行。

仓库文件和workflows API只显示一个有效工作流。#257–#260对应的checks.yml Git blob均为`adc7fc83bd0359f1341005bbfb27c3c23bd98d2d`，没有提交间配置差异或第二workflow的同组冲突证据。并发配置仍为按ref分组、cancel-in-progress:false。[官方并发说明](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency)中的pending与REST queued需区分；两项queued本身不能证明占了两个pending槽。

本次分支质量完成后再次直接读取公开release-version.json，仍为`18ef7b479a213140ff3e62ad2c6e39886ddbd3d0`且site_files_modified:false，尚未满足新场景目标版本的验收条件。

当前没有足以支持修改并发配置的仓库缺陷证据。保留串行发布、main头校验、来源核验和完整质量门禁，继续观察既有main运行。公开验收必须以目标revision、实际资源及场景操作为依据，不能把独立分支的质量成功或跳过发布当作上线。
