# surface-area-geometry-and-answers Specification

## Purpose
TBD - created by archiving change surface-area-geometry-and-answers. Update Purpose after archive.

## Requirements

### Requirement: 表面积示意图对应同一立体
页面 SHALL 展示公共棱相接的立体示意，并以一致尺寸展示展开图的六个面。

#### Scenario: 查看长方体展开图
- **WHEN** 学习者查看展开图
- **THEN** 三对相对面尺寸相等，侧面的宽与顶面的宽一致

### Requirement: 生活题答案符合计算条件
页面 SHALL 为所述尺寸和条件提供正确表面积或粉刷面积。

#### Scenario: 墙面和天花板
- **WHEN** 房间长 5 米、宽 4 米、高 3 米，不扣门窗且不刷地面
- **THEN** 正确面积为 74 平方米

#### Scenario: 手机盒包装
- **WHEN** 长方体盒长 18 厘米、宽 10 厘米、高 5 厘米且不计搭接损耗
- **THEN** 所需最小面积为 640 平方厘米
