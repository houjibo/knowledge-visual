## Why
首页按存储对象的所有键统计部分学科，导致失效主题和未完成记录被算作完成；目录或存储不可用时又误显示尚未开始。

## What Changes
用现有学科及学段主题目录校验进度，只计入有效完成记录，并区分不可用状态；保留数学旧记录与学段不明提示。

## Capabilities
### New Capabilities
- `homepage-progress-validity`: 基于有效主题和可用存储的首页进度汇总。

### Modified Capabilities

## Impact
首页进度统计、主题目录加载顺序及浏览器回归；不修改学习者存储数据。
