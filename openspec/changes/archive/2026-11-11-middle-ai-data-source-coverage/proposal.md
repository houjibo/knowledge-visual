## Why

初中人工智能已有冲突标签主题，但还没有展示样例从哪些条件中采集、哪些情况没有进入数据集。增加一个可视化采样实验，让学习者通过对照相同类别数量、不同场景覆盖的样本集，观察数据来源如何限制可见证据。

## What Changes

- 在初中人工智能新增“数据来源与覆盖实验室”，以固定虚构图案和两种光照条件展示有限目标集合、采样方式、已纳入样例及未覆盖组合。
- 提供可键盘操作的样例选择、相同数量的窄覆盖/跨条件对照、计数矩阵和明确的覆盖反馈；不模拟训练、准确率或现实群体表现。
- 将主题加入人工智能学段目录、首页搜索、进度总数、发布包与公网部署核验，并更新课程设计、交互证据和差距台账。

## Capabilities

### New Capabilities

- `ai-middle-data-source-coverage`: 展示虚构目标集合与样本来源，允许比较并编辑采样集合，解释覆盖缺口和结论边界。

### Modified Capabilities

- `computer-ai-learning-subject`: 人工智能初中增加数据来源与覆盖交互主题。
- `site-topic-discovery`: 首页目录可按学科和学段查找新的 AI 初中主题。
- `subject-progress`: AI 初中和人工智能总主题数纳入新主题，进度按主题独立统计。
- `static-release-artifact`: 子路径发布包和部署后检查覆盖新主题。

## Impact

- 影响 `ai/middle/`、人工智能学科与学段目录、首页主题目录、进度统计、页面库存、发布构建/验证和浏览器回归。
- 更新 `docs/plans/ai-curriculum.md`、`docs/assessments/interaction-coverage.md` 与 `docs/gaps.md`。
- 不增加依赖，不调用外部 API，不收集或上传学习者数据。
