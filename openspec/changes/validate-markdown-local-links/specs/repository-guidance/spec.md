## MODIFIED Requirements

### Requirement: 可重复的基础检查
仓库 SHALL 提供本地可运行的检查，发现 HTML 中静态声明的本地资源引用、仓库 Markdown 文件中的本地链接目标和工程索引链接中不存在或逃逸仓库的目标，并以非零状态报告错误来源及目标。

#### Scenario: 引用丢失
- **WHEN** 被检查的 HTML 或 Markdown 本地引用指向仓库外部或不存在的文件或目录
- **THEN** 检查报告来源文件、行号和目标，并以非零状态退出

#### Scenario: 检查 Markdown 链接
- **WHEN** 仓库 Markdown 文档包含行内链接、图片链接或引用式链接
- **THEN** 检查解析其本地路径目标；文件或目录存在时通过，外部 URL 与纯片段链接不作为仓库文件检查

#### Scenario: 忽略 Markdown 代码样例
- **WHEN** 代码围栏或行内代码中出现链接语法
- **THEN** 检查不把样例内容当作实际文档链接
