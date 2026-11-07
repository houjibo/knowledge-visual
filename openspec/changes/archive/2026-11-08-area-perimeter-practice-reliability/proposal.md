## Why
面积与周长页面的回车可重复计分，普通练习连对被计入挑战完成条件；面积相等时比较题递归重新生成可能无法结束，自动换题也会让反馈过早消失。

## What Changes
每题只允许一次有效计分，分开挑战和练习的连对记录，比较题接受相等面积，改为主动换题并校验整数输入。

## Capabilities
### New Capabilities
- `area-perimeter-practice-reliability`: 面积周长练习及挑战可靠性。

### Modified Capabilities

## Impact
小学数学面积与周长专题、学习进度和浏览器测试；沿用共享存储与失败重试机制。
