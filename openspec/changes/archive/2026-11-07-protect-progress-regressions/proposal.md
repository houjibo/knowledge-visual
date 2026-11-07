## Why

近期发现并修复多个学习进度统计问题；临时验证不会随仓库保留，后续调整容易再次引入相同错误。

## What Changes

- 为首页、数学及物理化学学段进度添加可重复的轻量回归检查。
- 文档说明运行方式和模拟环境的覆盖边界。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

无；只为已有行为增加验证，不改变产品契约。

## Impact

增加使用 Node.js 内置模块的测试脚本和文档，不引入运行时依赖。
