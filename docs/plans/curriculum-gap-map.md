# 全站课程覆盖差距：首轮基线与任务计划

基线日期：2026-11-15；供给更新至 2026-11-18；范围为本站现有六个学科、四个学习阶段，另列模拟世界。依据与版本见[课程来源登记](curriculum-sources.md)，执行契约见[OpenSpec 提案](../../openspec/changes/curriculum-source-gap-baseline/proposal.md)。课程标准是主线；用户选择现行审定人教版作能适用学科的章次示例，小学科学采用人教/鄂教版，义务教育信息科技、AI 和大学按来源例外处理。本页是**提案和待核对清单**，不是已完成的课程认证。

这里的“全站”指目前公开导航中的数学、物理、化学、科学、计算机和人工智能。语文等首页预告类目及国家课程中本站尚未设立的学科，不在本轮分母内；若决定扩展学科，应先独立确定范围与来源，再扩大矩阵。

## 如何计算距离

- **供给基线**：从[逐页清单](../assessments/page-inventory.json)统计主题 HTML。当前 366 个学科主题、10 个模拟场景；项目总计 410 个 HTML，其中还包括目录、首页和兼容入口。一个页面可含多个知识点，多个页面也可能重复同一目标。
- **课程距离**：正式分母应是选定来源中逐条可观察的学习要求，分类为“已验证覆盖／部分覆盖／缺失／未映射／不适用”。只有逐条拆解、链接到页面和内容/交互核查之后，才可算已验证覆盖率。**当前 19 个适用学科×阶段均未完成完整交叉映射，故全站覆盖百分比不可计算。**[高中数学“集合”7 条 HS25 必修内容要求](curriculum-crosswalks/high-math-sets-hs25.json)已与 HS20 逐条对照，现均为部分；其余预备知识与学业要求另核。初中信息科技第四学段三模块 19 条内容要求与初中数学“有理数”5 条已完成[2022→2025 版逐条复核](../assessments/middle-ce25-content-recheck-2026-11-13.md)；有理数乘方有限案例从“缺失”提升为“部分”，见[乘方核查](../assessments/middle-rational-powers-2026-11-13.md)；[情境列式](../assessments/middle-rational-context-problems-2026-11-14.md)为第⑤条、[数轴比较实验室](../assessments/middle-rational-order-2026-11-14.md)为第①条提供有限任务，五条现均为部分。[有理数一段学业要求](curriculum-crosswalks/middle-math-rational-numbers-ce25-academic.json)与[信息科技三个模块各一段学业要求](curriculum-crosswalks/middle-information-technology-ce25-academic.json)已另核；[传感反馈实验](../assessments/iot-sensor-feedback-2026-11-14.md)只增加局部物联证据；[网页编辑与发布实验](../assessments/middle-webpage-publishing-2026-11-14.md)把互联网第（3）条补为部分证据；[资料共享与同步实验](../assessments/middle-online-collaboration-2026-11-14.md)把第（1）条补为部分证据；[交流方式选择实验](../assessments/middle-online-learning-modes-2026-11-14.md)把第（5）条补为部分证据；[完整“数与式”22 条映射](curriculum-crosswalks/middle-math-number-expressions-ce25.json)将有理数 5 条和近似数／科学记数法 2 条作为子集，只计一次；当前 0 已验证、22 部分、0 缺失；[平方与立方开方实验室](../assessments/middle-square-cube-roots-2026-11-15.md)为实数④⑤增加局部交互证据，[无理数夹逼实验室](../assessments/middle-irrational-root-bounds-2026-11-15.md)为实数⑥增加整数和十分位界及平方比较理由；[实数对称与距离实验室](../assessments/middle-real-symmetry-distance-2026-11-15.md)为实数③增加反射与距离任务，见[核查记录](../assessments/middle-math-number-expressions-ce25-2026-11-15.md)。站内诊断点不能当作新增的官方条目；[互联智能设计五个活动](../assessments/middle-information-technology-ce25-academic-themes-2026-11-13.md)也暂不并入内容分母。两份 `CE22` 原清单仍是历史快照。完整学段质量、其余主题与跨学科实施边界待核，不能推算全站百分比。这表示审计尚未完成，不表示现有学习内容的覆盖为零。
- **可见预警**：19 个适用格均有至少 1 个主题；其中 3 格只有 1–2 个主题：大学计算机与小学、大学人工智能。它们是先核对的候选，不据页数直接判定知识缺失程度。
- **适用边界**：小学物理和小学化学主要融入小学科学，暂不设独立站点学段；“初中科学”在义务教育课程方案中可作为物理/化学/生物学的替代安排，本站是否设置该独立入口待决；高中和大学“科学”不是本站选定的统一独立课程。五格保持“范围待定／不单列”，不算成已覆盖或缺失。

