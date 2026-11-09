## Why

植树问题页面在脚本初始化时生成首道练习题；随机值重复时，干扰项重抽循环会持续得到同一个数字并阻塞整页。固定随机值可稳定触发这一问题，需用有限候选保证页面能加载且练习可继续。

## What Changes

- 用有限、互异且为正整数的候选生成植树练习选项，保留原答案和邻近干扰项规则。
- 为固定随机值、正确判分、下一题和窄屏布局增加浏览器回归。
- 更新交互证据、风险与差距索引。

## Capabilities

### New Capabilities

- `tree-planting-finite-quiz-options`: 植树问题练习有限生成唯一选项。

### Modified Capabilities

无。

## Impact

- 修改 `math/topics/tree-planting/index.html`。
- 新增并注册 Playwright 浏览器回归，更新交互证据、风险/覆盖索引和 `docs/gaps.md`。
- 不增加依赖，不改变植树问题的题意、答案、计分或反馈规则。
