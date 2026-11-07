## Why

数学四学段共用无学段信息的完成记录，六个同名 slug 会把一个学段的学习误认为其他学段也已完成；历史同名记录无法可靠归属。

## What Changes

- 新完成记录使用学段和主题共同标识，避免新记录互相污染。
- 保留原始旧记录，对无歧义旧记录继续显示，对同名旧记录明确提示学段不明，不静默分配或删除。
- 更新首页及数学学段汇总与对应回归检查。

## Capabilities

### New Capabilities

- `math-progress-identity`: 按学段隔离数学进度并安全处理旧的无学段记录。

### Modified Capabilities

无。

## Impact

修改数学进度公共脚本、数学入口、首页与验证；旧 localStorage 保留，可回退代码读取，期间新记录不写入旧格式。
