# sets-venn-responsive-relations Specification

## Purpose
本规格规范Venn 关系在窄屏保持可见和正确，核心边界为：Venn 关系图必须适应 320 像素及以上视口，保持集合圆为圆，并在缩放后正确表达包含、相交与不相交。

## Requirements

### Requirement: Venn 关系在窄屏保持可见和正确

Venn 关系图 SHALL 适应 320 像素及以上视口，保持集合圆为圆，并在缩放后正确表达包含、相交与不相交。

#### Scenario: 320 像素视口

- **WHEN** 学习者在 320 像素视口切换集合关系
- **THEN** 页面不因关系图产生横向溢出，圆形与文字完整可见

#### Scenario: 切换关系

- **WHEN** 选择子集、超集、相交或不相交
- **THEN** 圆的几何位置与对应关系一致，所选状态与说明同步
