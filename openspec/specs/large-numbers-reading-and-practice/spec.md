# large-numbers-reading-and-practice Specification

## Purpose
确保大数的认识页面按数级准确读出中间的零、可靠生成读数题，并让学习者通过数位交互和逐题反馈理解大数的表示。

## Requirements

### Requirement: 跨数级读数正确
页面 SHALL 按四位一组读取亿、万和个级，中间缺位只读一个零，末尾零不读；读数选项 SHALL 有限生成且不重复。

#### Scenario: 万级前导零
- **WHEN** 学习者阅读 100010000
- **THEN** 页面读作一亿零一万

#### Scenario: 跨空级
- **WHEN** 学习者阅读 100000001
- **THEN** 页面读作一亿零一

### Requirement: 数位与逐题反馈可靠
数位上的数字 SHALL 响应键盘及指针并显示对应数位；读数、写数、比较和近似数 SHALL 逐题计分并允许主动换题。

#### Scenario: 数位选择
- **WHEN** 学习者选择数字的某一位
- **THEN** 页面显示该位对应的数位和值

#### Scenario: 重复提交
- **WHEN** 学习者重复提交同一道题
- **THEN** 本题仅计分一次，反馈保留至主动换题
