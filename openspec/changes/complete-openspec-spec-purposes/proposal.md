## Why

当前 231 个主规格中有 162 个保留 `openspec archive` 自动生成的 `TBD` 用途占位。它们虽然保留了需求正文，但维护者和代理无法从规格入口快速判断能力边界；需要依据每份规格的实际需求补全用途，并让后续归档受自动检查保护。

## What Changes

- 阅读每个占位规格的需求与场景，为 162 个主规格写出具体、可检索的中文 `Purpose`。
- 增加本地静态守卫，拒绝缺失、过短或仍含归档占位文字的主规格用途，并接入 `npm run check:static`。
- 更新 OpenSpec 工作说明与差距台账，确保新能力在归档后检查用途完整。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `repository-guidance`: 已归档能力规格都要保有可理解的用途说明，静态检查应能发现占位和无效用途。

## Impact

- 162 份 `openspec/specs/*/spec.md` 的 Purpose 内容。
- `scripts/`、静态检查测试及 `package.json` 检查脚本。
- `openspec/README.md`、`docs/gaps.md` 和仓库指南规格。
