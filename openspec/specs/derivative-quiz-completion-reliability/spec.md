# derivative-quiz-completion-reliability Specification

## Purpose
本规格规范导数练习按回合可靠计分，核心边界为：导数练习必须在每题首次选择后锁定，手动切换下一题，并在六题结束后保留成绩；一轮至少答对四题才尝试记录完成。

## Requirements

### Requirement: 导数练习按回合可靠计分

导数练习 SHALL 在每题首次选择后锁定，手动切换下一题，并在六题结束后保留成绩；一轮至少答对四题才尝试记录完成。

#### Scenario: 重复选择及切换模式

- **WHEN** 学习者作答后重复选择或切换模式再返回
- **THEN** 本题状态与分数保持不变，未出现自动切题

#### Scenario: 保存失败后重试

- **WHEN** 通过一轮但本地存储失败
- **THEN** 显示未保存和重试入口，成功后才提示记录已保存
