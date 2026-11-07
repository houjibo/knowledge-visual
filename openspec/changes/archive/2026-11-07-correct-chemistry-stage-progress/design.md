## Context

`chemistry/high/index.html` 和 `chemistry/uni/index.html` 分别有 16 和 17 个 topic-card；`chemistry/index.html` 的 STAGES 数组两项都是 13。本地存储按学段分别保存完成的 slug。

## Goals / Non-Goals

修正高中和大学分母，保持存储 key 与显示方式。此切片不重新设计进度语义，不处理历史无效 slug 或其他学科。

## Decisions

采用当前代码既有的静态总数方式，按导航核对两个值；避免在此切片引入跨文件运行时加载，保持 file:// 使用方式。后续将静态数字漂移列入差距并探索更可靠的校验。

## Risks / Trade-offs

以后主题变更时数字仍可能漂移；检查本次导航数量和实际脚本输出。百分比对历史异常存储值无上限，未在此变更处理。
