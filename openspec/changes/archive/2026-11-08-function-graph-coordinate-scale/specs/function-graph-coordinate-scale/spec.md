## ADDED Requirements

### Requirement: 图像刻度与曲线坐标一致

函数图像画布 SHALL 使用与曲线相同的坐标映射绘制网格和数字刻度，并说明横纵显示比例；定义域画布的数字刻度 SHALL 对应其曲线坐标。

#### Scenario: 二次函数代表点

- **WHEN** 查看 y=x²
- **THEN** (1,1) 与 x=1、y=1 的刻度和网格对应

#### Scenario: 定义域探索

- **WHEN** 查看定义域示例图
- **THEN** 横纵刻度按图示范围 −5 至 5 显示且不改变曲线坐标
