## Why
鸡兔同笼挑战依赖随机重试补选，可能卡住；同题可重复计数，假设法提示方向不准确；探索无整数解时仍画出似乎有效的动物组合。

## What Changes
- 使用有限候选并按题锁定作答，保留反馈直到主动换题。
- 校正假设法多或少的方向，失败保存时不声称已保存。
- 探索没有整数解时不绘制误导的动物组合，并关联滑块标签。

## Capabilities
### New Capabilities
- `chicken-rabbit-learning-correctness`: 鸡兔同笼题目及可视化正确性。

### Modified Capabilities

## Impact
小学数学鸡兔同笼主题、浏览器回归及交互风险记录。
