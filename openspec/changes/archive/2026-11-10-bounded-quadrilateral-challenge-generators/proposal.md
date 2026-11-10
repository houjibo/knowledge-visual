## Why

四边形挑战的长方形题会在随机源连续返回相同值时无限重抽边长，阻塞整页交互；部分长方形和正方形题还可能出现重复选项，使同一答案看起来既对又错。此次按静态风险线索复核，补齐这类生成边界。

## What Changes

- 长方形题从有限候选中生成互不相同的边长，并确保四个答案选项互异。
- 正方形周长题确保干扰项与正确答案及彼此不同。
- 为随机值固定、边界边长和所有挑战题型增加浏览器回归。

## Capabilities

### New Capabilities

- `quadrilaterals-challenge-learning`: 规范四边形挑战题目的有限生成、边长条件及答案唯一性。

### Modified Capabilities

无。

## Impact

影响 `math/topics/quadrilaterals/index.html`、其 Playwright 浏览器回归、`docs/gaps.md` 与 `docs/assessments/interaction-coverage.md`。不新增依赖，不改变其他学科、进度格式或静态发布流程。
