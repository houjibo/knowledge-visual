# 项目架构与目标

本项目是面向学习者的学科知识可视化站：通过图示、动画和交互帮助理解概念，而非仅展示工程流程。未来可借鉴 [AI Agent Handbook](https://aliyun.github.io/ai-agent-handbook/) 的主题组织、阅读路径和易于浏览的导航，但具体内容仍服务于可视化学习；不预设必须变成智能体手册。

## 产品与运营目标

建设有独立公开入口的可视化学习站，让学习者无需了解代码即可发现、操作并持续学习。站点应有可验证的发布流程、稳定导航、质量反馈和可持续维护机制；域名及托管选择可随实际需求演进。当前目标与实施顺序见 [站点发布与专业化运营计划](plans/site-operations.md)。

## 当前结构

- `index.html`：数学、物理、化学、科学、计算机和人工智能六个学科入口，首页提供动手体验入口并支持本地生成目录跨学科查找；学科导航和主题位于对应目录下。
- `computer/`：小学算法与初中数据表示两个已实现学段；课程地图见[计算机课程设计](plans/computer-curriculum.md)。
- `ai/`：高中分类器与大学神经元两个已实现学段；课程地图见[人工智能课程设计](plans/ai-curriculum.md)。
- `computer-ai/`：旧学科入口与主题的兼容页面，旧书签会进入新学科页面或拆分后的学科选择页。
- `assets/css/subject-learning.css` 和 `assets/js/subject-progress.js`：计算机与人工智能主题共用的样式和进度逻辑；旧 `kv-computer-ai-*` 记录会在读取时合并进新学科记录，且仍可备份。
- `math/index.html` 是小学数学知识地图，支持基于现有名称、描述和 G1–G6 标签的本地查找；`math/topics/<主题>/index.html` 是主题页；其余学段通常是 `学科/学段/index.html` 和同目录主题 HTML。
- 主题页面采用静态 HTML、CSS 和 JavaScript；一些目录下 `assets/` 保存共享资源，具体依赖以各页面为准。页面之间也存在自包含实现，不假设已经统一。
- `assets/math-quiz.js` 为八个同构的初高中数学页面提供逐题计分；题目、学段进度和页面布局仍由调用页面维护，变更需回归全部调用页及直接打开文件。
- 首页查找数据 `assets/topic-catalog.js` 从主题标题和导航文字生成；内容变更后运行 `python3 scripts/build_topic_catalog.py`，`npm run check:static` 会检查是否过期。数据已随站点提供，浏览器使用时无需构建或联网。
- 无仓库级构建系统或服务端。直接用浏览器打开 `index.html`，也可在仓库根目录运行 `python3 -m http.server 8000`，访问 `http://localhost:8000/`。
- 初中、高中和大学数学目录通过 `math/assets/js/stage-directory-progress.js` 刷新完成徽章并提示存储不可读；小学目录另有学习路线与汇总。
- 数学新学习进度以学段与主题为标识写入 `kv-math-progress-v2`；旧记录兼容和不可判定情况见 [进度说明](assessments/math-progress-2026-11-07.md)。
- `docs/` 保存当前工程知识，`openspec/specs/` 保存已归档能力契约，`openspec/changes/` 保存进行中及归档变更；源码是实际行为的最终依据，发现冲突时先核实并更新文档。

## 已知基线

2026-11-07 基于仓库扫描有 330 个 HTML 文件（含导航页），其中小学数学有 124 个主题目录。数量会变化，不作为功能承诺。未建立覆盖全部交互、教学内容或可访问性的测试。
