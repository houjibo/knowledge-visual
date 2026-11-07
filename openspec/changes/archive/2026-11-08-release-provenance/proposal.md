## Why
发布后需要核验公网内容对应的版本，现有发布包没有机器可读的提交信息，无法从公开站点直接确认部署的版本。工作区可能包含相对于提交的修改，本地构建也不能把它误称为干净提交。

## What Changes
构建时生成可公开访问的版本清单，记录 Git 提交和已跟踪站点文件是否修改；部署流水线校验清单与本次提交一致且站点文件无修改。

## Capabilities
### New Capabilities
- `release-provenance`: 发布包版本清单及自动部署前一致性检查。

### Modified Capabilities

## Impact
静态发布包、GitHub Actions、发布测试和站点运营文档；不改变学习内容或持久数据。
