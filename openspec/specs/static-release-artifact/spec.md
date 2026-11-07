# static-release-artifact Specification

## Purpose
TBD - created by archiving change static-release-artifact. Update Purpose after archive.

## Requirements

### Requirement: 发布产物只包含受控站点文件
系统 SHALL 从版本跟踪的受控站点目录及文件类型生成静态发布包，拒绝覆盖已有输出目录，并检查包内声明的 HTML 本地引用。

#### Scenario: 构建发布包
- **WHEN** 维护者指定不存在的输出目录构建发布包
- **THEN** 输出包含首页、学科页面和所需静态资源，不包含开发文档、测试、隐藏文件或备份

#### Scenario: 输出目录已存在
- **WHEN** 维护者指定已存在的目录
- **THEN** 构建失败且不覆盖目录内容

### Requirement: 子路径中的代表性学习操作可用
发布包 SHALL 在子路径提供首页查找及各学科代表性导航和交互。

#### Scenario: 从首页进入主题
- **WHEN** 学习者在子路径部署的站点从首页查找或进入四学科代表主题
- **THEN** 页面及资源加载，所选学习交互可用