## 六学科×四阶段供给矩阵

数字是**当前主题页面数**；`—` 表示尚未单列或待范围决策。各学段的标准、教材与大学参考并不完全同构。

| 学科 | 小学 | 初中 | 高中 | 大学 | 小计 |
| --- | ---: | ---: | ---: | ---: | ---: |
| 数学 | 124 | 35 | 19 | 36 | 214 |
| 物理 | — | 20 | 16 | 19 | 55 |
| 化学 | — | 13 | 16 | 17 | 46 |
| 科学 | 17 | —（初中待决） | — | — | 17 |
| 计算机 | 5 | 9 | 9 | 1 | 24 |
| 人工智能 | 1 | 5 | 3 | 1 | 10 |
| **学科主题合计** | **147** | **82** | **63** | **74** | **366** |

## 分阶段核对与首批候选

以下“待核对”来自官方标准/指南的大方向和本站现有目录的首轮对照，**还不是逐条标准已经确认缺失**。`来源 ID` 对应[来源登记](curriculum-sources.md)。除下方已经拆解的局部试点外，各学科阶段的完整来源要求数、已验证覆盖数与缺失数仍待建立。

| 学科阶段 | 来源 ID | 教材／大纲示例 | 当前页 | 首批要核对的目标与候选切片 |
| --- | --- | --- | ---: | --- |
| 小学数学 | CE25、CE22 对照、BOOK-CE | 人教版第十二套 | 124 | 按 2025 版的 1–2、3–4、5–6 年级要求拆分数与代数、图形与几何、统计与概率、综合实践；核查重复页与数学建模活动。 |
| 初中数学 | CE25、CE22 对照、BOOK-CE | 人教版第十二套 | 35 | [六册编排索引](pep-middle-math-series-structure.md)据人教社原图记录 34 章与 12 个实践活动；[七上样本](pep-middle-math-grade7-up-audit.md)核到该册版次、ISBN 和六章；[地方分册核查](pep-volume-edition-source-audit.md)再核到七下、八上、八下的版月样本，九上仅有平台新编线索，六册完整小节目录仍待核。[CE25 “数与式”22 条内容要求](curriculum-crosswalks/middle-math-number-expressions-ce25.json)为 0 已验证、22 部分、0 缺失；此前有理数 5 条及近似数／科学记数法 2 条是其子集，不重复计数；[一段学业要求](curriculum-crosswalks/middle-math-rational-numbers-ce25-academic.json)为部分，七个站内诊断点 6 部分、1 缺失；第四学段质量描述只作[阶段视角](../assessments/middle-math-ce25-academic-quality-2026-11-13.md)。[方程与不等式 11 条](curriculum-crosswalks/middle-math-equations-inequalities-ce25.json)为 10 部分、1 缺失（选学）；[配方原式错误已修复](../assessments/middle-math-equations-inequalities-ce25-2026-11-16.md)，本地和公网专项及 Actions 通过。其余初中主题仍待核。 |
| 高中数学 | HS25、HS20 对照、BOOK-HS | 人教版第十一套 A 版 | 19 | [必修“集合”7 条](curriculum-crosswalks/high-math-sets-hs25.json)已逐项映射，0 已验证、7 部分；[版本对照](../assessments/high-math-sets-hs25-2026-11-14.md)标明学业要求用语变化，[三轮语言转换练习](../assessments/high-math-set-language-conversion-2026-11-14.md)、[可变全集补集工作台](../assessments/high-math-variable-universe-complement-2026-11-14.md)和[双集合关系/交并预测](../assessments/high-math-set-relations-operations-2026-11-14.md)补充局部操作证据。继续核预备知识其他单元、函数、几何代数、概率统计、建模/探究与教材完整节目录。 |
| 大学数学 | UNI-M | MIT OCW 基础轨 | 36 | 以微积分与线性代数为基础轨；[MIT 18.06 十项目标静态对照与排序](../assessments/university-linear-algebra-mit-18-06-2026-11-17.md)记录已复现错误、[方程有符号输入局部修复](../assessments/university-linear-system-signed-input-2026-11-17.md)、[消元与 PLU 有限工作台](../assessments/university-plu-elimination-workbench-2026-11-18.md)、[四个基本子空间有限工作台](../assessments/university-four-subspaces-workbench-2026-11-17.md)、[投影与最小二乘有限工作台](../assessments/university-least-squares-projection-2026-11-17.md)、[Gram–Schmidt／QR 有限工作台](../assessments/university-gram-schmidt-qr-2026-11-17.md)、[正定性与二次型有限工作台](../assessments/university-positive-definite-quadratic-forms-2026-11-17.md)、[实对称矩阵谱分解有限工作台](../assessments/university-symmetric-spectral-decomposition-2026-11-17.md)、[矩形矩阵 SVD 有限工作台](../assessments/university-svd-rectangular-workbench-2026-11-17.md)、[Haar 基变换与图像系数截断有限实验](../assessments/university-haar-basis-compression-2026-11-17.md)、[非正交基坐标与相似变换有限工作台](../assessments/university-nonorthogonal-basis-similarity-2026-11-17.md)及后续一般维度与应用缺口；先核对积分应用与线性代数任务，拓展主题另列来源；[随机过程平稳分布局部核查](../assessments/university-markov-stationary-2026-11-17.md)修正现有示例的错误数值并区分不变与收敛；[二维布朗运动核查](../assessments/university-brownian-distance-2026-11-17.md)修正径向期望及参数混合问题；[泊松模拟核查](../assessments/university-poisson-simulation-2026-11-17.md)修正强度变更与样本不一致及随机值边界，未构成完整课程映射。 |
| 初中物理 | CE25、CE22 对照、BOOK-CE | 人教版第十二套 | 20 | 从 2025 版将运动、力、能量、物质与实验探究分别映射；先核对测量误差和从数据得结论的操作。 |
| 高中物理 | HS25、HS20 对照、BOOK-HS | 人教版第十一套 | 16 | 先核对 2025 版条款变化，再分必修/选择性必修映射力学、电磁、波与近代物理；核对实验模型、证据和单位。 |
| 大学物理 | UNI-P | MIT OCW 经典力学 | 19 | 先完成经典力学课程映射，再补电磁、热学和近代物理公开大纲；核对矢量场与适用边界。 |
| 初中化学 | CE25、CE22 对照、BOOK-CE | 人教版第十二套（逐册待核） | 13 | 对照 2025 版的物质组成/变化、定量守恒、实验探究与化学社会应用；核对实验安全和现象证据。 |
| 高中化学 | HS25、HS20 对照、BOOK-HS | 人教版第十一套 | 16 | 先核对 2025 版条款变化，再分必修与选择性必修核对反应、结构、平衡、有机、实验与材料；核对实验条件和图文一致。 |
| 大学化学 | UNI-C | MIT OCW 化学科学原理 | 17 | 先映射原子/键、热力学/平衡、氧化还原、动力学，再补结构、分析、有机与材料课程来源。 |
| 小学科学 | CE25、CE22 对照、BOOK-CE | 人教/鄂教版第十二套 | 17 | 对照 2025 版的物质、生命、地球宇宙、技术工程与探究实践；优先核查工程设计和证据记录是否足够。 |
| 小学计算机 | CE25、CE22 对照 | 信息科技标准；教科书待选 | 5 | 核对 2025 版信息表示、算法、数据与个人信息保护；候选“简单编码”与安全判断，区分课标规定年级。 |
| 初中计算机 | CE25、CE22 对照 | 信息科技标准；教科书待选 | 9 | [CE25 三模块 19 条内容要求](../assessments/middle-ce25-content-recheck-2026-11-13.md)为 0 已验证、13 部分、6 缺失；[三段学业要求](curriculum-crosswalks/middle-information-technology-ce25-academic.json)为 3 部分、0 缺失，16 个站内诊断点不作官方分母；[互联智能设计五个场景](../assessments/middle-information-technology-ce25-academic-themes-2026-11-13.md)另列候选。完整学段质量待核；消息传输有 UTF-8 与教学分块，网页编辑页补草稿与模拟发布快照，[资料共享对照](../assessments/middle-online-collaboration-2026-11-14.md)补单浏览器有限版本传播，[交流方式选择](../assessments/middle-online-learning-modes-2026-11-14.md)补固定条件比较，传感反馈页补有限虚构设备链；[身份与保密实验室](../assessments/middle-identity-encryption-2026-11-17.md)补虚构凭据与密钥泄露判断；[备份与恢复实验室](../assessments/middle-local-backup-restore-2026-11-17.md)补练习文件真实导出与恢复；真实多人在线活动及创新价值分析、网页托管、协议层次与实物搭建仍缺。 |
| 高中计算机 | HS25、HS20 对照、BOOK-HS | [中图人教版《信息技术》必修两册](pep-high-information-technology-books.md) | 9 | [2025 版两必修模块 15 条编号要求](curriculum-crosswalks/high-information-technology-hs25.json)已核：0 已验证、13 部分、2 缺失；[镜像与旧版对照](../assessments/high-information-technology-hs25-2026-11-15.md)限定此分母。[数据编码与分析工作台](../assessments/high-data-workbench-2026-11-15.md)提供 1.1/1.2 局部证据；[算法描述与流程图实验室](../assessments/high-algorithm-flowchart-2026-11-15.md)为 1.4 增加首次匹配查找的流程图/伪代码构造证据；[最大公约数算法工作台](../assessments/high-gcd-algorithm-2026-11-15.md)按 1.5 的辗转相除法教学提示增加构造、边界测试、固定参考模型验证、操作次数比较和静态错误草案核查，仍未执行学习者程序或真实生成式 AI；[生成式 AI 负责任使用实验室](../assessments/high-genai-responsible-use-2026-11-16.md)为 1.6 增加输入规范、来源核验和协作使用决策的固定脚本证据；[借阅信息系统工作台](../assessments/high-information-system-2026-11-15.md)提供 2.1、2.2、2.5、2.8 局部证据；[网络实验室](../assessments/high-network-assembly-2026-11-15.md)提供 2.3 的本地模型证据；[物联网反馈控制实验室](../assessments/high-iot-feedback-control-2026-11-15.md)为 2.4 增加定时/反馈与断网控制路径的有限模型证据；[对话交互实验室](../assessments/high-ai-system-dialogue-2026-11-15.md)为 2.6 增加脚本化人机交互比较和来源核验。人教版示例只用于章次定位，不能代表标准覆盖。继续补真实采集与大数据、开放问题的自主算法设计、程序和真实生成式 AI 核验、真实系统搭建及网络安全实践；九个页面不能代表整科。 |
| 大学计算机 | UNI-CS | CS2023 专业框架 | 1 | 用 CS2023 知识领域建立基础/拓展边界；现有栈与队列之外优先核对算法分析、程序、系统、网络与安全。 |
| 小学人工智能 | AI25、CE25 | AI 通识指南；无独立教科书 | 1 | 特征分类之外，核对安全体验、判断机器结果和个人信息；不要求开放式模型服务。 |
| 初中人工智能 | AI25、CE25 | AI 通识指南；无独立教科书 | 5 | [手写规则与学习阈值](../assessments/middle-ai-rule-learned-2026-11-17.md)补同一有限任务的训练与预测对照；继续核搜索、推理与其他学习方式和真实应用。 |
| 高中人工智能 | AI25、HS25 | AI 通识指南／[中图人教版信息技术](pep-high-information-technology-books.md) | 3 | 高中 AI 页面已作为 HS25 必修1 1.2、1.7 的部分证据；生成式 AI 规范和指南目标仍需核对。HS25 必修2 2.6 的对话交互任务列在计算机导航并在其唯一交叉表中计为部分；AI 导航不另造第二份国家必修分母。 |
| 大学人工智能 | UNI-CS | CS2023 人工智能领域 | 1 | 现有单神经元计算之外，核对搜索、知识表示、学习、评估、偏差及安全；与计算机共享来源要求避免重复计数。 |

