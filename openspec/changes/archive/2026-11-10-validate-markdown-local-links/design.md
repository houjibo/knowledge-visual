## Context

现有 `scripts/check_site.py` 已检查 HTML 静态引用，并只抽查根 `AGENTS.md` 的链接；`docs/constraints.md` 也明确说明其他 Markdown 不在范围内。见 [proposal.md](proposal.md) 中的漏检证据。

## Goals / Non-Goals

**Goals:**

- 在静态门禁中覆盖仓库的 Markdown 文档和 OpenSpec 归档。
- 提供来源行号、支持仓库内相对路径和编码空格，并避免代码样例误报。

**Non-Goals:**

- 不检查外链可用性、标题片段是否存在或 JavaScript 动态生成的链接。
- 不增加 Markdown 解析器依赖，也不改变 HTML 检查器现有范围。

## Decisions

- 新增独立 Python 检查器，通过标准库扫描 Markdown 行内链接、图片链接与引用式链接；相较于扩展 HTML 检查器，独立入口便于单测语法和路径边界。
- 忽略外部 URL、纯片段和围栏/行内代码；本地目标相对来源文档解析，根路径按仓库根解析，百分号编码先解码。
- 对目标不存在或解析后逃逸仓库根的链接报告错误；目录目标有效，以继续支持链接到目录入口。
- 将检查器与其单元测试接入 `npm run check:static`，并同步工程约束和差距台账，保持 CI 与本地使用同一门禁。

## Risks / Trade-offs

- [Markdown 语法解析不完整] → 只接受当前仓库使用并由测试覆盖的行内、图片和引用式链接形式；未支持的动态或 HTML 内嵌链接继续留在明确的非目标范围。
- [已存在的历史断链使全仓门禁初次失败] → 先对现有 1,300 余份 Markdown 全量扫描，逐项修复或以证据确认，再将检查加入默认门禁。

## Migration Plan

新增静态检查和测试、修复基线发现的断链、更新说明；不涉及发布产物迁移。若检查器误报，可回滚独立检查器和静态命令接入，现有 HTML 与索引检查仍可单独运行。
