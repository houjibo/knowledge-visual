## Why
全站加载检查发现估算页面偶发超时：剩余金额估为 0 时，随机干扰项最多只有两个可用正数，无法生成四个选项；其他随机重试也可能长期重复。

## What Changes
以有限候选生成所有估算题选项和非边界数；明确各题四舍五入规则，覆盖零余额、重复随机值和四种生活题型。

## Capabilities
### New Capabilities
- `bounded-estimation-questions`: 有限终止的估算题生成。

### Modified Capabilities

## Impact
小学数学估算主题、浏览器回归和风险盘点。
