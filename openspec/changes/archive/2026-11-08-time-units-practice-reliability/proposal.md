## Why
小学“时分秒”主题的经过时间和排序题依赖无界随机重试，重复随机值可使页面初始化卡住；混合单位换算切换后会引用不存在的控件，多种练习还可重复计分或被旧定时器覆盖。

## What Changes
采用有限候选生成，修复换算题切换与午夜进位，并让每题只计分一次、由学习者主动换题；核对挑战选项及进度保存失败反馈。

## Capabilities
### New Capabilities
- `time-units-practice-reliability`: 时分秒练习的有限生成、计分和进度反馈。

### Modified Capabilities

## Impact
小学数学时分秒主题、浏览器测试和差距记录；保持现有完成记录格式。
