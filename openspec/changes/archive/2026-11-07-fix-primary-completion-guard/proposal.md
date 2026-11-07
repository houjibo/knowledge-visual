## Why

四个小学主题以 window.PageProgress 判断进度接口，但公共脚本用顶层 const 声明它，不会创建同名 window 属性；达到挑战门槛时因此不会记录完成。

## What Changes

- 修正测量、混合运算、大数、时分秒主题的接口存在性判断。
- 增加覆盖接口存在、缺失和已完成状态的回归检查，保留原挑战门槛和存储格式。

## Capabilities

### New Capabilities

- `primary-completion`: 小学主题在满足页面原有挑战门槛后记录学习完成。

### Modified Capabilities

无。

## Impact

四个小学主题页及进度回归测试；不修改学习内容或其他主题门槛。
