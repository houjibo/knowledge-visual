# interaction-risk-inventory Specification

## Purpose
本规格规范交互线索可重复生成，核心边界为：系统必须从仓库 HTML 中稳定生成候选 div 控件和内联 while 的页面与行号，并明确扫描限制与非验收性质。

## Requirements

### Requirement: 交互线索可重复生成
系统 SHALL 从仓库 HTML 中稳定生成候选 div 控件和内联 while 的页面与行号，并明确扫描限制与非验收性质。

#### Scenario: 修改被扫描页面
- **WHEN** 页面中的候选位置变化而报告尚未重新生成
- **THEN** 静态检查报告清单过期

#### Scenario: 存在候选线索
- **WHEN** 页面含匹配类名的 div 或内联 while
- **THEN** 报告给出页面和行号，但不声称该行为一定有缺陷
