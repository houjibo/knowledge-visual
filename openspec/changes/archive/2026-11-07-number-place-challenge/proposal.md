## Why
万以内数挑战的五种题型使用随机去重或递归重试，在重复随机值下可能阻塞；拨珠只能通过指针操作，重置后的延时可能影响当前题。

## What Changes
使用有限候选生成各题选项，按已有数位选题；提供具名键盘拨珠按钮，重置或重开时取消旧计时器，零分不显示奖励星。

## Capabilities
### New Capabilities
- `number-place-challenge`: 可操作且有限生成的万以内数练习。

### Modified Capabilities

## Impact
小学数学万以内数页面、浏览器回归和交互证据。
