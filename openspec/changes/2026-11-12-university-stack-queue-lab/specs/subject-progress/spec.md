## ADDED Requirements

### Requirement: 大学计算机独立进度

站点 SHALL 仅在完成栈与队列两轮正确预测后尝试写入 `kv-computer-uni-progress`，大学计算机目录和首页 SHALL 仅统计已存在主题的有效完成标记。写入拒绝或记录损坏 SHALL 不伪称已保存，并允许重试已赢得的完成资格。

#### Scenario: 存储拒绝与重试
- **WHEN** 学习者完成两轮预测但浏览器拒绝本机写入
- **THEN** 页面提示保存失败，保留本页已赢得资格；写入恢复后可重试并在大学目录和首页看到完成记录
