## ADDED Requirements

### Requirement: 发布包提供可核对的来源
构建 SHALL 生成包含完整提交哈希和已跟踪站点文件修改状态的公开清单。

#### Scenario: 干净站点文件构建
- **WHEN** 所有已跟踪站点文件与 HEAD 一致
- **THEN** 清单记录 HEAD 哈希和未修改状态

#### Scenario: 本地站点文件被修改
- **WHEN** 已跟踪站点文件与 HEAD 不一致（包括增删）
- **THEN** 清单记录 HEAD 哈希并标记站点文件已修改

### Requirement: 自动部署核验来源
流水线 SHALL 在部署前校验发布清单所记录的提交与工作流提交一致且站点文件未修改。

#### Scenario: 发布子路径访问
- **WHEN** 通过项目站子路径访问发布包
- **THEN** 可以读取来源清单并核对其中的版本
