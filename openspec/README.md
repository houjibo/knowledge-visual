# OpenSpec

使用 OpenSpec CLI（初始化时为 1.10.0）管理可验证增量，`config.yaml` 使用 `spec-driven` schema 和中文内容。CLI 安装与用法见 [官方文档](https://github.com/Fission-AI/OpenSpec)。

- `openspec new change <name>` 创建变更；`openspec status --change <name>` 查看工件状态。
- `openspec instructions <artifact> --change <name>` 获取当前版本要求；依次准备 proposal、specs、design 和 tasks，实施并记录证据。
- `openspec validate --all --strict` 校验，完成后 `openspec archive <name>` 归档并同步规格。归档前后都要检查主规格的 `## Purpose`：按当前需求写明能力和边界，禁止保留 CLI 生成的占位；`npm run check:static` 会检查用途缺失、少于 50 个字符及归档占位。纯文档、工具或不改变行为的重构若没有规格增量，按 CLI 指引在变更元数据设置 `skip_specs: true`。
- `changes/` 是当前变更和历史，`specs/` 是已归档的当前契约。定期复核 [差距](../docs/gaps.md)，将有证据且有价值的工作切成新的变更；这是一种人工或代理执行的流程，不代表后台服务已自动运行。
