## Why

Actions #253 的综合检查步骤耗时 14 分 56 秒，工作阶段窗口为 16 分 45 秒（不含排队）。桌面和移动功能回归在一个 job 中串行占用关键路径；随着知识点补齐，小步更新需要更快且完整的质量反馈。

## What Changes

- 按 desktop/mobile 两个矩阵 job 并行运行既有唯一功能测试清单；保留两 worker 和失败后继续收集另一项目结果。
- 独立 core job 分步骤执行静态、清单等价、开发站全页与完整发布包检查。
- 保留稳定的 `checks` 汇总门禁，仅接受全部上游成功；保留既有发布、当前 main、来源和部署后验证链。
- 增加真实清单多重集合比较、配置变异回归及汇总脚本状态真值表；记录实际 Actions 结果与性能观察。

## Capabilities

### New Capabilities

- `parallel-quality-checks`：完整质量检查的项目拆分、清单等价、成功汇总与可追溯诊断。

### Modified Capabilities

- `site-operations`：重载检查任务保留充分超时，`checks` 改为轻量且严格的汇总任务。

## Impact

修改 `.github/workflows/checks.yml`、发布守卫及其测试，新增基于 Playwright JSON 清单的等价检查；本地 `npm run check` 继续完整运行。站点运行资源、功能测试文件清单、浏览器项目配置和顶层串行发布策略保持原契约。性能目标需远端观测后判断，不以本地通过宣称提速。
