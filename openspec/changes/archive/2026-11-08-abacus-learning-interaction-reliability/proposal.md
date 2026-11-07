## Why
算盘页面读数选项可能因随机重复卡住，珠子图形存在重叠，拨珠没有键盘替代，并且拨数和限时挑战可以重复提交同一题计分。

## What Changes
- 让珠子间距与每档数字状态一致，提供各档数值的键盘选择。
- 用有限选项生成读数题，反馈保留至主动下一题。
- 限制拨数和限时挑战每题只计分一次，清理旧挑战回调。

## Capabilities
### New Capabilities
- `abacus-learning-interaction-reliability`: 算盘图示、键盘操作和练习可靠性。

### Modified Capabilities

## Impact
小学数学认识算盘页面和浏览器测试；挑战切换模式时的计时策略和主题进度暂不改变。
