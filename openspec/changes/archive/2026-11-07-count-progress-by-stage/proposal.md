## Why

首页将不同学段存储中的同名 slug 合并，导致物理跨学段主题分别完成时被少计；例如初中与高中均有 motion。

## What Changes

- 按学段存储分别累计首页学科进度，保留各学段独立完成记录。
- 不迁移数据，不改变数学共享存储和主题完成判定。

## Capabilities

### New Capabilities

- `subject-progress`: 首页按独立存储中的学习记录汇总学科进度。

### Modified Capabilities

无。

## Impact

影响首页学科进度数字，不影响页面路径、主题或存储结构。
