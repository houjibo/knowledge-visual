## Context

见 [proposal.md](proposal.md)。主规格共有 231 份，扫描发现 162 个用途仍为 CLI 归档提示；每份占位都能对应到唯一归档变更，且 162 份规格共有 453 个行为需求，可用需求标题和场景核对用途范围。

## Goals / Non-Goals

**Goals:**

- 每个主规格 Purpose 准确概括该规格覆盖的能力与关键边界，避免机械重复的泛化描述。
- 添加可重复的守卫，检查主规格数量、Purpose 存在、最小长度及占位词。
- 让新规格归档流程提醒维护者在归档前后检查主规格用途。

**Non-Goals:**

- 不改动这 162 份规格的 Requirement、Scenario 或行为承诺。
- 不把当前完整的 231 份规格批量重写为新模板，也不改动已满足标准的用途文字。
- 不以自动生成的 slug 翻译代替逐份阅读需求定义。

## Decisions

- **以规格正文为用途的主要证据。** 用需求名称、前置说明及场景核对边界；对应的归档 proposal 用于补充动机，不能覆盖主规格当前契约。
- **只修改精确占位的 Purpose。** 仅定位包含 `TBD - created by archiving` 的 Purpose 段落并替换，保留其余正文和 Markdown 结构；先检查生成差异和数量。
- **用途至少 50 个字符且无占位文本。** 与当前 OpenSpec CLI 对新 capability Purpose 的严格检查保持一致；静态守卫对全部主规格逐个报告路径，CLI 严格校验继续作为第二层检查。
- **把守卫接入静态门禁。** `npm run check:static` 和 CI 都会执行；测试覆盖占位、过短、有效用途和已改 Requirements 不应被改写。

## Risks / Trade-offs

- [需求标题可能不足以概括复合能力] → 同时查看 Requirement 描述、Scenario 和对应 archive proposal；对范围冲突以主规格契约为准。
- [批量编辑意外改写需求正文] → 写入前保存各规格非 Purpose 内容并在写入后逐项对比，保证差异只落在占位段。
- [50 字符守卫只约束长度，不保证语义质量] → 逐份审阅用途并运行严格校验；后续仍按功能变更更新 Purpose。

## Migration Plan

先生成 162 份规格到 Purpose 的候选映射并审阅，再替换占位、加入静态守卫和测试，运行 `npm run check:static`、完整 `npm run check` 及严格 OpenSpec 校验。推送后核对 Actions；该文档变更不修改站点页面，发布清单与部署结果仍按仓库统一门禁验收。若发现描述越出契约范围，修正对应 Purpose 后再归档。
