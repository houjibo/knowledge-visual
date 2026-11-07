## Why
100以内数的数序选项依赖随机重试，可能阻塞整页；答对后自动换题且重复提交可能重复计分，页面也缺少可恢复的完成记录。

## What Changes
- 从有限范围生成数序选项并允许学习者主动换题，正确后锁定本题。
- 校验计数与组成输入，四种活动各答对一题后保存完成记录。

## Capabilities
### New Capabilities
- `numbers-within-100-learning-reliability`: 百以内数的出题、答题和学习进度。

### Modified Capabilities

## Impact
小学数学100以内数页面、共享进度与浏览器回归；真实设备和完整无障碍尚需验收。
