## Why

物理三个学段的进度分母与导航中的主题数不一致，导致完成比例失真；化学也曾出现相同问题。

## What Changes

- 修正物理学段进度分母，并保持既有进度存储。
- 增加化学、物理学段进度与主题卡片数量的一致性检查，发现漂移时报错。

## Capabilities

### New Capabilities

- `physics-progress`: 物理学段入口显示与其主题数一致的学习进度。

### Modified Capabilities

- `repository-guidance`: 基础检查增加对物理和化学学段进度总数漂移的检测。

## Impact

影响物理入口进度显示、仓库检查脚本与验证文档，不改变主题内容或本地进度数据。
