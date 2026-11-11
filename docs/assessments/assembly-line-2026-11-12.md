# 工业流水线模拟核查

## 学习目标与模型

在模拟世界新增[工业流水线](../../simulation-world/assembly-line.html)，操作切割、装配、质检的加工时间，观察零件在瓶颈前排队，并比较改善前后的8件批次交付时间。场景不按学段组织，不写入学科完成记录。

概念依据为 [Lean Enterprise Institute 的 Cycle Time](https://www.lean.org/lexicon-terms/cycle-time/) 与 [US EPA 的精益术语表](https://www.epa.gov/sustainability/environmental-professionals-guide-lean-and-six-sigma-appendix-c)：单站加工时间、全流程时间、排队、在制品与限制产出的瓶颈需分别理解。模型规则及下述时间是本项目在明确假设下的推导，不是来源中的现实工厂数据。

固定8件零件，3站各1台机器，先到先服务、无运输耗时、无故障返工、工位之间缓冲不受容量限制。t=0第1件开始切割，未投料的7件不算在制品。每一步推进1个模拟秒：同时推进已在加工的工位，统一转出完成件，最后为空工位取件，新取件本秒不额外加工。自动运行的播放速度是每500ms推进1个模拟秒，暂停期间模拟时间不变。

| 条件（切割/装配/质检，秒/件） | 首件完成 | 全部8件完成 | 理论持续产能 | 批次平均产出 |
| --- | ---: | ---: | ---: | ---: |
| 2 / 5 / 2 | 9秒 | 44秒 | 12件/分 | 约10.9件/分 |
| 2 / 2 / 2 | 6秒 | 20秒 | 30件/分 | 24件/分 |
| 1 / 1 / 1 | 3秒 | 10秒 | 60件/分 | 48件/分 |

在这些固定条件下，首件时间为三站加工时间之和，整批时间为三站之和加7倍最慢站时间；持续产能为60除以最慢站时间。有限批次包含启动和收尾，平均产出为480除以整批秒数。并列最慢工位会全部标出，不把均衡生产称为某一站独占瓶颈，也不把加工时间当作客户需求决定的节拍时间。

## 验证设计

- [模型单元](../../tests/assembly-line-model.test.js)使用与逐秒推进算法不同的工序事件时间递推，为216种加工时间组合独立生成期望；每秒比对编号位置、队列、剩余加工时间与完工时间，核对8件守恒、FIFO、输入不变及最终停止。
- [桌面与移动功能回归](../../tests/browser/simulation-world-assembly-line.spec.js)检查发现路径、实际DOM编号、默认44秒、均衡20秒与24秒改善、同时转站、暂停恢复、参数/示例重置、减少动态、后台/离开、320px、file协议及无学科进度写入。
- [发布包回归](../../tests/browser/published-site.spec.js)从项目子路径首页查找进入，加载本地脚本、运行完整均衡批次并返回目录；发布资源核验包含HTML、模型与UI脚本。

## 执行证据

- 模型6项单元通过，其中216种时间组合逐秒匹配独立事件时间递推；2/5/2的完成序列为9、14、19、24、29、34、39、44秒。
- 完整检查的静态阶段通过：362页路径、目录数量、元数据、发布包31项资源契约及250项严格OpenSpec。真实清单比较为desktop934、mobile934，共1868，指纹为`e31e660bd95f9baeae7b45a504331f90026a968661bb92cd33ee2232e1ad3716`；清单收集不代表实际执行结果。
- 本地浏览器人工单步到t=6：切割加工#4、装配加工#1、装配前#2/#3排队、原料#5–#8待投料、质检等待，待投料4+在制品4+成品0=8；画面、指标和状态一致。页面在4173端口保持可验收。
- 两次独立只读审查未发现模型、快照、计时器或发布接入阻断；历史条件复制并冻结，未完成重试不会覆盖完整记录。减少动态回归在偏好关闭事件处理完成后再开启，避免浏览器合并同一帧内的设置；后台与离开用受控事件验证处理逻辑。

- `CI=true npm run check` 完整通过：实际功能回归1866通过、原有2项移动专属测试在桌面跳过；开发站362页加载通过，发布子路径交互8项通过，发布包362页加载通过。新场景12项×桌面/移动共24项均通过；原太阳系与齿轮场景导航和功能亦通过。

## 发布状态与排队异常

当前主分支已自动发布。[Actions #262](https://github.com/houjibo/knowledge-visual/actions/runs/43103626270) 对提交 `a18061841c2b1b58aae5fb052c5a7e51cf81645d` 的core、desktop、mobile、checks、构建、部署、部署后核验七个job全部成功，最后核验于2026-11-11 UTC 21:39:00完成。该版本同时包含条件分支主题，实际功能回归为[desktop 947通过/2跳过](https://api.github.com/repos/houjibo/knowledge-visual/check-runs/130801166425/annotations)、[mobile 949通过](https://api.github.com/repos/houjibo/knowledge-visual/check-runs/130801166540/annotations)，合计1896通过/2跳过；[core执行摘要](https://api.github.com/repos/houjibo/knowledge-visual/check-runs/130801167036/annotations)记录开发站363页、发布路径8项、发布包363页全部通过。这是集成后版本的执行数量，前述1866/362是工业场景初交时的本地范围。

已直接读取[公网版本清单](https://houjibo.github.io/knowledge-visual/release-version.json?verify=a18061841c2b1b58aae5fb052c5a7e51cf81645d)，HTTP200、revision精确匹配该提交且 `site_files_modified:false`。新场景三个资源均HTTP200，响应字节与该提交的 `git show` 内容逐一完全一致：

| 资源 | 字节数 | SHA-256 |
| --- | ---: | --- |
| `simulation-world/assembly-line.html` | 24768 | `51c78a64101312982d73f7914072db855abd17d7170faca0424262062648fe51` |
| `simulation-world/assets/assembly-line-model.js` | 6593 | `232a38ba0a90a75ee58acf1cdee2bfc30abc34c26b08b55781998e9c6d33ca45` |
| `simulation-world/assets/assembly-line.js` | 10844 | `5c528b12e778ef7e6613d67e84ec34de6b28777d239afb03dca61bf098e85290` |

CUA公开人工验收已通过：从三卡模拟目录进入，默认2/5/2批次在第44模拟秒完成8件、首件第9秒；切换2/2/2批次在第20秒完成、首件第6秒。界面同时保留44秒与20秒及各自完整条件，显示节省24模拟秒，自动停止、成品8/8、在制品0；与自动化结果一致。已保存公开验收截图，变更完成后归档。

### 历史排队快照

功能提交 `d1833977827e106c7dec8cf10ecc7acf5eb20afe` 先推送并触发 [Actions #258](https://github.com/houjibo/knowledge-visual/actions/runs/43095587329)。2026-11-11 UTC 20:37:50（本地11月12日04:37:50）以no-cache及新查询参数读取API，运行当时为queued、conclusion=null、attempt=1、jobs为空；相对20:21:50创建时间已排队16分钟，没有测试失败或任务执行证据，当时公开目录仍为上一版。

[GitHub状态页](https://www.githubstatus.com/)同日记录20:22–20:26的Webhooks短暂异常，时间重叠不能证明全部初始等待的原因；后续平台事件和恢复边界见[发布队列核查](release-backlog-2026-11-12.md)。当时补充核查文档并推送一次，以新事件触发同一套完整门禁；之后按正常功能交付集成条件主题，最终由 #262 完成自动发布。发布保护、功能清单验证和质量标准均保留，旧排队快照已不构成当前版本的发布阻塞。真实设备、屏幕阅读器、真实产线预测与学习者理解效果尚未全面验证。

范围与任务：[OpenSpec proposal](../../openspec/changes/archive/2026-11-12-industrial-assembly-line/proposal.md)、[任务](../../openspec/changes/archive/2026-11-12-industrial-assembly-line/tasks.md)。
