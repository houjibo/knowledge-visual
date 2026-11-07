## Why
数学主题共享进度在写入失败时保留内存记录，但多数页面没有明确提示或主动重试入口，学习者可能离开页面后才发现进度丢失。

## What Changes
四学段出现可访问的未保存提示和重试按钮，恢复写入后确认保存并同步已有的主题进度状态。

## Capabilities
### New Capabilities

### Modified Capabilities
- `math-progress-identity`: 新增写入失败反馈与本页重试。

## Impact
数学四学段进度脚本、两个已有独立进度状态的主题，以及浏览器测试。
