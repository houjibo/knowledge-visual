## Why
初中、高中和大学数学目录只在加载时渲染完成徽章，其他标签页修改或浏览器返回后状态可能过期；存储损坏时也没有明确提示。

## What Changes
三个学段目录共享进度读取与刷新逻辑，存储不可读时保留数据并提示，返回或跨标签变更后更新徽章。

## Capabilities
### New Capabilities
- `math-stage-directory-progress`: 数学学段目录进度可用性及刷新。

### Modified Capabilities

## Impact
初中、高中、大学数学目录、新增共享脚本、发布包与浏览器测试；保持原存储格式与旧记录兼容。
