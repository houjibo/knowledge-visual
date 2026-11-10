## Why

仓库的静态门禁没有检查普通 Markdown 文档中的本地链接，已出现课程地图指向不存在目录的情况，问题直到人工阅读才发现。把此类链接纳入自动检查，可在提交时定位文档断链，保持设计、约束、差距和 OpenSpec 记录之间的导航可靠。

## What Changes

- 为仓库 Markdown 增加本地目标检查，覆盖行内链接、图片链接和引用式链接；忽略外部 URL 与纯片段。
- 将检查加入 `npm run check:static`，缺失目标时报告来源文件、行号和目标并以非零状态退出。
- 更新工程约束说明，并提供缺失目标、代码样例、外部链接及有效路径的回归测试。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `repository-guidance`：扩展本地基础检查契约，要求检查仓库 Markdown 中的本地链接目标。

## Impact

影响 `scripts/`、`tests/`、`package.json`、`docs/constraints.md` 和 `openspec/specs/repository-guidance/`。不增加依赖，不改变学习站页面或发布产物。
