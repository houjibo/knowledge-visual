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
- 新流水线的真实 Actions 与性能观察仍待推送后验证；本地脚本真值表不等于平台所有取消路径已实测。

## 性能观察

下表来自实际 job/step 的时间字段。“工作阶段窗口”是首个 job 创建至最后 job 完成，不含顶层并发等待，不能作为 push 到上线总时间。#254 与当前功能清单一致，可用作本轮串行基线；#253 少于当前课程用例，仅保留作历史诊断。

| 运行 | 结构 | checks | 综合检查步骤 | 构建 | 部署 | 后置核验 | 工作阶段窗口 |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| [#253](https://github.com/houjibo/knowledge-visual/actions/runs/43074410325) | 原串行 | 15分32秒 | 14分56秒 | 7秒 | 14秒 | 40秒 | 16分45秒 |
| [#254](https://github.com/houjibo/knowledge-visual/actions/runs/43081918106) | 原串行，同功能清单 | 14分50秒 | 14分21秒 | 10秒 | 13秒 | 43秒 | 16分06秒 |

新结构至少记录三轮各项目/core/汇总/发布时长与覆盖指纹后，再判断同等工作量下关键路径是否缩短25%；初次运行成功与性能目标达成都须分别报告。

依据：[GitHub 工作流语法](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax)、[needs 结果](https://docs.github.com/en/actions/reference/workflows-and-actions/contexts#needs-context)、[Playwright CLI](https://playwright.dev/docs/test-cli)。范围与任务见 [OpenSpec](../../openspec/changes/2026-11-12-parallel-ci-browser-projects/README.md)。
