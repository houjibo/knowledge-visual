# 项目架构与目标

本项目是面向学习者的学科知识可视化站：通过图示、动画和交互帮助理解概念，而非仅展示工程流程。未来可借鉴 [AI Agent Handbook](https://aliyun.github.io/ai-agent-handbook/) 的主题组织、阅读路径和易于浏览的导航，但具体内容仍服务于可视化学习；不预设必须变成智能体手册。

## 当前结构

- `index.html`：四学科入口；`math/`、`physics/`、`chemistry/`、`science/` 各自提供导航和主题。
- `math/index.html` 是小学数学知识地图，`math/topics/<主题>/index.html` 是主题页；其余学段通常是 `学科/学段/index.html` 和同目录主题 HTML。
- 主题页面采用静态 HTML、CSS 和 JavaScript；一些目录下 `assets/` 保存共享资源，具体依赖以各页面为准。页面之间也存在自包含实现，不假设已经统一。
- 无仓库级构建系统或服务端。直接用浏览器打开 `index.html`，也可在仓库根目录运行 `python3 -m http.server 8000`，访问 `http://localhost:8000/`。
- `docs/` 保存当前工程知识，`openspec/specs/` 保存已归档能力契约，`openspec/changes/` 保存进行中及归档变更；源码是实际行为的最终依据，发现冲突时先核实并更新文档。

## 已知基线

2026-11-07 基于仓库扫描有 330 个 HTML 文件（含导航页），其中小学数学有 124 个主题目录。数量会变化，不作为功能承诺。未建立覆盖全部交互、教学内容或可访问性的测试。