模拟世界目前有 10 个场景，按场景问题、模型假设、操作、反馈和发布证据追踪；它没有统一“国家课程单元”分母，不纳入上述 366 个学科主题页或课程覆盖率。机械/工业化的下一步以[场景规划](simulation-world-curriculum.md)单独排序。

**教材来源准备度另计**：[分册版次核查](pep-volume-edition-source-audit.md)给初中数学六册中的四册取得地方公开的精确版月样本，九上只核到 2026 年平台新编目录线索，九下待当期证据；初中物理与化学各两册取得地方版月样本。完整小节目录和按课标逐条映射均未因此自动完成，不能将 `4/6` 当作课程覆盖率。

## 已拆解试点的计数边界

| 来源维度 | 官方来源单位 | 当前映射 | 是否可与其他行相加 |
| --- | ---: | --- | --- |
| 高中数学必修“集合”内容要求 | [7 个编号或独立条目](curriculum-crosswalks/high-math-sets-hs25.json) | 0 已验证、7 部分、0 缺失 | 仅为 HS25 必修局部试点；不与学业要求相加。 |
| 高中信息科技两必修模块内容要求 | [15 个编号条目](curriculum-crosswalks/high-information-technology-hs25.json)：数据与计算 7、信息系统与社会 8 | 0 已验证、13 部分、2 缺失 | 仅为 HS25 内容要求局部试点；物联反馈、网络组装、对话交互与生成式 AI 负责任使用均是固定本地脚本模型，受控真实生成式工具实践、真实系统、自主可控全链路证据、学业要求、质量和选修另核。 |
| 初中数学第四学段“数与式”内容要求 | [22 个编号条目](curriculum-crosswalks/middle-math-number-expressions-ce25.json)：有理数 5、实数 8、代数式 9 | 0 已验证、22 部分、0 缺失 | 旧有理数 5 条及近似数／科学记数法 2 条是本行子集，不另加；仍非初中数学完整分母。 |
| 初中数学第四学段“方程与不等式”内容要求 | [11 个编号条目](curriculum-crosswalks/middle-math-equations-inequalities-ce25.json)：方程 8、不等式 3 | 0 已验证、10 部分、1 缺失；缺失为选学 | 与“数与式”22 条分属不同主题；学业要求、阶段质量与函数另计，不能当初中数学全范围。 |
| 初中数学有理数学业要求 | 1 段来源要求 | 1 部分；其下 7 个站内诊断点为 6 部分、1 缺失 | 不与内容要求或诊断点相加。 |
| 初中数学第四学段学业质量 | 1 个阶段描述，覆盖整段数学学习 | 本轮仅核查与有理数有关的质量视角 | 不下沉为有理数单元分母；待第四学段完整映射。 |
| 初中信息科技三个模块内容要求 | 19 个编号条目 | 0 已验证、13 部分、6 缺失 | 只在该内容要求试点计数；跨学科主题和阶段质量另核。 |
| 初中信息科技三个模块学业要求 | 3 段来源要求 | 0 已验证、3 部分、0 缺失；其下 16 个站内诊断点为 10 部分、6 缺失 | 与 19 条内容要求、站内诊断点分开，不相加。 |
| 初中信息科技“互联智能设计” | 1 个跨学科主题，列 5 个命名活动 | 已核来源与站内邻近素材，实施边界待核 | 五个活动暂不作为五条必达内容要求；按[场景核查](../assessments/middle-information-technology-ce25-academic-themes-2026-11-13.md)设计任务。 |
| 初中信息科技第四学段学业质量 | 表 5 的 1 行阶段描述 | 本轮只核查计数边界与主要质量视角 | 不下沉为三个模块的单位分母；待第四学段完整映射。 |

