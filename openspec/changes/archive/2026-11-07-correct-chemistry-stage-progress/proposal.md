## Why

化学入口的高中、大学卡片分别列出 16、17 个主题，进度脚本却都以 13 为分母，导致学习者看到错误的完成数和百分比。

## What Changes

- 修正化学入口学段进度的分母，使其与对应学段导航中的主题数量一致。
- 记录并检查零进度与部分进度，保留现有本地存储格式。

## Capabilities

### New Capabilities

- `chemistry-progress`: 化学学段入口显示与其主题数一致的学习进度。

### Modified Capabilities

无。

## Impact

仅影响 `chemistry/index.html` 的进度汇总，不改变主题、完成规则或持久化格式。
