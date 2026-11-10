# forces-touch-interaction Specification

## Purpose
本规格确保物理力主题画布支持触屏拖动，同时保留鼠标拖动与键盘按钮操作，让不同输入方式都能完成同一探索活动。

## Requirements

### Requirement: 画布支持触摸操作
力主题的画布 SHALL 支持触屏拖动，并保留鼠标和键盘按钮操作。

#### Scenario: 手指拉伸弹簧
- **WHEN** 学习者在弹簧右端按下并向右移动手指
- **THEN** 弹簧随手指伸长，释放后恢复

#### Scenario: 触摸被取消
- **WHEN** 当前触摸被系统取消或捕获丢失
- **THEN** 画布结束拖动，弹簧恢复且下一次操作可用

#### Scenario: 手机滚动页面
- **WHEN** 学习者在手机上查看画布操作提示
- **THEN** 页面说明可以在画布外滚动
