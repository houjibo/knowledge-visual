# knowledge-visual

知识可视化学习站：按学科和学段组织互动可视化内容，帮助学习者通过观察和操作理解知识。

## 开始学习

用浏览器直接打开 [首页](index.html)，或在仓库根目录启动静态服务器：

```sh
python3 -m http.server 8000
```

然后访问 <http://localhost:8000/>。首页可按关键词、学科和学段查找主题，也可选择数学、物理、化学或小学科学，逐级进入学习内容。

## 目录

- `index.html`：学科入口。
- `math/`：小学数学知识地图（`topics/` 中每个主题一个目录），以及 `middle/`、`high/`、`uni/` 学段页面。
- `physics/`、`chemistry/`：初中、高中、大学学段导航和主题页面。
- `science/`：小学科学导航和主题页面。
- 各目录中的 `assets/` 保存相关共享资源；部分主题页面也自包含样式或脚本。

## 项目方向

项目正逐步建设独立发布的可视化学习站，完善内容质量、发布检查和持续维护。具体目标与进度见 [站点发布与专业化运营计划](docs/plans/site-operations.md)。

## 参与维护

从 [项目架构](docs/architecture.md)、[工程约束](docs/constraints.md) 和 [工作流](docs/workflows/README.md) 开始。运行 `python3 scripts/check_site.py` 检查静态引用、索引和部分学段进度总数；检查范围和浏览器验证要求见工程约束。[OpenSpec](openspec/README.md) 记录能力契约与变更。

部分小学内容合并自 `primary-math-visual` 项目。
