## Context
滑块显示 0～40°C 却称太阳温度；图示按单一温度阈值决定雨雪，页面把它叙述成自然规律；动态图形不可暂停。

## Goals / Non-Goals
把可调值表述为简化环境温度，明确图示限制、不可见水蒸气及真实蒸发影响因素，允许暂停动画；不构建天气预报或完整水循环模型。

## Decisions
说明模型假定水面与近地气温相近、湿度和风不变，保留原有的示意阈值但明确不是预测；文字说明真实降水依赖不同高度的条件。动画暂停时保持粒子与波浪时间，温度仍可调整；练习选项原生禁用。

## 科学依据
[USGS 水循环术语](https://www.usgs.gov/glossary/glossary-water-cycle-terms) 说明水蒸气不可见和凝结定义；[USGS 蒸发测量](https://www.usgs.gov/publications/instructions-measuring-rate-evaporation-water-surfaces) 指出水温、风与空气干湿影响蒸发；[美国国家气象局降水类型](https://preview.weather.gov/ama/preciptypes) 说明降水类型受垂直气温分布影响。由实施者核对页面描述，未进行完整科学教材审核。

## Risks / Trade-offs
粒子生成与云雨仍是定性动画，阈值不表示真实气象规律；用户暂停时继续刷新静态画面以响应控件变化，物理时间不前进。
