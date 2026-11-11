# 按浏览器项目并行质量检查

## 依据与切片范围

用户要求小步更新、快速推送并保持质量。原工作流在一个 checks job 中串行执行全部检查；[Actions #253](https://github.com/houjibo/knowledge-visual/actions/runs/43074410325) 综合检查步骤耗时 14分56秒。本轮将完整质量工作拆为 core-checks 与 desktop/mobile 功能矩阵，保留名为 checks 的严格汇总及原发布链。

core 无条件执行静态、真实清单等价、开发站全页与完整发布包检查。矩阵调用同一 `test:browser` 文件清单，仅追加项目选择，保留两 worker、30分钟上限及 fail-fast:false。汇总无需获取源码，仅在两个直接依赖结果均为 success 时通过；失败、取消、跳过、缺失或未知值均失败。

## 清单与失败边界

真实 Playwright 1.65.0 JSON 收集比较已通过：desktop 922、mobile 922，合计 1844。按项目、仓库相对文件、行列和完整标题数组构建多重集合，指纹为：

`bf589a466660b46b921e98e4ea95a44b26ee3f314be2237227ff547fdcfdf624`

与 `e312dbe` 比较，`test:browser` 入口、全部浏览器测试文件和项目配置逐字一致。本轮新增脚本只收集清单，既不启动学习操作也不证明运行时跳过数量；完整浏览器执行仍是独立门禁。`--list` JSON 将收集项标作 skipped，不能把这些字段当作实际执行跳过。

- 清单比较纯单元 15/15，通过同数量换用例、重复次数不同、缺失/额外/新空项目、错项目选择、收集失败、空或异常报告等回归。
- 发布配置回归 22 项通过，含矩阵漏项、条件跳过、失败容忍、依赖和结果绑定、超时、第二发布器及引号形式、当前 main/来源/后置核验等变异。
- 从实际工作流提取汇总 shell 执行 49 种状态组合，只有 success/success 返回零；另检查结果诊断输出。
- 独立审查曾确认发布链默认 shell、来源步骤自定义 shell、非部署 job 权限覆盖可被本轮初版守卫接受，已补拒绝与回归。固定结构守卫不是通用 YAML 解释器，也不证明 GitHub 的完整失败/取消调度已经实测。
- 完整 `npm run check` 通过：严格 OpenSpec 249 项、真实清单等价、功能回归 1842 通过及原有两项移动专属测试在桌面跳过、开发站及发布包各 361 页、发布包交互专项 6 项。
- 设置 `CI=true GITHUB_ACTIONS=true` 再运行真实清单预检仍为 922+922=1844，指纹一致，验证 JSON reporter 覆盖可与 CI 环境变量一起工作。
- 新流水线 [Actions #255](https://github.com/houjibo/knowledge-visual/actions/runs/43088530584) 与 [#256](https://github.com/houjibo/knowledge-visual/actions/runs/43091507869) 已完成：两轮的 core、两个功能矩阵、汇总、构建、部署与后置核验均全部成功。本地脚本真值表仍不等于平台所有取消路径已实测。

## 首轮远端运行与发布证据

2026-11-12 核查 [#255 jobs API](https://api.github.com/repos/houjibo/knowledge-visual/actions/runs/43088530584/jobs?per_page=100)：七个 job 均为 `completed/success`，源码 revision 均为 `e0e3c4ab66ca09208df72d876ccb28e4dc62f617`。core 与 desktop/mobile 于 UTC 19:34:56–57 同时启动，证明此次矩阵实际并行展开；随后 checks、构建、部署与后置核验按依赖顺序完成。

实际执行结果来自 GitHub 的 `🎭 Playwright Run Summary` 公开注释：

| 运行范围 | 实际结果 | 依据 |
| --- | --- | --- |
| desktop 功能回归 | 920 通过、2 跳过 | [desktop 运行注释](https://api.github.com/repos/houjibo/knowledge-visual/check-runs/130759144591/annotations) |
| mobile 功能回归 | 922 通过、0 跳过 | [mobile 运行注释](https://api.github.com/repos/houjibo/knowledge-visual/check-runs/130759144300/annotations) |
| 开发站全部页面 | 361 通过 | [core 运行注释](https://api.github.com/repos/houjibo/knowledge-visual/check-runs/130759143942/annotations) |
| 发布包代表交互 | 6 通过 | 同一 core 运行注释 |
| 发布包全部页面 | 361 通过 | 同一 core 运行注释 |

功能回归合计 1842 通过、2 跳过；与 [#254 实际运行注释](https://api.github.com/repos/houjibo/knowledge-visual/check-runs/130736370520/annotations) 的功能及三组发布检查数量一致。这些数字来自执行后的报告，不来自 `--list`；清单身份等价另由前述多重集合与指纹证据证明。公开 job 日志下载 API 需仓库管理权限而返回 403，公开运行注释可读取；注释未提供逐例跳过名称。

部署后核验 job 成功，且已直接读取[公网版本清单](https://houjibo.github.io/knowledge-visual/release-version.json?verify=e0e3c4ab66ca09208df72d876ccb28e4dc62f617)：`schema_version:1`、`revision:e0e3c4ab66ca09208df72d876ccb28e4dc62f617`、`site_files_modified:false`，与本轮源码匹配。本证据完成首次实际展开与发布核验；平台失败或取消后的完整调度仍未做故障注入。

## 第二轮远端运行与发布证据

[#256 jobs API](https://api.github.com/repos/houjibo/knowledge-visual/actions/runs/43091507869/jobs?per_page=100) 已确认七个 job 均为 `completed/success`，源码 revision 均为 `a7fc640019e78ee7f29569bfa47e60f51d3be2a1`。该提交相对 #255 的 `e0e3c4a` 只修改四个文档；以两个提交对象比较，功能源码、`test:browser` 清单、测试文件、项目配置和工作流均未变化，因此沿用本记录的 `bf589a466660b46b921e98e4ea95a44b26ee3f314be2237227ff547fdcfdf624` 清单指纹。此判断不使用随后工业流水线开发中的工作区清单。

公开执行注释为 [mobile 922通过](https://api.github.com/repos/houjibo/knowledge-visual/check-runs/130769465451/annotations)、[desktop 920通过/2跳过](https://api.github.com/repos/houjibo/knowledge-visual/check-runs/130769465509/annotations)，以及 [core 的开发站361页、发布交互6项、发布包361页通过](https://api.github.com/repos/houjibo/knowledge-visual/check-runs/130769465033/annotations)，与 #255 和串行基线的实际执行数量一致。已直接读取[公网版本清单](https://houjibo.github.io/knowledge-visual/release-version.json?verify=a7fc640019e78ee7f29569bfa47e60f51d3be2a1)，revision 匹配 `a7fc640019e78ee7f29569bfa47e60f51d3be2a1` 且 `site_files_modified:false`。

## 性能观察

下表来自实际 job/step 的时间字段。“工作阶段窗口”是首个 job 创建至最后 job 完成，不含顶层并发等待，不能作为 push 到上线总时间。#254 与当前功能清单一致，可用作本轮串行基线；#253 少于当前课程用例，仅保留作历史诊断。

| 运行 | 结构 | checks | 综合检查步骤 | 构建 | 部署 | 后置核验 | 工作阶段窗口 |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| [#253](https://github.com/houjibo/knowledge-visual/actions/runs/43074410325) | 原串行 | 15分32秒 | 14分56秒 | 7秒 | 14秒 | 40秒 | 16分45秒 |
| [#254](https://github.com/houjibo/knowledge-visual/actions/runs/43081918106) | 原串行，同功能清单 | 14分50秒 | 14分21秒 | 10秒 | 13秒 | 43秒 | 16分06秒 |

新结构的第 1 个样本为 #255，以下时间均为 2026-11-11 UTC（本地日期为 2026-11-12）：

| job | 开始 | 完成 | 运行时长 | 主要步骤时长 |
| --- | --- | --- | ---: | --- |
| core-checks | 19:34:57 | 19:37:57 | 3分00秒 | 静态9秒、清单等价5秒、开发站全页66秒、完整发布包72秒 |
| browser-interactions (mobile) | 19:34:57 | 19:41:46 | 6分49秒 | 功能回归382秒、浏览器安装18秒 |
| browser-interactions (desktop) | 19:34:56 | 19:42:16 | 7分20秒 | 功能回归414秒、浏览器安装18秒 |
| checks | 19:42:21 | 19:42:23 | 2秒 | 汇总 shell 1秒 |
| build-release | 19:42:25 | 19:42:35 | 10秒 | 头校验0秒、配置1秒、构建1秒、来源校验0秒、上传2秒 |
| deploy | 19:42:39 | 19:42:54 | 15秒 | 头校验1秒、Pages 动作8秒 |
| verify-deployment | 19:42:57 | 19:43:35 | 38秒 | 浏览器安装19秒、revision/资源1秒、公网交互10秒 |

第 2 个样本为 #256，以下同为 2026-11-11 UTC：

| job | 开始 | 完成 | 运行时长 | 主要步骤时长 |
| --- | --- | --- | ---: | --- |
| core-checks | 19:54:24 | 19:57:18 | 2分54秒 | 静态9秒、清单等价5秒、开发站全页65秒、完整发布包70秒 |
| browser-interactions (mobile) | 19:54:24 | 20:01:17 | 6分53秒 | 功能回归383秒、浏览器安装21秒 |
| browser-interactions (desktop) | 19:54:24 | 20:01:37 | 7分13秒 | 功能回归406秒、浏览器安装16秒 |
| checks | 20:01:39 | 20:01:43 | 4秒 | 汇总 shell 0秒 |
| build-release | 20:01:45 | 20:01:56 | 11秒 | 头校验0秒、配置1秒、构建1秒、来源校验0秒、上传2秒 |
| deploy | 20:02:00 | 20:02:13 | 13秒 | 头校验1秒、Pages 动作8秒 |
| verify-deployment | 20:02:16 | 20:03:09 | 53秒 | 浏览器安装29秒、revision/资源4秒、公网交互10秒 |

步骤时间来自 API 的秒级时间字段，0秒表示同一秒内开始与完成；job 时长另含准备、检出、依赖及收尾，不等于表中主要步骤之和。

| 可比工作阶段窗口 | #254 串行基线 | #255 并行样本 1 | #256 并行样本 2 | 单轮减少比例（#255 / #256） |
| --- | ---: | ---: | ---: | ---: |
| 首个质量 job 启动至 checks 完成 | 890秒（14分50秒） | 447秒（7分27秒） | 439秒（7分19秒） | 49.8% / 50.7% |
| 首个 job 启动至最终核验完成 | 964秒（16分04秒） | 519秒（8分39秒） | 525秒（8分45秒） | 46.2% / 45.5% |
| 首个 job 创建至最终核验完成 | 966秒（16分06秒） | 520秒（8分40秒） | 527秒（8分47秒） | 46.2% / 45.4% |

#255、#256 首个 job 分别创建于 19:34:55、19:54:22 UTC；以上窗口均不含顶层工作流并发等待。两次并行运行的功能清单指纹相同，runner 资源和网络情况仍可能影响时长。目前完成 **2/3 个并行样本**，25% 关键路径改善实验尚未验收。后续随实际交付记录各阶段时长与覆盖指纹，工作量变化时分组并说明可比范围；新增工业流水线改变测试清单后应作为另一负载，不能直接充当本组第3个同量样本。至少三轮充分可比证据后再判断目标，首次运行成功与性能目标分别记录。

依据：[GitHub 工作流语法](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax)、[needs 结果](https://docs.github.com/en/actions/reference/workflows-and-actions/contexts#needs-context)、[Playwright CLI](https://playwright.dev/docs/test-cli)。范围与任务见 [OpenSpec](../../openspec/changes/2026-11-12-parallel-ci-browser-projects/README.md)。