上述数字只描述已拆解的来源单位和诊断状态，不能计算全站课程覆盖率。任务优先级仍取决于先修关系、可视化学习价值和真实证据缺口，不按页面数或诊断点数机械排序。

## 分批执行计划

1. **P0：来源可追溯（当前）**。登记 CE25（CE22 作历史对照）、HS25（HS20 作历史对照）、AI25、教材目录与大学参考；为 24 格标适用性，生成本页页面基线。[义务教育](compulsory-2025-standard-version-audit.md)与[高中](high-school-2025-standard-version-audit.md)的 2025 版来源核查均发现逐条迁移任务。已选六三学制、人教版现行审定教材为适用学科的章次示例；[初中数学六册编排表](pep-middle-math-series-structure.md)已核到 34 章与 12 个实践活动的出版方索引，[七上样本](pep-middle-math-grade7-up-audit.md)已核到该册 ISBN 并隔离旧版目录；[2025 年部级课例核查](pep-middle-math-2025-lesson-source-audit.md)补充七上、七下、八上的局部章节目线索，但不替代目录。[地方分册核查](pep-volume-edition-source-audit.md)已补七下、八上、八下数学及初中物理、化学的版月样本；完整节目录和九上、九下数学精确纸书版次仍须核对。验收：每格都有来源和边界，当前 `366 + 10` 可由清单复算。
2. **P1：建立可计算分母**。先选高中数学和初中信息科技作为两种粒度试点：高中数学“集合”7条已核，其他范围仍须对照 2025 修订原文与 2020 版差异；初中须按 2025 修订原文与 2022 版逐条比对，再从现行标准的内容要求、学业要求与阶段学业质量提取稳定来源单位、学习目标、必修性和来源位置，把本站主题、练习与核查证据逐条连上。高中信息科技[两必修模块 15 条](curriculum-crosswalks/high-information-technology-hs25.json)内容要求现为 0 已验证、13 部分、2 缺失，官方机构原文附件仍待取得；初中信息科技[三模块 19 条](curriculum-crosswalks/middle-information-technology-ce25.json)、初中数学[“数与式”22 条](curriculum-crosswalks/middle-math-number-expressions-ce25.json)内容要求已有逐条 CE25 映射；有理数一段与信息科技三段学业要求已另核。信息科技跨学科主题的五个场景已有来源核查，实施边界和两科完整阶段学业质量、完整教材节目录、高中数学其余范围及其余数学要求仍待核查。出版方 34 章的索引不充当此分母。通过复核后依次完成其余适用格；大学先定义基础轨。验收：每个**来源维度**的 `已验证+部分+缺失+未映射+不适用` 与该维度已拆解的来源单位数一致，诊断点与来源条目不相加，尚未拆解的范围单列；全局覆盖率只有在适用范围均已拆解且“未映射”为零并明确跨维度聚合规则时才发布。
3. **P2：按价值补齐**。优先审查三个稀疏格及真正缺失的基础先修，再审已有大页的教学准确性与交互；每个新主题独立 OpenSpec、小步提交、桌面/移动/键盘/320px/file/子路径/公网核查。每批结束更新矩阵和总数，不把发布成功当课程要求自动通过。
4. **P3：向学习者呈现**。映射经审校后，再评估公开的可交互课程地图：学科/阶段/主题筛选、学习路径、来源说明与未覆盖提示。先验证一科，再决定是否推广；内部“缺口”状态与学习者的完成进度保持分离。

已知页面体验、质量和发布风险继续在[差距台账](../gaps.md)追踪；本计划只解决课程范围和优先级的可见性。下一步工作以[OpenSpec tasks](../../openspec/changes/curriculum-source-gap-baseline/tasks.md)为准。
